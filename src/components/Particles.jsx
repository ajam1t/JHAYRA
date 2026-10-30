import { useEffect, useRef } from 'react';

// Lightweight canvas particles for festival worlds. Pauses off-screen and
// respects reduced-motion. Kinds: diya (rising embers), sparkle, snow, petals,
// colour, confetti. `seconds` > 0 stops new particles after that long.
const PALETTES = {
  diya: ['#ffcf7a', '#ffb347', '#ff9a3c', '#ffe3a8'],
  sparkle: ['#ffe9a8', '#ffd36e', '#fff6dc', '#ffb84a'],
  snow: ['#ffffff', '#eef6ff'],
  petals: ['#f6a5b8', '#f28aa2', '#ffd1dc', '#e86c8a'],
  colour: ['#ff4fa3', '#ffcc33', '#33ccff', '#7cff6b', '#b066ff', '#ff7a33'],
  confetti: ['#e2c06f', '#f6e3a8', '#c9a55c', '#fff4d6', '#b08a45'],
};

export default function Particles({ kind = 'diya', density = 1, colours: custom, seconds = 0 }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    const colours = custom?.length ? custom : PALETTES[kind] || PALETTES.sparkle;
    const started = performance.now();
    let stopped = false;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const parts = [];

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const count = () => Math.round(Math.min(90, (w * h) / 16000) * density);

    const spawn = (initial) => {
      const c = colours[(Math.random() * colours.length) | 0];
      const base = { c, life: 0, seed: Math.random() * 1000 };
      if (kind === 'diya')
        return { ...base, x: Math.random() * w, y: initial ? Math.random() * h : h + 10, r: 1 + Math.random() * 2.6, vx: (Math.random() - 0.5) * 0.25, vy: -(0.25 + Math.random() * 0.7), a: 0.4 + Math.random() * 0.6 };
      if (kind === 'snow')
        return { ...base, x: Math.random() * w, y: initial ? Math.random() * h : -10, r: 0.8 + Math.random() * 2.4, vx: (Math.random() - 0.5) * 0.3, vy: 0.3 + Math.random() * 0.8, a: 0.5 + Math.random() * 0.5 };
      if (kind === 'petals')
        return { ...base, x: Math.random() * w, y: initial ? Math.random() * h : -14, r: 4 + Math.random() * 5, vx: 0.2 + Math.random() * 0.5, vy: 0.4 + Math.random() * 0.8, a: 0.55 + Math.random() * 0.4, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.04 };
      if (kind === 'confetti')
        return { ...base, x: Math.random() * w, y: initial ? Math.random() * h : -10, r: 2 + Math.random() * 2.5, vx: (Math.random() - 0.5) * 0.4, vy: 0.35 + Math.random() * 0.6, a: 0.55 + Math.random() * 0.4, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.08 };
      if (kind === 'colour')
        return { ...base, x: Math.random() * w, y: Math.random() * h, r: 20 + Math.random() * 60, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, a: 0.08 + Math.random() * 0.12 };
      return { ...base, x: Math.random() * w, y: Math.random() * h, r: 0.6 + Math.random() * 1.8, vx: 0, vy: -0.05, a: Math.random(), tw: 0.01 + Math.random() * 0.03 };
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      if (seconds > 0 && !stopped && performance.now() - started > seconds * 1000) stopped = true;
      if (!stopped) while (parts.length < count()) parts.push(spawn(parts.length < count() * 0.9));
      else if (!parts.length) return cancelAnimationFrame(raf);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life++;
        p.x += p.vx + (kind === 'diya' || kind === 'snow' ? Math.sin((p.life + p.seed) * 0.02) * 0.25 : 0);
        p.y += p.vy;
        ctx.globalAlpha = p.a;
        if (kind === 'diya') {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
          g.addColorStop(0, p.c);
          g.addColorStop(1, 'rgba(255,170,60,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 5, 0, 6.283);
          ctx.fill();
          p.a *= 0.9985;
        } else if (kind === 'petals') {
          p.rot += p.vr;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.c;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, 6.283);
          ctx.fill();
          ctx.restore();
        } else if (kind === 'confetti') {
          p.rot += p.vr;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.c;
          ctx.fillRect(-p.r, -p.r * 0.35, p.r * 2, p.r * 0.7);
          ctx.restore();
        } else if (kind === 'colour') {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          g.addColorStop(0, p.c);
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 6.283);
          ctx.fill();
        } else if (kind === 'sparkle') {
          p.a = 0.5 + 0.5 * Math.sin((p.life + p.seed) * p.tw * 3);
          ctx.fillStyle = p.c;
          ctx.beginPath();
          const s = p.r * 2.6;
          ctx.moveTo(p.x, p.y - s);
          ctx.lineTo(p.x + p.r * 0.5, p.y);
          ctx.lineTo(p.x, p.y + s);
          ctx.lineTo(p.x - p.r * 0.5, p.y);
          ctx.closePath();
          ctx.moveTo(p.x - s, p.y);
          ctx.lineTo(p.x, p.y + p.r * 0.5);
          ctx.lineTo(p.x + s, p.y);
          ctx.lineTo(p.x, p.y - p.r * 0.5);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = p.c;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 6.283);
          ctx.fill();
        }
        const out = p.y < -30 || p.y > h + 30 || p.x < -80 || p.x > w + 80 || p.a < 0.03;
        if (out && kind !== 'sparkle' && kind !== 'colour') parts.splice(i, 1);
        else if (stopped && (kind === 'sparkle' || kind === 'colour') && Math.random() < 0.02) parts.splice(i, 1);
        if (kind === 'colour') {
          if (p.x < -p.r) p.x = w + p.r;
          if (p.x > w + p.r) p.x = -p.r;
          if (p.y < -p.r) p.y = h + p.r;
          if (p.y > h + p.r) p.y = -p.r;
        }
      }
      ctx.globalAlpha = 1;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    tick();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [kind, density, seconds, custom?.join()]); // eslint-disable-line react-hooks/exhaustive-deps

  return <canvas ref={ref} className="particles" aria-hidden="true" />;
}
