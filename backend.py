"""
Hayat Backend API
-----------------
Receives:
  - Stress events from the ESP32 bracelet (HTTP POST from firmware)
  - Icon taps from the child web app (HTTP POST from React frontend)

Serves:
  - Event history, filtering, and real-time updates (WebSocket)
  - Push notification dispatch to parent's phone (FCM / optional WhatsApp)

Run:
  pip install fastapi uvicorn sqlalchemy pydantic python-multipart
  uvicorn backend:app --host 0.0.0.0 --port 8000 --reload
"""

from datetime import datetime
from typing import List, Optional, Literal
import asyncio
import json
import os
import urllib.parse
import urllib.request

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# ------------------------ Database ------------------------

DATABASE_URL = "sqlite:///./hayat.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(String, index=True, default="default")
    type = Column(String, index=True)            # "tap" or "stress"
    category = Column(String, nullable=True)     # feelings | needs | requests | sensory
    item_id = Column(String, nullable=True)
    label = Column(String, nullable=True)
    label_ar = Column(String, nullable=True)
    level = Column(Float, nullable=True)         # stress score 0-100
    heart_rate = Column(Float, nullable=True)
    hrv = Column(Float, nullable=True)
    acknowledged = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class ChildProfile(Base):
    __tablename__ = "children"
    id = Column(String, primary_key=True)
    name = Column(String)
    parent_device_token = Column(String, nullable=True)   # FCM token
    parent_phone = Column(String, nullable=True)          # WhatsApp number
    stress_threshold = Column(Integer, default=75)
    baseline_hr = Column(Float, nullable=True)
    baseline_hrv = Column(Float, nullable=True)


Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ------------------------ Schemas ------------------------

class TapIn(BaseModel):
    child_id: str = "default"
    category: Literal["feelings", "needs", "requests", "sensory"]
    item_id: str
    label: str
    label_ar: Optional[str] = None


class StressIn(BaseModel):
    """Payload from the ESP32 bracelet."""
    child_id: str = "default"
    level: float = Field(..., ge=0, le=100)
    heart_rate: float
    hrv: Optional[float] = None
    movement_intensity: Optional[float] = None


class EventOut(BaseModel):
    id: int
    child_id: str
    type: str
    category: Optional[str]
    item_id: Optional[str]
    label: Optional[str]
    label_ar: Optional[str]
    level: Optional[float]
    heart_rate: Optional[float]
    hrv: Optional[float]
    acknowledged: bool
    timestamp: datetime

    class Config:
        from_attributes = True


# ------------------------ WebSocket manager ------------------------

class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, payload: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()


# ------------------------ Notifications ------------------------

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")


def _telegram_send(text: str) -> None:
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    data = urllib.parse.urlencode({
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": "HTML",
    }).encode()
    req = urllib.request.Request(url, data=data, method="POST")
    try:
        urllib.request.urlopen(req, timeout=10).read()
    except Exception as exc:
        print(f"[TELEGRAM ERROR] {exc}")


async def send_push_notification(child_id: str, title: str, body: str, db: Session):
    print(f"[NOTIFY] child={child_id} title={title!r} body={body!r}")
    message = f"<b>{title}</b>\n{body}"
    await asyncio.to_thread(_telegram_send, message)


# ------------------------ App ------------------------

app = FastAPI(title="Hayat API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"service": "Hayat API", "status": "ok"}


@app.post("/api/taps", response_model=EventOut)
async def create_tap(tap: TapIn, db: Session = Depends(get_db)):
    event = Event(
        child_id=tap.child_id,
        type="tap",
        category=tap.category,
        item_id=tap.item_id,
        label=tap.label,
        label_ar=tap.label_ar,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    title = "Your child has a message"
    body = f"{tap.label}"
    asyncio.create_task(send_push_notification(tap.child_id, title, body, db))
    await manager.broadcast({"type": "new_event", "event": EventOut.model_validate(event).model_dump(mode="json")})
    return event


@app.post("/api/stress", response_model=EventOut)
async def create_stress_event(data: StressIn, db: Session = Depends(get_db)):
    child = db.query(ChildProfile).filter(ChildProfile.id == data.child_id).first()
    threshold = child.stress_threshold if child else 75
    if data.level < threshold:
        # still log it for analytics, but don't push notification
        push = False
    else:
        push = True

    event = Event(
        child_id=data.child_id,
        type="stress",
        level=data.level,
        heart_rate=data.heart_rate,
        hrv=data.hrv,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    if push:
        title = "Stress level elevated"
        body = f"Stress {int(data.level)}% · HR {int(data.heart_rate)} bpm"
        asyncio.create_task(send_push_notification(data.child_id, title, body, db))

    await manager.broadcast({"type": "new_event", "event": EventOut.model_validate(event).model_dump(mode="json")})
    return event


@app.get("/api/events", response_model=List[EventOut])
def list_events(
    child_id: str = "default",
    event_type: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(Event).filter(Event.child_id == child_id)
    if event_type:
        q = q.filter(Event.type == event_type)
    return q.order_by(Event.timestamp.desc()).limit(limit).all()


@app.post("/api/events/{event_id}/ack")
def acknowledge(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="not found")
    event.acknowledged = True
    db.commit()
    return {"ok": True}


@app.get("/api/children/{child_id}")
def get_child(child_id: str, db: Session = Depends(get_db)):
    child = db.query(ChildProfile).filter(ChildProfile.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="not found")
    return {
        "id": child.id,
        "name": child.name,
        "stress_threshold": child.stress_threshold,
        "baseline_hr": child.baseline_hr,
        "baseline_hrv": child.baseline_hrv,
    }


@app.post("/api/children")
def upsert_child(
    child_id: str,
    name: str,
    stress_threshold: int = 75,
    parent_device_token: Optional[str] = None,
    parent_phone: Optional[str] = None,
    db: Session = Depends(get_db),
):
    child = db.query(ChildProfile).filter(ChildProfile.id == child_id).first()
    if child:
        child.name = name
        child.stress_threshold = stress_threshold
        if parent_device_token:
            child.parent_device_token = parent_device_token
        if parent_phone:
            child.parent_phone = parent_phone
    else:
        child = ChildProfile(
            id=child_id,
            name=name,
            stress_threshold=stress_threshold,
            parent_device_token=parent_device_token,
            parent_phone=parent_phone,
        )
        db.add(child)
    db.commit()
    return {"ok": True, "child_id": child_id}


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)
