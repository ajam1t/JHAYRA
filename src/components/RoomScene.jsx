import { useEffect, useRef, useState } from 'react';
import Frame from './Frame';

export const WALLS = [
  { id: 'ivory', label: 'Ivory', c: '#efe8dc', c2: '#e3d9c8' },
  { id: 'sage', label: 'Sage', c: '#c9cfbd', c2: '#b6bda8' },
  { id: 'terracotta', label: 'Terracotta', c: '#d7a58a', c2: '#c48e72' },
  { id: 'dusk', label: 'Dusk blue', c: '#9fb0c0', c2: '#8a9cae' },
  { id: 'blush', label: 'Blush', c: '#ead2cc', c2: '#dcbdb6' },
  { id: 'charcoal', label: 'Charcoal', c: '#4b4a48', c2: '#3a3937' },
];

export const FURNITURE = [
  { id: 'sofa', label: 'Sofa', width: 84 },
  { id: 'bed', label: 'Bed', width: 72 },
  { id: 'console', label: 'Console', width: 48 },
  { id: 'none', label: 'Empty wall', width: 0 },
];

function Sofa({ id }) {
  if (id === 'bed')
    return (
      <svg viewBox="0 0 720 260" className="room-furniture" aria-hidden="true">
        <rect x="20" y="40" width="680" height="140" rx="18" fill="#7a5b44" />
        <rect x="40" y="120" width="640" height="90" rx="14" fill="#f4efe6" />
        <rect x="70" y="92" width="180" height="56" rx="22" fill="#fff" />
        <rect x="470" y="92" width="180" height="56" rx="22" fill="#fff" />
        <rect x="40" y="170" width="640" height="60" rx="10" fill="#d9cdb9" />
        <rect x="50" y="228" width="16" height="30" fill="#5c4331" />
        <rect x="654" y="228" width="16" height="30" fill="#5c4331" />
      </svg>
    );
  if (id === 'console')
    return (
      <svg viewBox="0 0 480 300" className="room-furniture" aria-hidden="true">
        <rect x="10" y="60" width="460" height="22" rx="4" fill="#6b4e37" />
        <rect x="30" y="82" width="10" height="210" fill="#5a412e" />
        <rect x="440" y="82" width="10" height="210" fill="#5a412e" />
        <rect x="30" y="200" width="420" height="10" fill="#5a412e" />
        <path d="M90 60c0-40 10-58 26-58s26 18 26 58z" fill="#c9b79c" />
        <circle cx="380" cy="30" r="28" fill="#7f9a70" />
        <rect x="372" y="40" width="16" height="22" fill="#a77b56" />
      </svg>
    );
  if (id === 'none') return null;
  return (
    <svg viewBox="0 0 840 300" className="room-furniture" aria-hidden="true">
      <defs>
        <linearGradient id="sofa-g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#8b7d6b" />
          <stop offset="1" stopColor="#6e6253" />
        </linearGradient>
      </defs>
      <rect x="40" y="40" width="760" height="150" rx="34" fill="url(#sofa-g)" />
      <rect x="0" y="110" width="110" height="150" rx="30" fill="#7b6e5e" />
      <rect x="730" y="110" width="110" height="150" rx="30" fill="#7b6e5e" />
      <rect x="90" y="150" width="660" height="100" rx="20" fill="#93867a" />
      <rect x="140" y="80" width="150" height="100" rx="26" fill="#d8c9a8" transform="rotate(-6 215 130)" />
      <rect x="560" y="80" width="150" height="100" rx="26" fill="#b98a6b" transform="rotate(5 635 130)" />
      <rect x="70" y="250" width="14" height="40" rx="3" fill="#3d3329" />
      <rect x="756" y="250" width="14" height="40" rx="3" fill="#3d3329" />
    </svg>
  );
}

/**
 * A lit room wall that hangs frames at true relative scale: the furniture has a
 * known real width, so every frame is drawn at (inches × pixels-per-inch).
 * `frames`: [{ key, src, children, wIn, hIn, colour, x (0–1), y (0–1) }]
 */
export default function RoomScene({ frames = [], wall = WALLS[0], furniture = 'sofa', photo, onFrameDrag, children, className = '' }) {
  const ref = useRef(null);
  const [W, setW] = useState(800);
  const drag = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const f = FURNITURE.find((x) => x.id === furniture) || FURNITURE[0];
  // Furniture spans 62% of the scene; an empty wall shows ~120 inches across.
  const ppi = f.width ? (W * 0.62) / f.width : W / 120;

  const down = (key) => (e) => {
    if (!onFrameDrag) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = ref.current.getBoundingClientRect();
    drag.current = { key, r };
  };
  const move = (e) => {
    if (!drag.current) return;
    const { key, r } = drag.current;
    onFrameDrag(key, Math.max(0.05, Math.min(0.95, (e.clientX - r.left) / r.width)), Math.max(0.08, Math.min(0.8, (e.clientY - r.top) / r.height)));
  };
  const up = () => (drag.current = null);

  return (
    <div
      ref={ref}
      className={`room ${photo ? 'room-photo' : ''} ${className}`}
      style={{ '--wall': wall.c, '--wall2': wall.c2, backgroundImage: photo ? `url(${photo})` : undefined }}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      {!photo && (
        <>
          <div className="room-light" />
          <div className="room-floor" />
          <div className="room-skirting" />
        </>
      )}
      {!photo && f.width > 0 && (
        <div className="room-furniture-wrap" style={{ width: `${62}%` }}>
          <Sofa id={f.id} />
        </div>
      )}
      {frames.map((fr) => {
        const wPx = fr.wIn * ppi * (fr.scale || 1);
        // Auto-hang: bottom edge ~9in above the furniture (or eye level on an empty wall).
        const H = (W * 11) / 16;
        const top = { sofa: 0.558, bed: 0.554, console: 0.316 }[f.id];
        const autoY = top ? top - ((9 + fr.hIn / 2) * ppi * (fr.scale || 1)) / H : 0.42;
        return (
          <div
            key={fr.key}
            className={`room-frame ${onFrameDrag ? 'draggable' : ''}`}
            style={{ width: `${wPx}px`, left: `${(fr.x ?? 0.5) * 100}%`, top: `${Math.max(0.06, fr.y ?? autoY) * 100}%` }}
            onPointerDown={down(fr.key)}
          >
            <Frame src={fr.src} ratio={{ w: fr.wIn, h: fr.hIn }} colour={fr.colour} sizes={`${Math.round(wPx)}px`} thickness={fr.thickness || 4.2}>
              {fr.children}
            </Frame>
          </div>
        );
      })}
      {children}
    </div>
  );
}
