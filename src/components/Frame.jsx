import { useEffect, useRef } from 'react';
import Img from './Img';

function shade(hex, amt) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

/**
 * A physically-styled picture frame: bevelled moulding, optional mat, glass glare,
 * soft contact shadow and an optional pointer-driven 3D tilt.
 */
export default function Frame({
  src,
  alt = '',
  ratio = { w: 9.5, h: 13 },
  orientation = 'Vertical',
  colour = '#1C1C1C',
  mat = false,
  tilt = false,
  glare = true,
  transform,
  sizes = '(max-width: 700px) 80vw, 40vw',
  priority = false,
  children,
  className = '',
  style,
  thickness = 3.4,
  onPointerDown,
  artRef,
}) {
  const ref = useRef(null);
  const portrait = orientation !== 'Horizontal';
  const w = portrait ? ratio.w : ratio.h;
  const h = portrait ? ratio.h : ratio.w;

  useEffect(() => {
    if (!tilt) return;
    const el = ref.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
        el.style.setProperty('--gx', `${(x + 0.5) * 100}%`);
        el.style.setProperty('--gy', `${(y + 0.5) * 100}%`);
      });
    };
    const leave = () => {
      el.style.setProperty('--ry', '0deg');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--gx', '30%');
      el.style.setProperty('--gy', '20%');
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      cancelAnimationFrame(raf);
    };
  }, [tilt]);

  const t = transform || { zoom: 1, panX: 0, panY: 0 };
  const light = shade(colour, 0.16);
  const dark = shade(colour, -0.18);

  return (
    <div
      ref={ref}
      className={`frame ${tilt ? 'frame-tilt' : ''} ${className}`}
      style={{
        '--fc': colour,
        '--fc-l': light,
        '--fc-d': dark,
        '--th': `${thickness}%`,
        aspectRatio: `${w} / ${h}`,
        ...style,
      }}
    >
      <div className="frame-body">
        <div className={`frame-inner ${mat ? 'has-mat' : ''}`}>
          <div className="frame-art" ref={artRef} onPointerDown={onPointerDown}>
            {children ||
              (src ? (
                src.startsWith('blob:') || src.startsWith('data:') ? (
                  <img src={src} alt={alt} draggable="false" style={{ transform: `scale(${t.zoom}) translate(${t.panX * 100}%, ${t.panY * 100}%)` }} />
                ) : (
                  <Img src={src} alt={alt} sizes={sizes} priority={priority} width={900} style={{ transform: `scale(${t.zoom}) translate(${t.panX * 100}%, ${t.panY * 100}%)` }} />
                )
              ) : (
                <div className="frame-placeholder" />
              ))}
          </div>
        </div>
        {glare && <span className="frame-glare" aria-hidden="true" />}
      </div>
    </div>
  );
}
