import { useEffect } from 'react';

export function useScrollReveal() {
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
  }, []);
}
