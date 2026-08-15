import { useEffect } from 'react';

// deps: pass [someValue] from async pages so the observer re-runs after data loads.
// Default [] keeps backward-compatible one-shot behaviour for static pages.
export function useScrollReveal(deps = []) {
  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('vis');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.s-reveal,.s-reveal-scale,.reveal').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}
