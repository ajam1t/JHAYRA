import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { loadProducts } from '../lib/catalog';
import { optimized } from '../lib/img';
import { supabase } from '../lib/supabase';
import { createIntroSound } from '../lib/introSound';
import '../styles/gateway.css';

// The chunk has loaded: the pre-paint failsafe in index.html stands down.
if (typeof window !== 'undefined') window.__jhIntro = true;

/* ─────────────────────────────────────────────────────────────────────────
   JHAYRA — cinematic gateway
   THE GATE → THE JHAYRA KEY → THE UNLOCKING → THE HOME → THE ART → HOMEPAGE
   One timeline drives every scene; each step adds a class, CSS does the motion.
   ───────────────────────────────────────────────────────────────────────── */
const STEPS = [
  ['approach', 60],
  ['lock', 1300],
  ['trace', 1650],
  ['glow', 2250],
  ['turn', 2500],
  ['open', 3100],
  ['through', 4050],
  ['living', 4250],
  ['focus', 4900],
  ['bedroom', 5900],
  ['dining', 6850],
  ['hall', 7800],
  ['brand', 8700],
  ['dissolve', 9950],
];
const END_AT = 10750;

// Real room photographs in the project. Frame slots are centre x/y and width,
// as shares of the photo; height follows each artwork's own proportions.
const ROOMS = [
  {
    id: 'living',
    label: 'The living room',
    src: '/rooms/hero-living.webp',
    w: 1024,
    h: 922,
    pan: [0.43, 0.39, 0.57, 0.37],
    zoom: 1.05,
    slots: [
      { x: 0.5, y: 0.355, w: 0.17, cats: ['personalized', 'nature'], hero: true },
      { x: 0.31, y: 0.375, w: 0.115, cats: ['nature', 'religious'] },
      { x: 0.69, y: 0.375, w: 0.115, cats: ['religious', 'home-vastu'] },
    ],
  },
  {
    id: 'bedroom',
    label: 'The bedroom',
    src: '/rooms/bedroom.webp',
    w: 900,
    h: 611,
    pan: [0.36, 0.4, 0.3, 0.38],
    zoom: 1.06,
    // Plain wall laid over the photo's own prints so only JHAYRA art shows.
    patch: { x: 0.188, y: 0.185, w: 0.262, h: 0.41 },
    slots: [
      { x: 0.2385, y: 0.345, w: 0.137, cats: ['love-romance', 'wedding'], hero: true },
      { x: 0.384, y: 0.345, w: 0.122, cats: ['wedding', 'love-romance'] },
    ],
  },
  {
    id: 'dining',
    label: 'The dining room',
    src: '/rooms/dining.webp',
    w: 900,
    h: 612,
    pan: [0.42, 0.3, 0.58, 0.3],
    zoom: 1.04,
    slots: [
      { x: 0.252, y: 0.142, w: 0.1, cats: ['home-vastu', 'nature'], hero: true },
      { x: 0.7, y: 0.13, w: 0.098, cats: ['running-horses', 'nature'] },
    ],
  },
  {
    id: 'hall',
    label: 'The entrance hall',
    src: '/rooms/entryway.webp',
    w: 900,
    h: 611,
    pan: [0.5, 0.46, 0.5, 0.42],
    zoom: 1.06,
    slots: [
      { x: 0.272, y: 0.385, w: 0.11, cats: ['family', 'baby-kids'] },
      { x: 0.5, y: 0.352, w: 0.072, cats: ['occasions', 'baby-kids'], hero: true },
      { x: 0.738, y: 0.385, w: 0.11, cats: ['baby-kids', 'family'] },
    ],
  },
];

// Frame finish that suits the artwork.
const FINISH = { religious: 'gold', wedding: 'gold', occasions: 'gold', 'love-romance': 'gold', nature: 'black', 'running-horses': 'black', 'home-vastu': 'black', personalized: 'walnut', family: 'walnut', 'baby-kids': 'walnut' };

/* Bestsellers. Real sales are used when there are enough of them; until then
   (a handful of test orders today) the bestseller flag set in admin decides —
   never a guess. One product per category, in the admin's display order. */
function pickArt(products) {
  const pool = (products || []).filter((p) => p.is_bestseller && p.thumbnail);
  const byCat = new Map();
  pool.forEach((p) => !byCat.has(p.category) && byCat.set(p.category, p));
  const used = new Set();
  const take = (cats) => {
    for (const c of cats) {
      const p = byCat.get(c);
      if (p && !used.has(p.id)) return used.add(p.id), p;
    }
    const firstFree = [...byCat.values()].find((p) => !used.has(p.id)) || pool.find((p) => !used.has(p.id));
    if (firstFree) used.add(firstFree.id);
    return firstFree || null;
  };
  return ROOMS.map((r) => r.slots.map((s) => take(s.cats)));
}

/* Room photographs are painted onto canvas: the homepage underneath has
   already loaded, and this keeps a decorative opening from being measured as
   the page's main content (Core Web Vitals). */
function Photo({ src, w, h, className, onSize }) {
  const ref = useRef(null);
  useEffect(() => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => {
      const c = ref.current;
      if (!c) return;
      c.width = im.naturalWidth || w;
      c.height = im.naturalHeight || h;
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      c.classList.add('ready');
      if (im.naturalWidth) onSize?.(im.naturalWidth, im.naturalHeight);
    };
    im.src = src;
    return () => (im.onload = null);
  }, [src, w, h]); // eslint-disable-line react-hooks/exhaustive-deps
  return <canvas ref={ref} className={className} width={w} height={h} aria-hidden="true" />;
}

/* ── Gate leaf, drawn as architecture: wood, raised panels, gold inlay ── */
function Leaf({ W, side }) {
  const H = 1000;
  const id = `gl${side}${W}`;
  const fanCx = W / 2;
  const top = { x: 44, y: 58, w: W - 88, h: 372 };
  const bot = { x: 44, y: 566, w: W - 88, h: 376 };
  const rays = 13;
  return (
    <svg className="gx-leaf-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="1" y2="0.15">
          <stop offset="0" stopColor="#2a1e16" />
          <stop offset="0.45" stopColor="#3a2a1e" />
          <stop offset="1" stopColor="#21170f" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7b5d2a" />
          <stop offset="0.42" stopColor="#e6cf98" />
          <stop offset="0.6" stopColor="#b89a60" />
          <stop offset="1" stopColor="#6c5022" />
        </linearGradient>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#3d2c20" />
          <stop offset="1" stopColor="#1d140e" />
        </linearGradient>
        <radialGradient id={`${id}j`} cx="0.5" cy="1" r="0.95">
          <stop offset="0" stopColor="#120c08" />
          <stop offset="1" stopColor="#21170f" />
        </radialGradient>
        <filter id={`${id}n`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.42" numOctaves="2" seed="7" />
          <feColorMatrix values="0 0 0 0 0.08  0 0 0 0 0.05  0 0 0 0 0.03  0 0 0 0.55 0" />
        </filter>
        <clipPath id={`${id}c`}>
          <path d={`M${top.x} ${top.y + top.h} V${top.y + 120} Q${top.x} ${top.y} ${fanCx} ${top.y} Q${top.x + top.w} ${top.y} ${top.x + top.w} ${top.y + 120} V${top.y + top.h} Z`} />
        </clipPath>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}w)`} />
      <rect width={W} height={H} filter={`url(#${id}n)`} opacity="0.9" />
      {/* stiles and rails */}
      <rect x="12" y="12" width={W - 24} height={H - 24} fill="none" stroke={`url(#${id}g)`} strokeWidth="3" />
      <rect x="24" y="24" width={W - 48} height={H - 48} fill="none" stroke="#b89a60" strokeOpacity="0.45" strokeWidth="1" />
      {/* upper panel: arched jaali screen in gold */}
      <path d={`M${top.x} ${top.y + top.h} V${top.y + 120} Q${top.x} ${top.y} ${fanCx} ${top.y} Q${top.x + top.w} ${top.y} ${top.x + top.w} ${top.y + 120} V${top.y + top.h} Z`} fill={`url(#${id}j)`} stroke={`url(#${id}g)`} strokeWidth="2.5" />
      <g clipPath={`url(#${id}c)`} stroke={`url(#${id}g)`} fill="none" strokeOpacity="0.9">
        {Array.from({ length: rays }, (_, i) => {
          const a = Math.PI * (i / (rays - 1));
          const r = top.h * 1.25;
          return <line key={i} x1={fanCx} y1={top.y + top.h} x2={fanCx - Math.cos(a) * r} y2={top.y + top.h - Math.sin(a) * r} strokeWidth="1.3" />;
        })}
        {[0.28, 0.5, 0.72, 0.95].map((k) => (
          <circle key={k} cx={fanCx} cy={top.y + top.h} r={top.h * k} strokeWidth={k === 0.5 ? 2.2 : 1.1} />
        ))}
        <circle cx={fanCx} cy={top.y + top.h} r={top.h * 0.13} fill="#b89a60" fillOpacity="0.25" strokeWidth="2" />
      </g>
      {/* middle rail with studs */}
      <rect x="24" y="458" width={W - 48} height="84" fill="#1c130d" opacity="0.55" />
      <line x1="24" y1="458" x2={W - 24} y2="458" stroke="#b89a60" strokeOpacity="0.6" />
      <line x1="24" y1="542" x2={W - 24} y2="542" stroke="#b89a60" strokeOpacity="0.6" />
      {Array.from({ length: Math.floor((W - 120) / 46) }, (_, i) => (
        <circle key={i} cx={52 + i * 46} cy="500" r="4.2" fill={`url(#${id}g)`} />
      ))}
      {/* lower raised panel with gold inlay */}
      <rect x={bot.x} y={bot.y} width={bot.w} height={bot.h} fill={`url(#${id}p)`} />
      <path d={`M${bot.x} ${bot.y} h${bot.w} l-16 16 h${-(bot.w - 32)} v${bot.h - 32} l-16 16 Z`} fill="#ffffff" opacity="0.05" />
      <path d={`M${bot.x + bot.w} ${bot.y + bot.h} h${-bot.w} l16 -16 h${bot.w - 32} v${-(bot.h - 32)} l16 -16 Z`} fill="#000" opacity="0.28" />
      <rect x={bot.x + 34} y={bot.y + 34} width={bot.w - 68} height={bot.h - 68} fill="none" stroke={`url(#${id}g)`} strokeWidth="1.6" />
      <rect x={bot.x + 44} y={bot.y + 44} width={bot.w - 88} height={bot.h - 88} fill="none" stroke="#b89a60" strokeOpacity="0.35" strokeWidth="0.8" />
      <g transform={`translate(${W / 2} ${bot.y + bot.h / 2})`} stroke={`url(#${id}g)`} fill="none" strokeWidth="1.6">
        <path d="M0 -58 L34 0 L0 58 L-34 0 Z" />
        <path d="M0 -36 L20 0 L0 36 L-20 0 Z" fill="#b89a60" fillOpacity="0.18" />
        <circle r="6" fill="#d9bf86" stroke="none" />
      </g>
      {/* pull handle near the meeting edge, split around the lock */}
      {[
        [300, 140],
        [560, 140],
      ].map(([y, h]) => (
        <g key={y}>
          <rect x={W - 46} y={y} width="12" height={h} rx="6" fill={`url(#${id}g)`} />
          <rect x={W - 43} y={y + 8} width="3" height={h - 16} rx="1.5" fill="#fff6dc" opacity="0.55" />
        </g>
      ))}
    </svg>
  );
}

/* The lock: brass medallion with the official JHAYRA monogram engraved.
   Each gate leaf carries one half, so when the gates part the lock parts too. */
function LockHalf() {
  return (
    <div className="gx-lock" aria-hidden="true">
      <span className="gx-bolt" />
      <span className="gx-ring" />
      <span className="gx-dial">
        <span className="gx-dial-face" />
        <img className="gx-mono" src="/logo-mark-lg.webp" alt="" width="541" height="480" decoding="async" />
        <span className="gx-trace" />
        <span className="gx-notch" />
      </span>
    </div>
  );
}

function ArtFrame({ slot, p, room }) {
  const [ratio, setRatio] = useState(1.414);
  if (!p) return null;
  const finish = FINISH[p.category] || 'black';
  // Sizes in units of the photo's width: moulding 4.5% of the frame, artwork
  // area keeps the image's own proportions so nothing is stretched or cropped.
  const pad = slot.w * 0.045;
  const outerH = (slot.w - 2 * pad) * ratio + 2 * pad;
  const wPct = slot.w * 100;
  const hPct = ((outerH * room.w) / room.h) * 100;
  return (
    <figure className={`gx-frame f-${finish} ${slot.hero ? 'hero' : ''}`} style={{ left: `${slot.x * 100 - wPct / 2}%`, top: `${slot.y * 100 - hPct / 2}%`, width: `${wPct}%`, height: `${hPct}%`, padding: `${pad * 100}%` }}>
      <span className="gx-frame-in">
        <Photo className="gx-art" src={optimized(p.thumbnail, slot.hero ? 560 : 360)} w={1000} h={1414} onSize={(nw, nh) => setRatio(nh / nw)} />
        <span className="gx-glass" />
      </span>
    </figure>
  );
}

function Room({ room, art, state, onExplore, cover }) {
  const heroIdx = room.slots.findIndex((s) => s.hero);
  const hero = art?.[heroIdx];
  const c = cover[room.id];
  return (
    <section className={`gx-room r-${room.id} ${state}`} aria-hidden={state !== 'on'}>
      <div className="gx-photo" style={c}>
        <Photo className="gx-bg" src={room.src} w={room.w} h={room.h} />
        {room.patch && <span className="gx-patch" style={{ left: `${room.patch.x * 100}%`, top: `${room.patch.y * 100}%`, width: `${room.patch.w * 100}%`, height: `${room.patch.h * 100}%` }} />}
        {room.slots.map((s, i) => (
          <ArtFrame key={i} slot={s} p={art?.[i]} room={room} />
        ))}
      </div>
      <div className="gx-shade" />
      {hero && (
        <div className="gx-tag">
          <small>{room.label}</small>
          <b>{hero.name}</b>
          <a
            href={`/product/${hero.id}`}
            tabIndex={state === 'on' ? 0 : -1}
            onClick={(e) => {
              e.preventDefault();
              onExplore(hero.id);
            }}
          >
            Explore artwork <span aria-hidden="true">→</span>
          </a>
        </div>
      )}
    </section>
  );
}

// Each room photo covers the screen with room to pan; the camera's path is
// clamped so an edge of the photograph never shows.
function coverFor(room, vw, vh) {
  const ar = room.w / room.h;
  const k = 1.1;
  const W = Math.max(vw * k, vh * k * ar);
  const H = W / ar;
  const sx = (W - vw) / 2;
  const sy = (H - vh) / 2;
  const cl = (v, m) => Math.max(-m, Math.min(m, v));
  const [fx0, fy0, fx1, fy1] = room.pan;
  return {
    width: `${W}px`,
    height: `${H}px`,
    '--x0': `${cl((0.5 - fx0) * W, sx)}px`,
    '--y0': `${cl((0.5 - fy0) * H, sy)}px`,
    '--x1': `${cl((0.5 - fx1) * W, sx)}px`,
    '--y1': `${cl((0.5 - fy1) * H, sy)}px`,
    '--z1': room.zoom,
  };
}

function useStage() {
  const calc = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const portrait = vw / vh < 0.82;
    const leafW = portrait ? 310 : 430;
    const r = leafW / 1000;
    let gh = portrait ? (vw * 0.8) / (2 * r) : vh * 0.62;
    gh = Math.min(gh, vh * (portrait ? 0.6 : 0.62), (vw * (portrait ? 0.86 : 0.62)) / (2 * r));
    const gw = gh * 2 * r;
    const cover = Object.fromEntries(ROOMS.map((room) => [room.id, coverFor(room, vw, vh)]));
    return { vw, vh, portrait, leafW, gh, gw, cover };
  };
  const [s, setS] = useState(calc);
  useEffect(() => {
    let t;
    const on = () => {
      clearTimeout(t);
      t = setTimeout(() => setS(calc()), 120);
    };
    window.addEventListener('resize', on);
    return () => (window.removeEventListener('resize', on), clearTimeout(t));
  }, []);
  return s;
}

const ROOM_STEP = { living: 'through', bedroom: 'bedroom', dining: 'dining', hall: 'hall' };

export default function GatewayIntro(props) {
  // Arrived after the pre-paint failsafe already showed the homepage: stand down.
  const [alive] = useState(() => document.documentElement.classList.contains('jh-intro'));
  useEffect(() => {
    if (!alive) props.onDone();
  }, [alive]); // eslint-disable-line react-hooks/exhaustive-deps
  return alive ? <Gateway {...props} /> : null;
}

function Gateway({ onDone }) {
  const navigate = useNavigate();
  const stage = useStage();
  const [reached, setReached] = useState(() => new Set());
  const [art, setArt] = useState(null);
  const [sound, setSound] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timers = useRef([]);
  const audio = useRef(null);
  const finished = useRef(false);
  const cam = useRef(null);
  const portal = useRef(null);

  const has = (k) => reached.has(k);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    timers.current.forEach(clearTimeout);
    audio.current?.stop();
    onDone();
  }, [onDone]);

  // Skip / end: a short dissolve, never a hard cut.
  const leave = useCallback(
    (fast) => {
      if (finished.current) return;
      timers.current.forEach(clearTimeout);
      timers.current = [];
      document.documentElement.classList.remove('jh-intro');
      setLeaving(fast ? 'fast' : 'slow');
      audio.current?.fade();
      timers.current.push(setTimeout(finish, fast ? 520 : 800));
    },
    [finish]
  );

  // The timeline.
  useEffect(() => {
    STEPS.forEach(([k, t]) =>
      timers.current.push(
        setTimeout(() => {
          setReached((r) => new Set(r).add(k));
          audio.current?.cue(k);
          if (k === 'dissolve') leave(false);
        }, t)
      )
    );
    // Absolute failsafe: nobody stays behind the intro.
    const hard = setTimeout(finish, END_AT + 4000);
    return () => {
      timers.current.forEach(clearTimeout);
      clearTimeout(hard);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Real products, and the admin on/off switch.
  useEffect(() => {
    let live = true;
    loadProducts()
      .then((list) => {
        if (!live) return;
        const picked = pickArt(list);
        setArt(picked);
        picked.flat().forEach((p) => p && (new Image().src = optimized(p.thumbnail, 360)));
      })
      .catch(() => {});
    ROOMS.forEach((r) => (new Image().src = r.src));
    const { data } = supabase.storage.from('product-images').getPublicUrl('site-config/intro.json');
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 2500);
    fetch(`${data.publicUrl}?t=${Math.floor(Date.now() / 60000)}`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => {
        try {
          if (cfg && cfg.enabled === false) {
            localStorage.setItem('jh_intro_off', '1');
            if (live && !new URLSearchParams(location.search).has('intro')) leave(true);
          } else localStorage.removeItem('jh_intro_off');
        } catch {}
      })
      .catch(() => {})
      .finally(() => clearTimeout(t));
    return () => {
      live = false;
      ac.abort();
    };
  }, [leave]);

  // Camera origin = the lock, measured from the real layout.
  useEffect(() => {
    const c = cam.current;
    const p = portal.current;
    if (!c || !p) return;
    const door = p.querySelector('.gx-door');
    const rc = c.getBoundingClientRect();
    const rd = door.getBoundingClientRect();
    c.style.setProperty('--ox', `${rd.left + rd.width / 2 - rc.left}px`);
    c.style.setProperty('--oy', `${rd.top + rd.height / 2 - rc.top}px`);
  }, [stage]);

  // Page underneath stays put and out of reach until the gates have opened.
  useEffect(() => {
    const root = document.getElementById('root');
    document.documentElement.classList.add('jh-intro-run');
    if (root) root.inert = true;
    const key = (e) => e.key === 'Escape' && leave(true);
    window.addEventListener('keydown', key);
    return () => {
      document.documentElement.classList.remove('jh-intro-run', 'jh-intro');
      if (root) root.inert = false;
      window.removeEventListener('keydown', key);
    };
  }, [leave]);

  const toggleSound = () => {
    if (!audio.current) audio.current = createIntroSound();
    const on = !sound;
    setSound(on);
    audio.current.setOn(on, [...reached]);
  };

  const explore = (id) => {
    leave(true);
    navigate(`/product/${id}`);
  };

  const roomOrder = ROOMS.map((r) => r.id);
  const current = [...roomOrder].reverse().find((id) => has(ROOM_STEP[id]));
  const brand = has('brand');
  const roomState = (id) => {
    if (brand) return id === 'living' ? 'on final' : id === roomOrder[roomOrder.length - 1] ? 'off' : 'gone';
    if (!current) return 'wait';
    const i = roomOrder.indexOf(id);
    const ci = roomOrder.indexOf(current);
    if (i === ci) return `on ${has('focus') && id === 'living' ? 'focus' : ''} ${id === 'living' ? 'first' : ''}`;
    return i === ci - 1 ? 'off' : i < ci ? 'gone' : 'wait';
  };

  const cls = ['gx', stage.portrait ? 'portrait' : 'land', leaving ? `leaving ${leaving}` : '', ...[...reached].map((k) => `s-${k}`)].join(' ');
  const css = { '--gh': `${stage.gh}px`, '--gw': `${stage.gw}px` };

  return createPortal(
    <div className={cls} style={css} role="dialog" aria-modal="true" aria-label="Welcome to JHAYRA">
      {/* ── The house: real rooms with real JHAYRA bestsellers ── */}
      <div className="gx-house">
        {ROOMS.map((r, i) => (
          <Room key={r.id} room={r} art={art?.[i]} state={roomState(r.id)} onExplore={explore} cover={stage.cover} />
        ))}
        <div className="gx-brand" aria-hidden={!brand}>
          <img src="/logo-mark-lg.webp" alt="" width="541" height="480" />
          <h2>
            {'JHAYRA'.split('').map((ch, i) => (
              <span key={i} style={{ '--i': i }}>
                {ch}
              </span>
            ))}
          </h2>
          <p className="gx-tagline">Crafting Memories Into Art.</p>
          <p className="gx-line">Every memory deserves a beautiful frame.</p>
        </div>
      </div>

      {/* ── The estate entrance ── */}
      <div className="gx-gate-world">
        <div className="gx-cam" ref={cam}>
          <div className="gx-wall" />
          <div className="gx-floor" />
          <div className="gx-entrance" ref={portal}>
            <div className="gx-pillar l">
              <i className="gx-sconce" />
            </div>
            <div className="gx-casing">
              <div className="gx-arch">
                <div className="gx-fan" />
              </div>
              <div className="gx-door">
                <div className="gx-inside">
                  <Photo className="gx-inside-photo" src="/rooms/hero-living.webp" w={1024} h={922} />
                </div>
                <div className="gx-spill" />
                <div className="gx-leaf l">
                  <Leaf W={stage.leafW} side="l" />
                  <LockHalf />
                </div>
                <div className="gx-leaf r">
                  <Leaf W={stage.leafW} side="r" />
                  <LockHalf />
                </div>
              </div>
            </div>
            <div className="gx-pillar r">
              <i className="gx-sconce" />
            </div>
          </div>
          <div className="gx-pool" />
        </div>
        <div className="gx-vignette" />
      </div>

      <div className="gx-ui">
        <button type="button" className="gx-btn gx-sound" onClick={toggleSound} aria-pressed={sound} aria-label={sound ? 'Turn sound off' : 'Turn sound on'}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
            {sound ? <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /> : <path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
          </svg>
          <span>Sound</span>
        </button>
        <button type="button" className="gx-btn gx-skip" onClick={() => leave(true)}>
          Skip intro <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>,
    document.body
  );
}

// Exposed for tests.
export { pickArt, ROOMS };
