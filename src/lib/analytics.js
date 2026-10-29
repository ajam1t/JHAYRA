import { SUPABASE_KEY, SUPABASE_URL } from './supabase';

// Anonymous visit counting and real-visitor page speed for Admin → Dashboard.
// Each browser gets a random ID in localStorage; nothing personal is sent (no
// names, emails or IP addresses are stored). Skips admin pages, bots and
// browsers asking not to be tracked. Silently stops if the table isn't set up.

const ENDPOINT = `${SUPABASE_URL}/rest/v1/site_events`;
let disabled = typeof window === 'undefined';

const off = () =>
  disabled ||
  navigator.doNotTrack === '1' ||
  navigator.globalPrivacyControl === true ||
  navigator.webdriver ||
  /bot|crawl|spider|slurp|lighthouse|headless|preview|pagespeed/i.test(navigator.userAgent);

const rid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`).slice(0, 36);

function store(kind, key, make) {
  try {
    const s = kind === 'local' ? localStorage : sessionStorage;
    let v = s.getItem(key);
    const fresh = !v;
    if (fresh) s.setItem(key, (v = make()));
    return [v, fresh];
  } catch {
    return [make(), true];
  }
}

const device = () => (innerWidth < 760 ? 'mobile' : innerWidth < 1100 ? 'tablet' : 'desktop');

function send(row) {
  if (off()) return;
  fetch(ENDPOINT, {
    method: 'POST',
    keepalive: true,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  })
    .then((r) => {
      if (r.status === 404 || r.status === 401 || r.status === 403) disabled = true;
    })
    .catch(() => {});
}

let entryDone = false;
let lastPath = '';

export function trackView(path) {
  if (off() || path.startsWith('/admin') || path === lastPath) return;
  lastPath = path;
  const [visitor, isNew] = store('local', 'jh_vid', rid);
  const [session] = store('session', 'jh_sid', rid);
  const row = { kind: 'view', path: path.slice(0, 300), visitor, session, is_new: isNew && !entryDone, entry: false, device: device() };
  if (!entryDone) {
    entryDone = true;
    row.entry = true;
    const q = new URLSearchParams(location.search);
    let ref = q.get('utm_source') || '';
    if (!ref && document.referrer) {
      try {
        const h = new URL(document.referrer).hostname.replace(/^www\./, '');
        if (h !== location.hostname.replace(/^www\./, '')) ref = h;
      } catch {}
    }
    row.referrer = ref.slice(0, 120);
  }
  send(row);
  startVitals();
}

// Core Web Vitals for the landing page, sent once when the tab is hidden.
let vitalsOn = false;
function startVitals() {
  if (vitalsOn || typeof PerformanceObserver === 'undefined') return;
  vitalsOn = true;
  const path = location.pathname;
  const m = {};
  const nav = performance.getEntriesByType('navigation')[0];
  if (nav) m.ttfb = Math.round(nav.responseStart);
  const watch = (type, fn, opts = {}) => {
    try {
      new PerformanceObserver((l) => l.getEntries().forEach(fn)).observe({ type, buffered: true, ...opts });
    } catch {}
  };
  watch('paint', (e) => e.name === 'first-contentful-paint' && (m.fcp = Math.round(e.startTime)));
  watch('largest-contentful-paint', (e) => (m.lcp = Math.round(e.startTime)));
  let cls = 0;
  let win = 0;
  let first = 0;
  let prev = 0;
  watch('layout-shift', (e) => {
    if (e.hadRecentInput) return;
    if (win && e.startTime - prev < 1000 && e.startTime - first < 5000) win += e.value;
    else {
      win = e.value;
      first = e.startTime;
    }
    prev = e.startTime;
    cls = Math.max(cls, win);
    m.cls = Math.round(cls * 1000) / 1000;
  });
  watch('event', (e) => e.interactionId && (m.inp = Math.max(m.inp || 0, Math.round(e.duration))), { durationThreshold: 40 });
  watch('first-input', (e) => (m.inp = Math.max(m.inp || 0, Math.round(e.duration))));
  let sent = false;
  const flush = (force) => {
    if (sent || (!force && document.visibilityState !== 'hidden') || !Object.keys(m).length) return;
    sent = true;
    const [visitor] = store('local', 'jh_vid', rid);
    const [session] = store('session', 'jh_sid', rid);
    send({ kind: 'vitals', path, visitor, session, device: device(), ...m });
  };
  addEventListener('visibilitychange', () => flush(false));
  addEventListener('pagehide', () => flush(true));
}
