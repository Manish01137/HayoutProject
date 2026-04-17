import React, { useState, useEffect } from 'react';
import {
  Smile, Frown, Heart, Zap, AlertCircle, ShieldAlert,
  Apple, Droplet, Moon, Bath, Thermometer,
  Wind, Gamepad2, VolumeX, User, Users, HelpCircle,
  Volume2, Sun, AlertTriangle,
  Activity, Bell, Settings as SettingsIcon,
  BarChart3, Clock, ArrowLeft, Check, Lock, Download,
  Baby, UserCog, Play, Pause,
  Languages
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

// ============ CONSTANTS ============
const ICONS = {
  feelings: {
    label: { en: 'Feelings', ar: 'المشاعر' },
    items: [
      { id: 'happy',    icon: Smile,       en: 'Happy',    ar: 'سعيد',  tint: 'amber' },
      { id: 'sad',      icon: Frown,       en: 'Sad',      ar: 'حزين',  tint: 'sky' },
      { id: 'calm',     icon: Heart,       en: 'Calm',     ar: 'هادئ',  tint: 'emerald' },
      { id: 'stressed', icon: Zap,         en: 'Stressed', ar: 'متوتر', tint: 'rose' },
      { id: 'angry',    icon: AlertCircle, en: 'Angry',    ar: 'غاضب',  tint: 'orange' },
      { id: 'scared',   icon: ShieldAlert, en: 'Scared',   ar: 'خائف',  tint: 'violet' },
    ],
  },
  needs: {
    label: { en: 'Needs', ar: 'الاحتياجات' },
    items: [
      { id: 'hungry',      icon: Apple,       en: 'Hungry',    ar: 'جوعان',  tint: 'rose' },
      { id: 'thirsty',     icon: Droplet,     en: 'Thirsty',   ar: 'عطشان',  tint: 'sky' },
      { id: 'tired',       icon: Moon,        en: 'Tired',     ar: 'تعبان',  tint: 'indigo' },
      { id: 'bathroom',    icon: Bath,        en: 'Bathroom',  ar: 'الحمام', tint: 'cyan' },
      { id: 'temperature', icon: Thermometer, en: 'Cold / Hot',ar: 'برد/حر', tint: 'orange' },
    ],
  },
  requests: {
    label: { en: 'Requests', ar: 'الطلبات' },
    items: [
      { id: 'outside', icon: Wind,        en: 'Go outside', ar: 'أبغى أطلع',     tint: 'teal' },
      { id: 'play',    icon: Gamepad2,    en: 'Play',       ar: 'أبغى ألعب',     tint: 'pink' },
      { id: 'quiet',   icon: VolumeX,     en: 'Quiet',      ar: 'أبغى هدوء',     tint: 'slate' },
      { id: 'mama',    icon: Users,       en: 'Mama',       ar: 'أبغى أمي',      tint: 'rose' },
      { id: 'alone',   icon: User,        en: 'Alone',      ar: 'أبغى لحالي',    tint: 'violet' },
      { id: 'help',    icon: HelpCircle,  en: 'Help',       ar: 'أحتاج مساعدة', tint: 'amber' },
    ],
  },
  sensory: {
    label: { en: 'Sensory', ar: 'حسي' },
    items: [
      { id: 'loud',     icon: Volume2,        en: 'Too loud',  ar: 'صوت عالي',  tint: 'rose' },
      { id: 'bright',   icon: Sun,            en: 'Too bright',ar: 'ضوء قوي',   tint: 'amber' },
      { id: 'bothered', icon: AlertTriangle,  en: 'Bothers me',ar: 'يزعجني',    tint: 'orange' },
    ],
  },
};

const TINT = {
  amber:   { bg: 'bg-amber-50',   ring: 'ring-amber-200',   ic: 'text-amber-600',   hover: 'hover:bg-amber-100' },
  sky:     { bg: 'bg-sky-50',     ring: 'ring-sky-200',     ic: 'text-sky-600',     hover: 'hover:bg-sky-100' },
  emerald: { bg: 'bg-emerald-50', ring: 'ring-emerald-200', ic: 'text-emerald-600', hover: 'hover:bg-emerald-100' },
  rose:    { bg: 'bg-rose-50',    ring: 'ring-rose-200',    ic: 'text-rose-600',    hover: 'hover:bg-rose-100' },
  orange:  { bg: 'bg-orange-50',  ring: 'ring-orange-200',  ic: 'text-orange-600',  hover: 'hover:bg-orange-100' },
  violet:  { bg: 'bg-violet-50',  ring: 'ring-violet-200',  ic: 'text-violet-600',  hover: 'hover:bg-violet-100' },
  indigo:  { bg: 'bg-indigo-50',  ring: 'ring-indigo-200',  ic: 'text-indigo-600',  hover: 'hover:bg-indigo-100' },
  cyan:    { bg: 'bg-cyan-50',    ring: 'ring-cyan-200',    ic: 'text-cyan-600',    hover: 'hover:bg-cyan-100' },
  teal:    { bg: 'bg-teal-50',    ring: 'ring-teal-200',    ic: 'text-teal-600',    hover: 'hover:bg-teal-100' },
  pink:    { bg: 'bg-pink-50',    ring: 'ring-pink-200',    ic: 'text-pink-600',    hover: 'hover:bg-pink-100' },
  slate:   { bg: 'bg-slate-100',  ring: 'ring-slate-200',   ic: 'text-slate-600',   hover: 'hover:bg-slate-200' },
};

const DEFAULT_SETTINGS = {
  childName: 'Zain',
  parentName: 'Mama',
  stressThreshold: 75,
  parentPin: '1234',
  lang: 'en',
};

const T = {
  appName:       { en: 'Hayat',           ar: 'حياة' },
  tagline:       { en: 'A voice for every child', ar: 'صوت لكل طفل' },
  childMode:     { en: 'Child mode',      ar: 'وضع الطفل' },
  childHint:     { en: 'Tap what you feel', ar: 'اضغط على ما تشعر به' },
  parentMode:    { en: 'Parent dashboard',ar: 'لوحة ولي الأمر' },
  parentHint:    { en: 'See alerts and insights', ar: 'عرض التنبيهات والتحليلات' },
  parentPin:     { en: 'Parent PIN',      ar: 'رمز ولي الأمر' },
  defaultPin:    { en: 'Default: 1234',   ar: 'الافتراضي: 1234' },
  cancel:        { en: 'Cancel',          ar: 'إلغاء' },
  unlock:        { en: 'Unlock',          ar: 'فتح' },
  sent:          { en: 'Message sent',    ar: 'تم إرسال الرسالة' },
  to:            { en: 'to',              ar: 'إلى' },
  disclaimer:    { en: 'Research prototype · Not a medical device', ar: 'نموذج بحثي · ليس جهازا طبيا' },
  hi:            { en: 'Hi',              ar: 'مرحبا' },
  dashboard:     { en: 'Dashboard',       ar: 'لوحة التحكم' },
  braceletOn:    { en: 'Bracelet connected', ar: 'السوار متصل' },
  braceletOff:   { en: 'Bracelet offline', ar: 'السوار غير متصل' },
  live:          { en: 'Live',            ar: 'مباشر' },
  alerts:        { en: 'Alerts',          ar: 'التنبيهات' },
  history:       { en: 'History',         ar: 'السجل' },
  insights:      { en: 'Insights',        ar: 'تحليلات' },
  demo:          { en: 'Demo',            ar: 'تجربة' },
  settings:      { en: 'Settings',        ar: 'الإعدادات' },
};

// ============ STORAGE ============
const loadEvents = () => {
  try { return JSON.parse(localStorage.getItem('events') || '[]'); } catch { return []; }
};
const saveEvents = (events) => {
  try { localStorage.setItem('events', JSON.stringify(events.slice(0, 500))); } catch { /* empty */ }
};
const loadSettings = () => {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('settings') || '{}') }; } catch { return DEFAULT_SETTINGS; }
};
const saveSettings = (s) => {
  try { localStorage.setItem('settings', JSON.stringify(s)); } catch { /* empty */ }
};

// ============ API CLIENT ============
const API_URL = import.meta.env.VITE_API_URL || '';
const CHILD_ID = 'default';

const api = {
  async postTap(category, item_id, label, label_ar) {
    if (!API_URL) return null;
    try {
      const r = await fetch(`${API_URL}/api/taps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: CHILD_ID, category, item_id, label, label_ar }),
      });
      return r.ok ? await r.json() : null;
    } catch { return null; }
  },
  async postStress(level, heart_rate, hrv) {
    if (!API_URL) return null;
    try {
      const r = await fetch(`${API_URL}/api/stress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: CHILD_ID, level, heart_rate, hrv }),
      });
      return r.ok ? await r.json() : null;
    } catch { return null; }
  },
  async ack(id) {
    if (!API_URL || !Number.isInteger(id)) return;
    try { await fetch(`${API_URL}/api/events/${id}/ack`, { method: 'POST' }); } catch { /* empty */ }
  },
  async list() {
    if (!API_URL) return null;
    try {
      const r = await fetch(`${API_URL}/api/events?child_id=${CHILD_ID}&limit=200`);
      if (!r.ok) return null;
      const data = await r.json();
      return data.map((e) => ({
        id: e.id,
        type: e.type,
        category: e.category,
        itemId: e.item_id,
        label: e.label,
        label_ar: e.label_ar,
        level: e.level,
        hr: e.heart_rate,
        hrv: e.hrv,
        acknowledged: e.acknowledged,
        timestamp: e.timestamp,
      }));
    } catch { return null; }
  },
};

// ============ APP ============
export default function App() {
  const [view, setView] = useState('home');
  const [events, setEvents] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [stress, setStress] = useState(38);
  const [hr, setHr] = useState(92);
  const [hrv, setHrv] = useState(42);
  const [simulating, setSimulating] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const L = (key) => T[key]?.[settings.lang] || T[key]?.en || key;

  useEffect(() => {
    (async () => {
      setSettings(loadSettings());
      const remote = await api.list();
      setEvents(remote ?? loadEvents());
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!simulating) return;
    const id = setInterval(() => {
      setStress((prev) => {
        const drift = (Math.random() - 0.45) * 8;
        const next = Math.max(10, Math.min(95, prev + drift));
        if (next >= settings.stressThreshold && prev < settings.stressThreshold) {
          addEvent({ type: 'stress', level: Math.round(next), hr: Math.round(hr), hrv: Math.round(hrv), acknowledged: false });
        }
        return next;
      });
      setHr((p) => Math.max(60, Math.min(135, p + (Math.random() - 0.5) * 4)));
      setHrv((p) => Math.max(15, Math.min(75, p + (Math.random() - 0.5) * 3)));
    }, 1500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulating, settings.stressThreshold]);

  const addEvent = async (event) => {
    const localId = Date.now() + Math.random();
    const e = { ...event, id: localId, timestamp: new Date().toISOString() };
    setEvents((prev) => {
      const next = [e, ...prev];
      saveEvents(next);
      return next;
    });

    let remote = null;
    if (event.type === 'tap') {
      remote = await api.postTap(event.category, event.itemId, event.label, event.label_ar);
    } else if (event.type === 'stress') {
      remote = await api.postStress(event.level, event.hr, event.hrv);
    }
    if (remote?.id) {
      setEvents((prev) => {
        const next = prev.map((x) => (x.id === localId ? { ...x, id: remote.id } : x));
        saveEvents(next);
        return next;
      });
    }
  };

  const handleTap = async (category, item) => {
    await addEvent({
      type: 'tap', category, itemId: item.id,
      label: item.en, label_ar: item.ar, acknowledged: false,
    });
    setConfirm(item);
    setTimeout(() => setConfirm(null), 1800);
  };

  const acknowledge = async (id) => {
    setEvents((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, acknowledged: true } : e));
      saveEvents(next);
      return next;
    });
    api.ack(id);
  };

  const clearAll = async () => {
    setEvents([]);
    saveEvents([]);
  };

  const updateSettings = async (s) => {
    setSettings(s);
    await saveSettings(s);
  };

  const toggleLang = () => updateSettings({ ...settings, lang: settings.lang === 'en' ? 'ar' : 'en' });

  if (!loaded) {
    return (
      <div style={{ minHeight: '100vh' }} className="bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400 text-sm">Loading…</div>
      </div>
    );
  }

  const dir = settings.lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <div dir={dir} style={{ fontFamily: 'Nunito, system-ui, -apple-system, sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');`}</style>

      {view === 'home' && <Home settings={settings} L={L} onSelect={setView} onToggleLang={toggleLang} />}
      {view === 'child' && <Child settings={settings} L={L} confirm={confirm} onTap={handleTap} onExit={() => setView('home')} />}
      {view === 'parent' && (
        <Parent
          events={events} settings={settings} L={L}
          stress={stress} hr={hr} hrv={hrv}
          simulating={simulating} setSimulating={setSimulating}
          setStress={setStress} setHr={setHr}
          onAcknowledge={acknowledge}
          onClearAll={clearAll}
          onUpdateSettings={updateSettings}
          onAddStressEvent={() => addEvent({ type: 'stress', level: Math.round(stress), hr: Math.round(hr), hrv: Math.round(hrv), acknowledged: false })}
          onExit={() => setView('home')}
          onToggleLang={toggleLang}
        />
      )}
    </div>
  );
}

// ============ HOME ============
function Home({ settings, L, onSelect, onToggleLang }) {
  const [pinEntry, setPinEntry] = useState(false);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState(false);

  const submit = () => {
    if (pin === settings.parentPin) { onSelect('parent'); }
    else { setErr(true); setTimeout(() => setErr(false), 1500); }
  };

  return (
    <div style={{ minHeight: '100vh' }} className="bg-gradient-to-b from-stone-50 via-rose-50/30 to-sky-50/40 flex items-center justify-center p-6">
      <button
        onClick={onToggleLang}
        className="absolute top-6 right-6 w-11 h-11 bg-white/70 backdrop-blur rounded-2xl shadow-sm hover:bg-white flex items-center justify-center transition-colors"
      >
        <Languages className="w-5 h-5 text-stone-500" />
      </button>

      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-sm mb-6 ring-1 ring-rose-100">
            <Heart className="w-10 h-10 text-rose-500" strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl font-extrabold text-stone-800 mb-3 tracking-tight">{L('appName')}</h1>
          <p className="text-stone-500 text-lg">{L('tagline')}</p>
        </div>

        {!pinEntry ? (
          <div className="grid md:grid-cols-2 gap-5">
            <RoleCard
              onClick={() => onSelect('child')}
              icon={Baby}
              accent="sky"
              title={L('childMode')}
              hint={L('childHint')}
            />
            <RoleCard
              onClick={() => { setPinEntry(true); setPin(''); }}
              icon={UserCog}
              accent="rose"
              title={L('parentMode')}
              hint={L('parentHint')}
            />
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 shadow-sm max-w-md mx-auto ring-1 ring-stone-100">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center ring-1 ring-rose-100">
                <Lock className="w-7 h-7 text-rose-500" strokeWidth={1.75} />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-center text-stone-800 mb-1">{L('parentPin')}</h2>
            <p className="text-center text-stone-400 text-sm mb-6">{L('defaultPin')}</p>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              maxLength={6}
              placeholder="••••"
              className={`w-full text-center text-3xl tracking-[0.5em] py-4 rounded-2xl border-2 mb-4 focus:outline-none transition-colors ${
                err ? 'border-rose-400 bg-rose-50 animate-pulse' : 'border-stone-200 focus:border-rose-300'
              }`}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setPinEntry(false)}
                className="flex-1 py-3 rounded-2xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors font-medium"
              >
                {L('cancel')}
              </button>
              <button
                onClick={submit}
                className="flex-1 py-3 rounded-2xl bg-rose-500 text-white hover:bg-rose-600 transition-colors font-medium shadow-sm"
              >
                {L('unlock')}
              </button>
            </div>
          </div>
        )}

        <p className="text-center mt-10 text-xs text-stone-400">{L('disclaimer')}</p>
      </div>
    </div>
  );
}

function RoleCard({ onClick, icon: Icon, accent, title, hint }) {
  const accents = {
    sky: { bg: 'bg-sky-50', ring: 'hover:ring-sky-200', icBg: 'bg-sky-100', ic: 'text-sky-600' },
    rose: { bg: 'bg-rose-50', ring: 'hover:ring-rose-200', icBg: 'bg-rose-100', ic: 'text-rose-600' },
  };
  const a = accents[accent];
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-3xl p-10 shadow-sm hover:shadow-md transition-all ring-1 ring-stone-100 ${a.ring} hover:ring-2 group text-start`}
    >
      <div className={`w-20 h-20 ${a.icBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform`}>
        <Icon className={`w-10 h-10 ${a.ic}`} strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl font-bold text-stone-800 mb-2">{title}</h2>
      <p className="text-stone-500 text-sm">{hint}</p>
    </button>
  );
}

// ============ CHILD ============
function Child({ settings, L, confirm, onTap, onExit }) {
  const [category, setCategory] = useState('feelings');
  const lang = settings.lang;
  const items = ICONS[category].items;

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }} className="bg-gradient-to-b from-sky-50 via-stone-50 to-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onExit}
            className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center hover:bg-stone-50 transition-colors ring-1 ring-stone-100"
          >
            <ArrowLeft className={`w-5 h-5 text-stone-500 ${lang === 'ar' ? 'rotate-180' : ''}`} />
          </button>
          <div className="text-center">
            <p className="text-stone-600 text-base font-medium">{L('hi')} {settings.childName}</p>
          </div>
          <div className="w-12" />
        </div>

        <div className="flex gap-2 overflow-x-auto mb-8 pb-2 -mx-4 px-4">
          {Object.entries(ICONS).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`px-6 py-3 rounded-2xl whitespace-nowrap font-semibold transition-all shadow-sm ${
                category === key
                  ? 'bg-sky-500 text-white shadow-sky-200/50 scale-105'
                  : 'bg-white text-stone-600 hover:bg-stone-50 ring-1 ring-stone-100'
              }`}
            >
              {cat.label[lang]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => {
            const Icon = item.icon;
            const t = TINT[item.tint];
            return (
              <button
                key={item.id}
                onClick={() => onTap(category, item)}
                className={`${t.bg} ${t.hover} ring-2 ${t.ring} rounded-3xl p-8 active:scale-95 transition-transform shadow-sm hover:shadow-md`}
              >
                <div className="flex flex-col items-center gap-4">
                  <Icon className={`w-20 h-20 ${t.ic}`} strokeWidth={1.25} />
                  <div className={`text-xl font-bold ${t.ic}`}>{item[lang]}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {confirm && (
        <div
          style={{ position: 'absolute', inset: 0 }}
          className="bg-stone-900/30 backdrop-blur-sm flex items-center justify-center p-6 z-50"
        >
          <div className="bg-white rounded-3xl p-10 shadow-xl max-w-md text-center ring-1 ring-stone-100">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-emerald-600" strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-1">
              {L('sent')}
            </h3>
            <p className="text-stone-500 text-sm">{L('to')} {settings.parentName}</p>
            <p className="text-base text-stone-700 mt-4 font-medium">"{confirm[lang]}"</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ PARENT ============
function Parent(props) {
  const {
    events, settings, L, stress, hr, hrv,
    simulating, setSimulating, setStress, setHr,
    onAcknowledge, onClearAll, onUpdateSettings,
    onAddStressEvent, onExit, onToggleLang,
  } = props;
  const [tab, setTab] = useState('live');
  const unread = events.filter((e) => !e.acknowledged).length;

  const tabs = [
    { id: 'live', label: L('live'), icon: Activity },
    { id: 'alerts', label: L('alerts'), icon: Bell, badge: unread },
    { id: 'history', label: L('history'), icon: Clock },
    { id: 'insights', label: L('insights'), icon: BarChart3 },
    { id: 'demo', label: L('demo'), icon: Play },
    { id: 'settings', label: L('settings'), icon: SettingsIcon },
  ];

  return (
    <div style={{ minHeight: '100vh' }} className="bg-stone-50">
      <div style={{ position: 'sticky', top: 0, zIndex: 10 }} className="bg-white border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onExit} className="w-10 h-10 rounded-xl hover:bg-stone-100 flex items-center justify-center transition-colors">
              <ArrowLeft className={`w-5 h-5 text-stone-500 ${settings.lang === 'ar' ? 'rotate-180' : ''}`} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-stone-800">{L('dashboard')}</h1>
              <p className="text-xs text-stone-500">{settings.childName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onToggleLang} className="w-9 h-9 rounded-xl hover:bg-stone-100 flex items-center justify-center transition-colors">
              <Languages className="w-4 h-4 text-stone-500" />
            </button>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${simulating ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
              <div className={`w-2 h-2 rounded-full ${simulating ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
              {simulating ? L('braceletOn') : L('braceletOff')}
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-2 md:px-6 flex gap-1 overflow-x-auto">
          {tabs.map((t) => {
            const I = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.id ? 'border-rose-500 text-rose-600' : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
              >
                <I className="w-4 h-4" />
                {t.label}
                {t.badge > 0 && (
                  <span className="bg-rose-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center font-bold">{t.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        {tab === 'live' && <LiveTab events={events} stress={stress} hr={hr} hrv={hrv} settings={settings} L={L} onAcknowledge={onAcknowledge} />}
        {tab === 'alerts' && <AlertsTab events={events} settings={settings} onAcknowledge={onAcknowledge} />}
        {tab === 'history' && <HistoryTab events={events} settings={settings} L={L} />}
        {tab === 'insights' && <InsightsTab events={events} L={L} />}
        {tab === 'demo' && (
          <DemoTab
            stress={stress} hr={hr} hrv={hrv}
            simulating={simulating} setSimulating={setSimulating}
            setStress={setStress} setHr={setHr}
            onTrigger={onAddStressEvent}
            L={L}
          />
        )}
        {tab === 'settings' && <SettingsTab settings={settings} onUpdate={onUpdateSettings} onClearAll={onClearAll} L={L} />}
      </div>
    </div>
  );
}

// ---- EventRow ----
function EventRow({ event, settings, onAcknowledge, compact }) {
  const time = new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = new Date(event.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
  const isStress = event.type === 'stress';
  const label = isStress
    ? `${settings.lang === 'ar' ? 'تم اكتشاف توتر' : 'Stress detected'} (${event.level}%)`
    : settings.lang === 'ar' ? event.label_ar : event.label;

  return (
    <div className={`flex items-center gap-3 ${compact ? 'py-2' : 'p-3 bg-stone-50 rounded-xl'}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isStress ? 'bg-rose-100' : 'bg-sky-100'}`}>
        {isStress ? <Zap className="w-4 h-4 text-rose-500" strokeWidth={2} /> : <Bell className="w-4 h-4 text-sky-500" strokeWidth={2} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-stone-700 truncate">{label}</div>
        <div className="text-xs text-stone-400">{date} · {time} {isStress ? '· bracelet' : `· ${event.category}`}</div>
      </div>
      {!event.acknowledged && onAcknowledge && !compact && (
        <button onClick={() => onAcknowledge(event.id)} className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-3 py-1 rounded-lg hover:bg-rose-50 transition-colors">
          Ack
        </button>
      )}
      {!event.acknowledged && <div className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0" />}
    </div>
  );
}

// ---- Live ----
function LiveTab({ events, stress, hr, hrv, settings, L, onAcknowledge }) {
  const recent = events.slice(0, 6);
  const level = stress >= settings.stressThreshold ? 'high' : stress >= 55 ? 'medium' : 'low';
  const palette = {
    low: { color: '#10b981', tx: 'text-emerald-700' },
    medium: { color: '#f59e0b', tx: 'text-amber-700' },
    high: { color: '#ef4444', tx: 'text-rose-700' },
  }[level];

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-stone-100">
        <h3 className="text-sm text-stone-500 mb-4 font-semibold uppercase tracking-wide">Stress</h3>
        <div style={{ position: 'relative', width: '12rem', height: '12rem', margin: '0 auto' }}>
          <svg className="w-48 h-48" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="96" cy="96" r="80" stroke="#f1f5f9" strokeWidth="14" fill="none" />
            <circle
              cx="96" cy="96" r="80"
              stroke={palette.color}
              strokeWidth="14" fill="none" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 80}
              strokeDashoffset={2 * Math.PI * 80 * (1 - stress / 100)}
              style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0 }} className="flex flex-col items-center justify-center">
            <div className="text-5xl font-extrabold text-stone-800">{Math.round(stress)}</div>
            <div className={`text-sm font-bold uppercase tracking-wide ${palette.tx} mt-1`}>{level}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-stone-100">
        <h3 className="text-sm text-stone-500 mb-4 font-semibold uppercase tracking-wide">Biometrics</h3>
        <div className="space-y-5">
          <BioRow icon={Heart} iconBg="bg-rose-100" iconColor="text-rose-500" label="Heart rate" value={`${Math.round(hr)}`} unit="bpm" />
          <BioRow icon={Activity} iconBg="bg-violet-100" iconColor="text-violet-500" label="HRV" value={`${Math.round(hrv)}`} unit="ms" />
          <div className="pt-3 border-t border-stone-100 text-xs text-stone-400">
            Movement · {stress > 70 ? 'elevated' : 'calm'}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-stone-100">
        <h3 className="text-sm text-stone-500 mb-4 font-semibold uppercase tracking-wide">Recent</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-8">No events yet</p>
        ) : (
          <div className="space-y-1">
            {recent.map((e) => <EventRow key={e.id} event={e} settings={settings} compact />)}
          </div>
        )}
      </div>
    </div>
  );
}

function BioRow({ icon: Icon, iconBg, iconColor, label, value, unit }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2} />
      </div>
      <div>
        <div className="text-xs text-stone-500 uppercase tracking-wide">{label}</div>
        <div className="text-2xl font-bold text-stone-800">{value} <span className="text-xs text-stone-400 font-normal">{unit}</span></div>
      </div>
    </div>
  );
}

// ---- Alerts ----
function AlertsTab({ events, settings, onAcknowledge }) {
  const unread = events.filter((e) => !e.acknowledged);
  const recent = events.filter((e) => e.acknowledged).slice(0, 15);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-stone-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-stone-800">Unread</h3>
          <span className="text-sm text-stone-400">{unread.length}</span>
        </div>
        {unread.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-8">All caught up</p>
        ) : (
          <div className="space-y-2">
            {unread.map((e) => <EventRow key={e.id} event={e} settings={settings} onAcknowledge={onAcknowledge} />)}
          </div>
        )}
      </div>
      {recent.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-stone-100">
          <h3 className="font-bold text-stone-800 mb-4">Handled</h3>
          <div className="space-y-2">
            {recent.map((e) => <EventRow key={e.id} event={e} settings={settings} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- History ----
function HistoryTab({ events, settings, L }) {
  const [filter, setFilter] = useState('all');
  const filtered = events.filter((e) => filter === 'all' || e.type === filter);

  const exportCSV = () => {
    const headers = ['timestamp', 'type', 'category', 'label', 'level', 'heartRate', 'hrv', 'acknowledged'];
    const rows = events.map((e) => [
      e.timestamp, e.type, e.category || '', e.label || '',
      e.level || '', e.hr || '', e.hrv || '', e.acknowledged ? 'yes' : 'no',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hayat-events-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-stone-100">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="font-bold text-stone-800">Event history</h3>
        <div className="flex gap-2 flex-wrap">
          {['all', 'tap', 'stress'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg capitalize font-semibold transition-colors ${
                filter === f ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {f}
            </button>
          ))}
          <button
            onClick={exportCSV}
            className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 font-semibold transition-colors flex items-center gap-1"
          >
            <Download className="w-3 h-3" /> CSV
          </button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-stone-400 text-center py-12">No events</p>
      ) : (
        <div className="space-y-2" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {filtered.map((e) => <EventRow key={e.id} event={e} settings={settings} />)}
        </div>
      )}
    </div>
  );
}

// ---- Insights ----
function InsightsTab({ events, L }) {
  const categoryData = ['feelings', 'needs', 'requests', 'sensory'].map((cat) => ({
    name: cat,
    count: events.filter((e) => e.type === 'tap' && e.category === cat).length,
  }));

  const hourData = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    taps: events.filter((e) => e.type === 'tap' && new Date(e.timestamp).getHours() === h).length,
    stress: events.filter((e) => e.type === 'stress' && new Date(e.timestamp).getHours() === h).length,
  }));

  const top = {};
  events.filter((e) => e.type === 'tap').forEach((e) => { top[e.label] = (top[e.label] || 0) + 1; });
  const topArr = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const COLORS = ['#f43f5e', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b'];

  const totalTaps = events.filter((e) => e.type === 'tap').length;
  const totalStress = events.filter((e) => e.type === 'stress').length;
  const handled = events.filter((e) => e.acknowledged).length;

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-16 shadow-sm ring-1 ring-stone-100 text-center">
        <BarChart3 className="w-12 h-12 text-stone-300 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-stone-400">Insights appear once events are logged</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-stone-100 md:col-span-2">
        <h3 className="font-bold text-stone-800 mb-4">Summary</h3>
        <div className="grid grid-cols-3 gap-3">
          <StatCard bg="bg-sky-50" tx="text-sky-700" value={totalTaps} label="Messages" />
          <StatCard bg="bg-rose-50" tx="text-rose-700" value={totalStress} label="Stress events" />
          <StatCard bg="bg-emerald-50" tx="text-emerald-700" value={handled} label="Handled" />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-stone-100 md:col-span-2">
        <h3 className="font-bold text-stone-800 mb-4">Events by hour of day</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={hourData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#78716c' }} />
            <YAxis tick={{ fontSize: 10, fill: '#78716c' }} allowDecimals={false} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="taps" fill="#0ea5e9" name="Messages" radius={[4, 4, 0, 0]} />
            <Bar dataKey="stress" fill="#f43f5e" name="Stress" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-stone-100">
        <h3 className="font-bold text-stone-800 mb-4">Message categories</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={categoryData.filter((d) => d.count > 0)} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => `${e.name} (${e.count})`}>
              {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-stone-100">
        <h3 className="font-bold text-stone-800 mb-4">Most frequent</h3>
        <div className="space-y-3">
          {topArr.map(([label, count], i) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: COLORS[i] + '22', color: COLORS[i] }}>{i + 1}</div>
              <div className="flex-1 text-sm font-medium text-stone-700">{label}</div>
              <div className="text-sm font-bold text-stone-500">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ bg, tx, value, label }) {
  return (
    <div className={`${bg} rounded-xl p-4`}>
      <div className={`text-3xl font-extrabold ${tx}`}>{value}</div>
      <div className={`text-xs font-semibold ${tx} opacity-75 mt-1`}>{label}</div>
    </div>
  );
}

// ---- Demo ----
function DemoTab({ stress, hr, hrv, simulating, setSimulating, setStress, setHr, onTrigger, L }) {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
        <div>
          <p className="text-sm font-semibold text-amber-800">Demonstration mode</p>
          <p className="text-sm text-amber-700 mt-1">
            No physical bracelet connected. Use these controls to simulate sensor readings and verify the alert pipeline.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-stone-100">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h3 className="font-bold text-stone-800">Bracelet simulator</h3>
          <button
            onClick={() => setSimulating(!simulating)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              simulating ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            }`}
          >
            {simulating ? <><Pause className="w-4 h-4" /> Pause auto-drift</> : <><Play className="w-4 h-4" /> Start auto-drift</>}
          </button>
        </div>

        <div className="space-y-6">
          <Slider label="Stress level" value={stress} onChange={setStress} min={0} max={100} unit="%" disabled={simulating} />
          <Slider label="Heart rate" value={hr} onChange={setHr} min={50} max={150} unit="bpm" disabled={simulating} />
          <button
            onClick={onTrigger}
            className="w-full py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Zap className="w-4 h-4" strokeWidth={2.5} />
            Trigger stress alert now
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-stone-100">
        <h3 className="font-bold text-stone-800 mb-4">Real-device data pipeline</h3>
        <ol className="space-y-3 text-sm text-stone-600">
          {[
            'ESP32 reads MAX30102 (pulse, HRV) and MPU6050 (accelerometer, gyroscope) every second.',
            'A 60-second rolling window computes a personalized stress score against the child\'s baseline.',
            'If the score stays above threshold for ≥15 seconds, ESP32 POSTs a JSON payload to the backend.',
            'Backend persists the event and pushes a notification via FCM or WhatsApp to the parent\'s phone.',
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Slider({ label, value, onChange, min, max, unit, disabled }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <label className="text-sm font-semibold text-stone-700">{label}</label>
        <span className="text-sm font-bold text-stone-800">{Math.round(value)}{unit}</span>
      </div>
      <input
        type="range"
        min={min} max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        className="w-full accent-rose-500 disabled:opacity-50"
      />
    </div>
  );
}

// ---- Settings ----
function SettingsTab({ settings, onUpdate, onClearAll, L }) {
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => { setForm(settings); }, [settings]);

  const save = () => {
    onUpdate(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="max-w-2xl space-y-4">
      <Card title="Profile">
        <Field label="Child's name" value={form.childName} onChange={(v) => setForm({ ...form, childName: v })} />
        <Field label="Parent's name" value={form.parentName} onChange={(v) => setForm({ ...form, parentName: v })} />
        <Field label="Parent PIN" value={form.parentPin} onChange={(v) => setForm({ ...form, parentPin: v })} mono maxLength={6} />
      </Card>

      <Card title="Stress detection">
        <Slider
          label="Alert threshold"
          value={form.stressThreshold}
          onChange={(v) => setForm({ ...form, stressThreshold: v })}
          min={50} max={95} unit="%"
        />
        <p className="text-xs text-stone-400 mt-2">Alerts trigger when stress exceeds this value for the sustained detection window.</p>
      </Card>

      <div className="flex justify-end">
        <button
          onClick={save}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${saved ? 'bg-emerald-500 text-white scale-105' : 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm'}`}
        >
          {saved ? '✓ Saved' : 'Save changes'}
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm ring-2 ring-rose-100">
        <h3 className="font-bold text-rose-700 mb-1">Danger zone</h3>
        <p className="text-sm text-stone-500 mb-4">Permanently delete all stored events.</p>
        {!confirmClear ? (
          <button onClick={() => setConfirmClear(true)} className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-semibold transition-colors">
            Clear all history
          </button>
        ) : (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { onClearAll(); setConfirmClear(false); }} className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-colors">
              Yes, delete everything
            </button>
            <button onClick={() => setConfirmClear(false)} className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-50 transition-colors">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-stone-100">
      <h3 className="font-bold text-stone-800 mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, mono, maxLength }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-stone-600 mb-2">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className={`w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-rose-300 focus:outline-none ${mono ? 'font-mono tracking-widest' : ''}`}
      />
    </div>
  );
}
