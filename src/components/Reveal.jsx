import { useEffect, useLayoutEffect, useRef } from 'react';

let io;
function observer() {
  if (io || typeof IntersectionObserver === 'undefined') return io;
  io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }),
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  );
  return io;
}

export function useReveal() {
  const ref = useRef(null);
  // Already on screen when it mounts (the first view of a page): show it at
  // once with a slide-only entrance, so headlines are never invisible while
  // the page loads. Further down, the usual fade-in on scroll applies.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in', 'm-now');
  }, []);
  useEffect(() => {
    const el = ref.current;
    const o = observer();
    if (!el) return;
    if (!o || el.classList.contains('m-now')) {
      el.classList.add('in');
      return;
    }
    o.observe(el);
    return () => o.unobserve(el);
  }, []);
  return ref;
}

export default function Reveal({ as: Tag = 'div', delay = 0, className = '', style, children, ...rest }) {
  const ref = useReveal();
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ '--d': `${delay}s`, ...(style || {}) }} {...rest}>
      {children}
    </Tag>
  );
}
