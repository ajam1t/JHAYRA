import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

// Phones: once the main preview scrolls out of view, a small live copy of it
// floats in the corner so every change can still be seen. Tap to enlarge;
// the arrow scrolls back to the full preview.
// `until` (a CSS selector) names the last control the preview is useful for:
// once that has scrolled off the top, the dock steps aside instead of covering
// the rest of the page.
export default function PreviewDock({ target, children, label = 'Live preview', until }) {
  const [show, setShow] = useState(false);
  const [big, setBig] = useState(false);
  const [past, setPast] = useState(false);
  const el = target.current;
  useEffect(() => {
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const mq = window.matchMedia('(max-width: 979px)');
    const io = new IntersectionObserver(([e]) => setShow(mq.matches && e.intersectionRatio < 0.25), { threshold: [0, 0.25, 0.5] });
    io.observe(el);
    return () => io.disconnect();
  }, [el]);
  useEffect(() => {
    if (!until) return;
    let raf = 0;
    const check = () => {
      raf = 0;
      const u = document.querySelector(until);
      setPast(!!u && u.getBoundingClientRect().bottom < 90);
    };
    const on = () => !raf && (raf = requestAnimationFrame(check));
    window.addEventListener('scroll', on, { passive: true });
    check();
    return () => {
      window.removeEventListener('scroll', on);
      cancelAnimationFrame(raf);
    };
  }, [until]);
  useEffect(() => {
    if (!show || past) setBig(false);
  }, [show, past]);
  if (!show || past) return null;
  return createPortal(
    <div className={`pdock${big ? ' big' : ''}`} role="region" aria-label={label}>
      <button type="button" className="pdock-art" onClick={() => setBig((b) => !b)} aria-label={big ? 'Shrink preview' : 'Enlarge preview'}>
        <span className="pdock-live">
          <i /> Live
        </span>
        {/* A visual copy only: inert keeps its controls out of tab order. */}
        <span className="pdock-inner" aria-hidden="true" ref={(n) => n?.setAttribute('inert', '')}>
          {children}
        </span>
      </button>
      <button type="button" className="pdock-up" onClick={() => target.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} aria-label="Back to full preview">
        <Icon name="arrowUp" size={14} />
      </button>
    </div>,
    document.body,
  );
}
