import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

// Phones: once the main preview scrolls out of view, a small live copy of it
// floats in the corner so every change can still be seen. Tap to enlarge;
// the arrow scrolls back to the full preview.
export default function PreviewDock({ target, children, label = 'Live preview' }) {
  const [show, setShow] = useState(false);
  const [big, setBig] = useState(false);
  const el = target.current;
  useEffect(() => {
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const mq = window.matchMedia('(max-width: 979px)');
    const io = new IntersectionObserver(([e]) => setShow(mq.matches && e.intersectionRatio < 0.25), { threshold: [0, 0.25, 0.5] });
    io.observe(el);
    return () => io.disconnect();
  }, [el]);
  useEffect(() => {
    if (!show) setBig(false);
  }, [show]);
  if (!show) return null;
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
