import { useRef, useState } from 'react';
import { ICON_PATHS } from './Icon';

// Gift Finder answers arranged as a ring of segments around the monogram.
// Each segment is a real button (focusable, Enter/Space, arrow keys move
// around the ring). Picking one highlights it briefly, then advances.
const R = 192;
const r = 92;
const GAP = 1.1;
const rad = (d) => (d * Math.PI) / 180;
const pt = (radius, deg) => [radius * Math.cos(rad(deg)), radius * Math.sin(rad(deg))];

function sector(a0, a1, ri, ro) {
  const [x0, y0] = pt(ro, a0);
  const [x1, y1] = pt(ro, a1);
  const [x2, y2] = pt(ri, a1);
  const [x3, y3] = pt(ri, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${x0} ${y0}A${ro} ${ro} 0 ${large} 1 ${x1} ${y1}L${x2} ${y2}A${ri} ${ri} 0 ${large} 0 ${x3} ${y3}Z`;
}
function arc(a0, a1, radius) {
  const [x0, y0] = pt(radius, a0);
  const [x1, y1] = pt(radius, a1);
  return `M${x0} ${y0}A${radius} ${radius} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}
// Two balanced lines for longer labels.
function lines(label) {
  if (label.length <= 12 || !label.includes(' ')) return [label];
  const words = label.split(' ');
  let best = [label];
  let diff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    if (Math.abs(a.length - b.length) < diff) (diff = Math.abs(a.length - b.length)), (best = [a, b]);
  }
  return best;
}

export default function GiftWheel({ label, options, value, onChoose, step, total }) {
  const [hover, setHover] = useState(null);
  const [picked, setPicked] = useState(null);
  const btns = useRef([]);
  const n = options.length;
  const seg = 360 / n;
  const current = options.find((o) => o.id === (hover || picked || value));
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const showHints = n <= 6;

  const choose = (id) => {
    if (picked) return;
    setPicked(id);
    setTimeout(() => onChoose(id), reduce ? 0 : 320);
  };
  const onKey = (e, i) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(options[i].id);
      return;
    }
    const to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: n - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    btns.current[(to + n) % n]?.focus();
  };

  return (
    <div className="gw" role="group" aria-label={label}>
      <svg className="gw-svg" viewBox="-210 -210 420 420">
        {options.map((o, i) => {
          const mid = -90 + i * seg;
          const a0 = mid - seg / 2 + GAP;
          const a1 = mid + seg / 2 - GAP;
          const on = (picked || value) === o.id;
          const [lx, ly] = pt((R + r) / 2 + 4, mid);
          const ls = lines(o.label);
          const hint = showHints && o.hint;
          const blockH = 24 + ls.length * 15 + (hint ? 14 : 0);
          const top = ly - blockH / 2;
          return (
            <g
              key={o.id}
              ref={(el) => (btns.current[i] = el)}
              className={`gw-seg ${on ? 'on' : ''}`}
              style={{ '--i': i }}
              role="button"
              tabIndex={0}
              aria-pressed={on}
              aria-label={o.hint ? `${o.label}, ${o.hint}` : o.label}
              onClick={() => choose(o.id)}
              onKeyDown={(e) => onKey(e, i)}
              onPointerEnter={() => setHover(o.id)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(o.id)}
              onBlur={() => setHover(null)}
            >
              <path className="gw-wedge" d={sector(a0, a1, r, R)} />
              {on && <path className="gw-arc" d={arc(a0 + 4, a1 - 4, R + 10)} />}
              <g transform={`translate(${lx - 12} ${top})`} className="gw-ic">
                <path d={ICON_PATHS[o.icon] || ICON_PATHS.sparkle} />
              </g>
              <text className="gw-label" x={lx} y={top + 40} textAnchor="middle">
                {ls.map((t, k) => (
                  <tspan key={k} x={lx} dy={k ? 15 : 0}>
                    {t}
                  </tspan>
                ))}
              </text>
              {hint && (
                <text className="gw-hint" x={lx} y={top + 40 + ls.length * 15} textAnchor="middle">
                  {o.hint}
                </text>
              )}
            </g>
          );
        })}
        <g className="gw-hub" aria-hidden="true">
          <circle r={r - 10} className="gw-hub-ring" />
          <circle r={r - 20} className="gw-hub-in" />
          <image href="/logo-mark.webp" x="-22" y="-52" width="44" height="40" />
          <text className="gw-hub-title" y={current && lines(current.label).length > 1 ? 2 : 10} textAnchor="middle">
            {(current ? lines(current.label) : ['Gift Finder']).map((t, k) => (
              <tspan key={k} x="0" dy={k ? 17 : 0}>
                {t}
              </tspan>
            ))}
          </text>
          <text className="gw-hub-sub" y={current && lines(current.label).length > 1 ? 40 : 30} textAnchor="middle">
            {current?.hint || `${step} of ${total}`}
          </text>
        </g>
      </svg>
    </div>
  );
}
