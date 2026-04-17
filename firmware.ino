/*
  Hayat Bracelet Firmware
  -----------------------
  Hardware:
    - ESP32 dev board
    - MAX30102 pulse oximeter (I2C: SDA=21, SCL=22)
    - MPU6050 accelerometer + gyroscope (I2C, shared bus)
    - LiPo battery + TP4056 charger
    - Optional: coin vibration motor on GPIO 25 for haptic feedback

  Libraries (install via Arduino Library Manager):
    - "SparkFun MAX3010x Pulse and Proximity Sensor Library"
    - "Adafruit MPU6050" + dependencies (Adafruit Unified Sensor, Adafruit BusIO)
    - "ArduinoJson" by Benoit Blanchon
    - WiFi, HTTPClient (bundled with ESP32 Arduino core)

  Flow:
    1. Connect to Wi-Fi
    2. Calibrate baseline HR/HRV over first ~2 minutes
    3. Every 1 s, read MAX30102 + MPU6050
    4. Compute a rolling stress score based on HR deviation, HRV drop, motion
    5. If score stays above threshold for N seconds, POST to backend
*/

#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

// ========= CONFIG =========
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* API_URL       = "http://YOUR_SERVER_IP:8000/api/stress";
const char* CHILD_ID      = "default";

const int STRESS_THRESHOLD   = 75;   // 0-100 stress score
const int SUSTAIN_SECONDS    = 15;   // must be above threshold for this long
const int CALIBRATION_SEC    = 120;  // time to learn baseline
const int VIBRATION_PIN      = 25;   // optional haptic
const int POST_COOLDOWN_SEC  = 60;   // min seconds between alerts

// ========= SENSORS =========
MAX30105 pulseOx;
Adafruit_MPU6050 mpu;

// ========= STATE =========
const int RATE_SIZE = 8;
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;

float rrIntervals[20];
int   rrCount = 0;

float baselineHR  = 0;
float baselineHRV = 0;
bool  calibrated  = false;
unsigned long calibStart = 0;

float currentHR  = 0;
float currentHRV = 0;
float currentMotion = 0;

int  aboveThresholdSeconds = 0;
unsigned long lastAlertMs  = 0;

// ========= WIFI =========
void connectWifi() {
  Serial.print("Wi-Fi connecting");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 40) {
    delay(500);
    Serial.print(".");
    tries++;
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Connected. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("Wi-Fi FAILED (will retry)");
  }
}

// ========= SENSORS INIT =========
void initSensors() {
  Wire.begin();

  if (!pulseOx.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 not found. Check wiring.");
    while (1) delay(100);
  }
  pulseOx.setup();
  pulseOx.setPulseAmplitudeRed(0x0A);
  pulseOx.setPulseAmplitudeGreen(0);

  if (!mpu.begin()) {
    Serial.println("MPU6050 not found. Check wiring.");
    while (1) delay(100);
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_4_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  Serial.println("Sensors initialized.");
}

// ========= PULSE / HRV =========
void readPulse() {
  long irValue = pulseOx.getIR();
  if (checkForBeat(irValue)) {
    long delta = millis() - lastBeat;
    lastBeat = millis();
    float beatsPerMinute = 60.0 / (delta / 1000.0);

    if (beatsPerMinute > 40 && beatsPerMinute < 180) {
      rates[rateSpot++] = (byte)beatsPerMinute;
      rateSpot %= RATE_SIZE;

      float avgBPM = 0;
      for (byte i = 0; i < RATE_SIZE; i++) avgBPM += rates[i];
      avgBPM /= RATE_SIZE;
      currentHR = avgBPM;

      // R-R interval in ms, for RMSSD HRV
      if (rrCount < 20) {
        rrIntervals[rrCount++] = delta;
      } else {
        for (int i = 0; i < 19; i++) rrIntervals[i] = rrIntervals[i + 1];
        rrIntervals[19] = delta;
      }

      // RMSSD
      if (rrCount >= 5) {
        float sumSq = 0;
        int n = rrCount - 1;
        for (int i = 0; i < n; i++) {
          float diff = rrIntervals[i + 1] - rrIntervals[i];
          sumSq += diff * diff;
        }
        currentHRV = sqrt(sumSq / n);
      }
    }
  }
}

// ========= MOTION =========
void readMotion() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  float accMag = sqrt(
    a.acceleration.x * a.acceleration.x +
    a.acceleration.y * a.acceleration.y +
    a.acceleration.z * a.acceleration.z
  );
  // remove gravity (~9.8 m/s^2), smooth
  float motion = abs(accMag - 9.8);
  currentMotion = 0.7 * currentMotion + 0.3 * motion;
}

// ========= STRESS SCORE =========
float computeStressScore() {
  if (!calibrated) return 0;

  // Normalized HR deviation: positive when above baseline
  float hrDev = (currentHR - baselineHR) / max(baselineHR * 0.3f, 10.0f);
  hrDev = constrain(hrDev, 0.0f, 1.0f);

  // HRV drop: positive when HRV is below baseline
  float hrvDrop = 0;
  if (baselineHRV > 0 && currentHRV > 0) {
    hrvDrop = (baselineHRV - currentHRV) / baselineHRV;
    hrvDrop = constrain(hrvDrop, 0.0f, 1.0f);
  }

  // Motion intensity above calm threshold
  float motionFactor = constrain(currentMotion / 5.0f, 0.0f, 1.0f);

  // Weighted composite (tweak weights against real data)
  float score = (0.45 * hrDev + 0.35 * hrvDrop + 0.20 * motionFactor) * 100.0;
  return constrain(score, 0.0f, 100.0f);
}

// ========= CALIBRATION =========
void maybeCalibrate() {
  if (calibrated) return;
  unsigned long elapsed = (millis() - calibStart) / 1000;

  static float hrSum = 0, hrvSum = 0;
  static int hrN = 0, hrvN = 0;
  if (currentHR > 0) { hrSum += currentHR; hrN++; }
  if (currentHRV > 0) { hrvSum += currentHRV; hrvN++; }

  if (elapsed >= CALIBRATION_SEC && hrN > 30) {
    baselineHR  = hrSum / hrN;
    baselineHRV = hrvN > 0 ? hrvSum / hrvN : 40.0;
    calibrated  = true;
    Serial.printf("Calibrated. baselineHR=%.1f bpm  baselineHRV=%.1f ms\n",
                  baselineHR, baselineHRV);
  } else if (elapsed % 15 == 0) {
    Serial.printf("Calibrating... %lu/%d sec\n", elapsed, CALIBRATION_SEC);
  }
}

// ========= POST ALERT =========
void postStressEvent(float score) {
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
    if (WiFi.status() != WL_CONNECTED) return;
  }

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["child_id"]          = CHILD_ID;
  doc["level"]             = score;
  doc["heart_rate"]        = currentHR;
  doc["hrv"]               = currentHRV;
  doc["movement_intensity"] = currentMotion;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  Serial.printf("POST %s -> %d\n", API_URL, code);
  http.end();

  // Haptic buzz to the child so they know a caregiver was notified
  pinMode(VIBRATION_PIN, OUTPUT);
  digitalWrite(VIBRATION_PIN, HIGH);
  delay(250);
  digitalWrite(VIBRATION_PIN, LOW);
}

// ========= SETUP / LOOP =========
void setup() {
  Serial.begin(115200);
  delay(500);
  pinMode(VIBRATION_PIN, OUTPUT);
  digitalWrite(VIBRATION_PIN, LOW);

  initSensors();
  connectWifi();
  calibStart = millis();

  Serial.println("Hayat bracelet running.");
}

void loop() {
  readPulse();

  static unsigned long lastSecondTick = 0;
  if (millis() - lastSecondTick < 1000) return;
  lastSecondTick = millis();

  readMotion();
  maybeCalibrate();

  float score = computeStressScore();
  Serial.printf("HR=%.0f HRV=%.0f motion=%.2f score=%.0f\n",
                currentHR, currentHRV, currentMotion, score);

  if (calibrated) {
    if (score >= STRESS_THRESHOLD) {
      aboveThresholdSeconds++;
    } else {
      aboveThresholdSeconds = 0;
    }

    bool cooldownOK = (millis() - lastAlertMs) / 1000 > POST_COOLDOWN_SEC;
    if (aboveThresholdSeconds >= SUSTAIN_SECONDS && cooldownOK) {
      Serial.println(">> STRESS EVENT: posting to server");
      postStressEvent(score);
      lastAlertMs = millis();
      aboveThresholdSeconds = 0;
    }
  }
}
