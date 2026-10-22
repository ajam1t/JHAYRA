import { useEffect, useRef } from 'react';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const IDENTITY = { zoom: 1, panX: 0, panY: 0 };

function limit(t) {
  const zoom = clamp(t.zoom, 1, 4);
  const m = (1 - 1 / zoom) / 2;
  return { zoom, panX: clamp(t.panX, -m, m), panY: clamp(t.panY, -m, m) };
}

/**
 * Photo inside a clipped box with drag-to-move, pinch / wheel to zoom.
 * Transform shape { zoom, panX, panY } matches what the order system stores.
 */
export default function PanZoom({ src, value = IDENTITY, onChange, alt = '', editable = true, className = '' }) {
  const box = useRef(null);
  const pointers = useRef(new Map());
  const start = useRef(null);
  const val = useRef(value);
  val.current = value;

  useEffect(() => {
    const el = box.current;
    if (!el || !editable) return;
    const wheel = (e) => {
      e.preventDefault();
      const t = val.current;
      onChange(limit({ ...t, zoom: t.zoom * (e.deltaY < 0 ? 1.08 : 0.926) }));
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, [editable, onChange]);

  if (!src) return null;

  const down = (e) => {
    if (!editable) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    start.current = null;
  };
  const move = (e) => {
    if (!editable || !pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const t = val.current;
    const r = box.current.getBoundingClientRect();
    if (pointers.current.size === 1) {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      onChange(limit({ ...t, panX: t.panX + dx / (r.width * t.zoom), panY: t.panY + dy / (r.height * t.zoom) }));
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (!start.current) start.current = { d, zoom: t.zoom };
      else onChange(limit({ ...t, zoom: start.current.zoom * (d / start.current.d) }));
    }
  };
  const up = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) start.current = null;
  };

  return (
    <div
      ref={box}
      className={`panzoom ${editable ? 'editable' : ''} ${className}`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <img
        src={src}
        alt={alt}
        draggable="false"
        style={{ transform: `scale(${value.zoom}) translate(${value.panX * 100}%, ${value.panY * 100}%)` }}
      />
    </div>
  );
}

export function ZoomControls({ value, onChange }) {
  return (
    <div className="zoom-controls" role="group" aria-label="Adjust photo">
      <button type="button" onClick={() => onChange(limit({ ...value, zoom: value.zoom / 1.15 }))} aria-label="Zoom out">
        −
      </button>
      <input
        type="range"
        min="1"
        max="4"
        step="0.01"
        value={value.zoom}
        onChange={(e) => onChange(limit({ ...value, zoom: +e.target.value }))}
        aria-label="Zoom"
      />
      <button type="button" onClick={() => onChange(limit({ ...value, zoom: value.zoom * 1.15 }))} aria-label="Zoom in">
        +
      </button>
      <button type="button" className="reset" onClick={() => onChange(IDENTITY)}>
        Reset
      </button>
    </div>
  );
}
