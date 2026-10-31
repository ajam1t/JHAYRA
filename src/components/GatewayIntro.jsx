import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { loadProducts } from '../lib/catalog';
import { optimized } from '../lib/img';
import { supabase } from '../lib/supabase';
import '../styles/gateway.css';

// The chunk has loaded: the pre-paint failsafe in index.html stands down.
if (typeof window !== 'undefined') window.__jhIntro = true;

/* ─────────────────────────────────────────────────────────────────────────
   JHAYRA — cinematic gateway
   THE GATE → THE JHAYRA KEY → THE UNLOCKING → THE HOME → THE ART → HOMEPAGE
   One timeline drives every scene; each step adds a class, CSS does the motion.
   ───────────────────────────────────────────────────────────────────────── */
const STEPS = [
  ['focus', 650],
  ['bedroom', 1650],
  ['dining', 2600],
  ['hall', 3550],
  ['brand', 4450],
  ['dissolve', 5700],
];
const END_AT = 6500;

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

function ArtFrame({ slot, p, room }) {
  const [ratio, setRatio] = useState(1.414);
  const [shown, setShown] = useState(false);
  if (!p) return null;
  const finish = FINISH[p.category] || 'black';
  // Sizes in units of the photo's width: moulding 4.5% of the frame, artwork
  // area keeps the image's own proportions so nothing is stretched or cropped.
  const pad = slot.w * 0.045;
  const outerH = (slot.w - 2 * pad) * ratio + 2 * pad;
  const wPct = slot.w * 100;
  const hPct = ((outerH * room.w) / room.h) * 100;
  return (
    <figure className={`gx-frame f-${finish} ${slot.hero ? 'hero' : ''}`} style={{ left: `${slot.x * 100 - wPct / 2}%`, top: `${slot.y * 100 - hPct / 2}%`, width: `${wPct}%`, height: `${hPct}%`, padding: `${pad * 100}%`, ...(shown ? {} : { opacity: 0 }) }}>
      <span className="gx-frame-in">
        <Photo className="gx-art" src={optimized(p.thumbnail, slot.hero ? 560 : 360)} w={1000} h={1414} onSize={(nw, nh) => (setRatio(nh / nw), setShown(true))} />
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
  const [reached, setReached] = useState(() => new Set(['open', 'through']));
  const [art, setArt] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const timers = useRef([]);
  const finished = useRef(false);

  const has = (k) => reached.has(k);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    timers.current.forEach(clearTimeout);
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
      timers.current.push(setTimeout(finish, fast ? 520 : 800));
    },
    [finish]
  );

  // Start once the living room and its three artworks are ready (max ~2s),
  // so the first thing anyone sees is the finished room, never empty frames.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2200);
    // Absolute failsafe: nobody stays behind the intro.
    const hard = setTimeout(finish, END_AT + 6000);
    return () => (clearTimeout(t), clearTimeout(hard));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // The timeline.
  useEffect(() => {
    if (!ready) return;
    STEPS.forEach(([k, t]) =>
      timers.current.push(
        setTimeout(() => {
          setReached((r) => new Set(r).add(k));
          if (k === 'dissolve') leave(false);
        }, t)
      )
    );
    return () => timers.current.forEach(clearTimeout);
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // Real products, and the admin on/off switch.
  useEffect(() => {
    let live = true;
    loadProducts()
      .then((list) => {
        if (!live) return;
        const picked = pickArt(list);
        setArt(picked);
        picked.flat().forEach((p) => p && (new Image().src = optimized(p.thumbnail, 360)));
        const load = (src) => new Promise((r) => { const i = new Image(); i.onload = i.onerror = r; i.src = src; });
        Promise.all([load(ROOMS[0].src), ...ROOMS[0].slots.map((sl, i) => picked[0][i] && load(optimized(picked[0][i].thumbnail, sl.hero ? 560 : 360)))]).then(() => live && setReady(true));
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

  // Page underneath stays put and out of reach while the opening plays.
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

      <div className="gx-ui">
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
