import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReveal } from './Reveal';

// ════════════════════════════════════════════════════════════════════════
// JHAYRA motion library — small, CSS-first building blocks used on the
// homepage, Shop, product pages and campaigns. Styles live in
// src/styles/motion.css. Every effect is off for prefers-reduced-motion,
// runs on transform/opacity only, and nothing animates continuously over
// large areas.
//
//  Reveal-on-scroll   <Motion type="fade|up|left|scale|blur|draw" />  (Fade In,
//                     Slide Up, Slide Left, Scale Reveal, Blur Reveal, Frame Draw)
//  Stagger Reveal     <Motion stagger> children get --i delays
//  3D Tilt            <Tilt>                       (pointer: fine only)
//  Floating Frame     className="m-float"
//  Image Zoom         className="m-zoom" on a wrapper of an <img>/<Frame>
//  Parallax           useParallax(ref, speed)
//  Magnetic Button    <Magnetic>                   (pointer: fine only)
//  Ripple Click       useRipple() → onPointerDown
//  Morphing Menu      className="m-morph" on a sheet (opens from its button)
//  Smooth Tab Switch  <SmoothTabs>
//  Heart Pop          className="m-pop" toggled on press
//  Shimmer            className="m-shimmer" (loading) / "m-sheen" (hover)
//  Golden Glow        className="m-glow"
//  Smooth Morph       morph(() => setState(...)) — View Transitions when available
//  Scroll Storytelling <Story steps={[...]} />
// ════════════════════════════════════════════════════════════════════════

export const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => typeof matchMedia !== 'undefined' && matchMedia('(hover: hover) and (pointer: fine)').matches;

export function Motion({ as: Tag = 'div', type = 'up', stagger = false, delay = 0, className = '', style, children, ...rest }) {
  const ref = useReveal();
  return (
    <Tag ref={ref} className={`m-in m-${type} ${stagger ? 'm-stagger' : ''} ${className}`} style={{ '--d': `${delay}s`, ...(style || {}) }} {...rest}>
      {children}
    </Tag>
  );
}

export function Tilt({ as: Tag = 'div', max = 8, className = '', children, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced() || !finePointer()) return;
    let raf = 0;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--tx', `${(-y * max).toFixed(2)}deg`);
        el.style.setProperty('--ty', `${(x * max).toFixed(2)}deg`);
      });
    };
    const leave = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty('--tx', '0deg');
      el.style.setProperty('--ty', '0deg');
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      cancelAnimationFrame(raf);
    };
  }, [max]);
  return (
    <Tag ref={ref} className={`m-tilt ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export function Magnetic({ as: Tag = 'span', strength = 0.25, className = '', children, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced() || !finePointer()) return;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * strength}px, ${(e.clientY - r.top - r.height / 2) * strength}px)`;
    };
    const leave = () => (el.style.transform = '');
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, [strength]);
  return (
    <Tag ref={ref} className={`m-magnetic ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

// Ripple Click: spread onto any button — <button {...ripple} className="m-ripple">.
export function ripple(e) {
  if (reduced()) return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const s = document.createElement('span');
  s.className = 'm-ripple-ink';
  const d = Math.max(r.width, r.height) * 2;
  s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  el.appendChild(s);
  setTimeout(() => s.remove(), 650);
}

export function useParallax(ref, speed = 0.08) {
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;
    let raf = 0;
    let on = false;
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting));
    io.observe(el);
    const tick = () => {
      if (!on) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const mid = r.top + r.height / 2 - innerHeight / 2;
        el.style.setProperty('--py', `${(-mid * speed).toFixed(1)}px`);
      });
    };
    addEventListener('scroll', tick, { passive: true });
    tick();
    return () => {
      io.disconnect();
      removeEventListener('scroll', tick);
      cancelAnimationFrame(raf);
    };
  }, [ref, speed]);
}

// Smooth Morph: wraps a state change in a View Transition where supported.
export function morph(update) {
  if (typeof document !== 'undefined' && document.startViewTransition && !reduced()) document.startViewTransition(update);
  else update();
}

// Smooth Tab Switch: a gold indicator glides to the active tab.
export function SmoothTabs({ tabs, value, onChange, label, className = '' }) {
  const box = useRef(null);
  const [ink, setInk] = useState(null);
  useLayoutEffect(() => {
    const el = box.current?.querySelector('[aria-selected="true"]');
    if (el) setInk({ left: el.offsetLeft, width: el.offsetWidth });
  }, [value, tabs.length]);
  return (
    <div className={`m-tabs ${className}`} role="tablist" aria-label={label} ref={box}>
      {tabs.map(([v, l]) => (
        <button key={v} type="button" role="tab" aria-selected={value === v} onClick={(e) => (ripple(e), onChange(v))} className="m-ripple">
          {l}
        </button>
      ))}
      {ink && <span className="m-tabs-ink" style={{ transform: `translateX(${ink.left}px)`, width: ink.width }} aria-hidden="true" />}
    </div>
  );
}

// Scroll Storytelling: steps light up one by one as they scroll through view.
export function Story({ steps, className = '' }) {
  const box = useRef(null);
  const [n, setN] = useState(reduced() ? steps.length : 0);
  useEffect(() => {
    const el = box.current;
    if (!el || reduced() || typeof IntersectionObserver === 'undefined') return setN(steps.length);
    const items = [...el.querySelectorAll('.m-story-step')];
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setN((x) => Math.max(x, items.indexOf(e.target) + 1))),
      { rootMargin: '0px 0px -30% 0px', threshold: 0.6 },
    );
    items.forEach((i) => io.observe(i));
    return () => io.disconnect();
  }, [steps.length]);
  return (
    <ol className={`m-story ${className}`} ref={box} style={{ '--p': n / steps.length }}>
      {steps.map(([title, text], i) => (
        <li key={title} className={`m-story-step ${i < n ? 'on' : ''}`}>
          <span className="m-story-n">{i + 1}</span>
          <span>
            <b>{title}</b>
            <small>{text}</small>
          </span>
        </li>
      ))}
    </ol>
  );
}
