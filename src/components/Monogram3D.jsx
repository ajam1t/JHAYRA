import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Img from './Img';

// JHAYRA's signature object: a solid frame with gold edges and the wordmark
// stamped on the back. The front crossfades through `items` (bestsellers)
// every 3.5 s — tap opens the artwork; without items it shows the J monogram.
// It sways on its own and can be dragged to turn it (static with reduced motion).
export default function Monogram3D({ className = '', items = [] }) {
  const ref = useRef(null);
  const moved = useRef(false);
  const navigate = useNavigate();
  const [k, setK] = useState(0);
  const [hold, setHold] = useState(false);
  const n = items.length;
  useEffect(() => {
    if (n < 2 || hold || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setTimeout(() => setK((x) => (x + 1) % n), 3500);
    return () => clearTimeout(t);
  }, [k, n, hold]);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let drag = null;
    let rest = 0;
    const down = (e) => {
      moved.current = false;
      drag = { x: e.clientX, y: e.clientY, ry: rest };
      el.classList.add('drag');
      el.setPointerCapture?.(e.pointerId);
    };
    const move = (e) => {
      if (!drag) return;
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 6) moved.current = true;
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
    <div className={`m3d ${className}`} aria-hidden={n ? undefined : 'true'}>
      <div
        className="m3d-stage"
        ref={ref}
        role={n ? 'link' : undefined}
        tabIndex={n ? 0 : undefined}
        aria-label={n ? `${items[k % n].name} — view this artwork` : undefined}
        onClick={() => n && !moved.current && navigate(`/product/${items[k % n].id}`)}
        onKeyDown={(e) => n && e.key === 'Enter' && navigate(`/product/${items[k % n].id}`)}
        onPointerEnter={() => setHold(true)}
        onPointerLeave={() => setHold(false)}
      >
        <div className="m3d-sway">
          <div className="m3d-box">
            <div className="m3d-face m3d-front">
              {n ? (
                <div className="m3d-mat m3d-show">
                  {[(k - 1 + n) % n, k % n, (k + 1) % n].map((j, i) => (
                    <Img key={items[j].id} src={items[j].thumbnail} alt="" sizes="110px" width={240} className={i === 1 ? 'on' : i === 0 ? 'out' : 'next'} />
                  ))}
                </div>
              ) : (
                <div className="m3d-mat">
                  <img src="/logo-mark.webp" alt="" width="180" height="160" draggable="false" />
                  <span className="m3d-word">JHAYRA</span>
                </div>
              )}
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
