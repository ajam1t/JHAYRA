import { useEffect, useRef } from 'react';

// JHAYRA's signature object: a solid frame with gold edges, the J monogram on
// an ivory mat at the front and the wordmark stamped on the back. It sways on
// its own and can be dragged to turn it (static when reduced motion is set).
export default function Monogram3D({ className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let drag = null;
    let rest = 0;
    const down = (e) => {
      drag = { x: e.clientX, y: e.clientY, ry: rest };
      el.classList.add('drag');
      el.setPointerCapture?.(e.pointerId);
    };
    const move = (e) => {
      if (!drag) return;
      rest = drag.ry + (e.clientX - drag.x) * 0.9;
      const rx = Math.max(-25, Math.min(25, -(e.clientY - drag.y) * 0.4));
      el.style.setProperty('--ry', `${rest}deg`);
      el.style.setProperty('--rx', `${rx}deg`);
    };
    const up = () => {
      if (!drag) return;
      drag = null;
      // Settle back to the nearest face, then resume the gentle sway.
      rest = Math.round(rest / 180) * 180;
      el.style.setProperty('--ry', `${rest}deg`);
      el.style.setProperty('--rx', '0deg');
      el.classList.remove('drag');
    };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);

  return (
    <div className={`m3d ${className}`} aria-hidden="true">
      <div className="m3d-stage" ref={ref}>
        <div className="m3d-sway">
          <div className="m3d-box">
            <div className="m3d-face m3d-front">
              <div className="m3d-mat">
                <img src="/logo-mark-lg.webp" alt="" width="360" height="320" draggable="false" />
                <span className="m3d-word">JHAYRA</span>
              </div>
              <span className="m3d-sheen" />
            </div>
            <div className="m3d-face m3d-back">
              <span>JHAYRA</span>
              <small>Crafting Memories Into Art</small>
            </div>
            <div className="m3d-face m3d-left" />
            <div className="m3d-face m3d-right" />
            <div className="m3d-face m3d-top" />
            <div className="m3d-face m3d-bottom" />
          </div>
        </div>
      </div>
      <span className="m3d-shadow" />
      <span className="m3d-ring" />
    </div>
  );
}
