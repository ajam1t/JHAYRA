import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function IntroAnimation() {
  const introRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const intro = introRef.current;
    if (!intro) return;

    const onHome = location.pathname === '/' || location.pathname === '/home';
    const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    let seen = false;
    try { seen = sessionStorage.getItem('jhIntroV2') === '1'; } catch(e) {}

    if (!onHome || reduce || seen) {
      intro.setAttribute('hidden', '');
      return;
    }

    intro.classList.add('jh-full');
    document.body.style.overflow = 'hidden';

    let autoTimer = setTimeout(dismiss, 5500);

    function dismiss() {
      if (intro.classList.contains('is-out')) return;
      clearTimeout(autoTimer);
      intro.classList.add('is-out');
      try { sessionStorage.setItem('jhIntroV2', '1'); } catch(e) {}
      document.body.style.overflow = '';
      setTimeout(() => intro.setAttribute('hidden', ''), 780);
    }

    const skipBtn = intro.querySelector('#jhSkip');
    if (skipBtn) skipBtn.addEventListener('click', dismiss);

    const onKey = (e) => { if (e.key === 'Escape' && !intro.hasAttribute('hidden')) dismiss(); };
    document.addEventListener('keydown', onKey);

    const stage = intro.querySelector('.jh-stage');
    if (stage && window.matchMedia('(pointer:fine)').matches) {
      const onMove = (e) => {
        const mx = (e.clientX / window.innerWidth - 0.5);
        const my = (e.clientY / window.innerHeight - 0.5);
        stage.style.transform = `translate(${(mx*16).toFixed(1)}px,${(my*10).toFixed(1)}px)`;
      };
      const onLeave = () => { stage.style.transform = ''; };
      intro.addEventListener('mousemove', onMove);
      intro.addEventListener('mouseleave', onLeave);
      return () => {
        document.removeEventListener('keydown', onKey);
        intro.removeEventListener('mousemove', onMove);
        intro.removeEventListener('mouseleave', onLeave);
        clearTimeout(autoTimer);
        document.body.style.overflow = '';
      };
    }

    return () => {
      document.removeEventListener('keydown', onKey);
      clearTimeout(autoTimer);
      document.body.style.overflow = '';
    };
  }, [location.pathname]);

  return (
    <div id="jhIntro" className="jh-intro" ref={introRef} role="dialog" aria-label="JHAYRA introduction">
      <button type="button" className="jh-intro-skip" id="jhSkip">Skip intro</button>
      <div className="jh-stage">
        <div className="jh-gallery">
          <div className="jh-gframe s g1"><img loading="eager" src="/Images/nature.jpg" alt="Nature wall art" /></div>
          <div className="jh-gframe m g2"><img loading="eager" src="/Images/religious.jpg" alt="Religious wall art" /></div>
          <div className="jh-gframe c g3"><img loading="eager" src="/Images/personalized.jpg" alt="Personalized photo frame" /></div>
          <div className="jh-gframe m g4"><img loading="eager" src="/Images/horses.jpg" alt="Running horses wall art" /></div>
          <div className="jh-gframe s g5"><img loading="eager" src="/Images/modern.jpg" alt="Modern wall art" /></div>
        </div>
        <div className="jh-phase1">
          <div className="jh-logo">JHAYRA</div>
          <div className="jh-sub">Crafting Memories Into Art</div>
          <p className="jh-msg">Your memories deserve a place on your wall.</p>
        </div>
      </div>
      <div className="jh-end">
        <div className="jh-end-logo">JHAYRA</div>
        <p className="jh-end-line">Made to keep your memories close.</p>
      </div>
    </div>
  );
}
