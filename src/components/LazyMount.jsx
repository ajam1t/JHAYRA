import { useEffect, useRef, useState } from 'react';

/**
 * Renders its children only when the placeholder comes within `margin` of the
 * viewport. Keeps below-the-fold sections from costing anything on first load.
 */
export default function LazyMount({ children, minHeight = 600, margin = '600px', className = '' }) {
  const ref = useRef(null);
  const [show, setShow] = useState(typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: `${margin} 0px` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show, margin]);

  if (show) return children;
  return <div ref={ref} className={className} style={{ minHeight }} aria-hidden="true" />;
}
