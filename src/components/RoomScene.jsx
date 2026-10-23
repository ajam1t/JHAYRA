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
export default function RoomScene({ frames = [], wall = WALLS[0], furniture = 'sofa', photo, onFrameDrag, onFrameClick, selected, groupHeightIn, zoom = 1, furnitureWidth = 0.62, decor = false, children, className = '' }) {
  const ref = useRef(null);
  const [{ W, H }, setSize] = useState({ W: 800, H: 550 });
  const drag = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ W: e.contentRect.width, H: e.contentRect.height || (e.contentRect.width * 11) / 16 }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const f = FURNITURE.find((x) => x.id === furniture) || FURNITURE[0];
  // Furniture spans `furnitureWidth` of the scene; an empty wall shows ~120 inches across.
  // `zoom` enlarges frames for decorative scenes (true scale when 1).
  const ppi = (f.width ? (W * furnitureWidth) / f.width : W / 120) * zoom;
  // Top edge of the furniture as a fraction of the scene height (it sits 12% above the bottom).
  const ASPECT = { sofa: 300 / 840, bed: 260 / 720, console: 300 / 480 };
  const top = ASPECT[f.id] ? 1 - 0.12 - (W * furnitureWidth * ASPECT[f.id]) / H : null;

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
      {!photo && decor && (
        <>
          <div className="room-rug" />
          <svg className="room-lamp" viewBox="0 0 60 300" aria-hidden="true">
            <path d="M12 0h36l10 44H2z" fill="#efe3cc" />
            <path d="M12 0h36l10 44H2z" fill="url(#lamp-glow)" opacity=".5" />
            <rect x="28" y="44" width="4" height="240" fill="#3d3329" />
            <ellipse cx="30" cy="290" rx="20" ry="6" fill="#3d3329" />
            <defs>
              <radialGradient id="lamp-glow" cx="50%" cy="100%" r="80%">
                <stop offset="0" stopColor="#fff6dc" />
                <stop offset="1" stopColor="#efe3cc" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
          <svg className="room-plant" viewBox="0 0 120 220" aria-hidden="true">
            <g fill="#5f7a52">
              <path d="M60 150C40 120 18 110 6 70c26 6 44 30 54 80z" />
              <path d="M62 150c4-40 20-70 50-96-4 40-22 70-50 96z" fill="#6e8a5f" />
              <path d="M58 152C46 100 50 50 70 12c10 44 4 96-12 140z" fill="#4f6a45" />
              <path d="M60 152c-18-20-40-26-58-24 18 16 38 26 58 24z" fill="#6e8a5f" />
              <path d="M62 152c16-24 38-34 56-34-14 18-34 30-56 34z" />
            </g>
            <path d="M34 150h52l-8 66H42z" fill="#d9cbb4" />
            <path d="M34 150h52l-2 10H36z" fill="#c4b49a" />
          </svg>
        </>
      )}
      {!photo && f.width > 0 && (
        <div className="room-furniture-wrap" style={{ width: `${furnitureWidth * 100}%` }}>
          <Sofa id={f.id} />
        </div>
      )}
      {frames.map((fr) => {
        const wPx = fr.wIn * ppi * (fr.scale || 1);
        // Auto-hang: bottom edge ~9in above the furniture (or eye level on an empty wall).
        // Groups (gallery walls) hang as one block; dxIn/dyIn are inches from the block centre.
        const blockH = groupHeightIn ?? fr.hIn;
        const autoY = (top ? top - ((9 + blockH / 2) * ppi * (fr.scale || 1)) / H : 0.42) + ((fr.dyIn || 0) * ppi) / H;
        const autoX = 0.5 + ((fr.dxIn || 0) * ppi) / W;
        return (
          <div
            key={fr.key}
            className={`room-frame ${onFrameDrag ? 'draggable' : ''} ${selected === fr.key ? 'selected' : ''}`}
            style={{ width: `${wPx}px`, left: `${(fr.x ?? autoX) * 100}%`, top: `${Math.max(0.06, fr.y ?? autoY) * 100}%` }}
            onClick={() => onFrameClick?.(fr.key)}
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
