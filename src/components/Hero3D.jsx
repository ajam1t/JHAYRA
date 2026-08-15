import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SHOWCASE } from '../data/showcase';

const ANGLE = 38, RAD = 355, DEPTH = 300, SPEED = 0.0046, EASE = 0.068;

let showcaseOff = 0, targetOff = 0, rafId = null;
let autoPaused = false;
let activeSet = [0,1,2,3,4,5,6,7];

function lerp(a, b, t) { return a + (b - a) * t; }

function slotTransform(rel) {
  const a = rel * ANGLE, r = a * Math.PI / 180;
  const cos = Math.cos(r), sin = Math.sin(r);
  const x = sin * RAD, z = (cos - 1) * DEPTH, rotY = -a * 0.42;
  const scale = 0.35 + 0.75 * Math.pow(Math.max(0, cos), 1.5);
  const opacity = Math.abs(rel) > 3.4 ? 0 : Math.max(0, 0.28 + 0.72 * Math.pow(Math.max(0, cos), .8));
  const zIdx = Math.round(90 * Math.max(0, cos));
  const blur = Math.max(0, Math.abs(rel) * 0.85 - 0.15);
  const y = Math.abs(rel) * -7;
  return { x, y, z, rotY, scale, opacity, zIdx, blur };
}

export default function Hero3D() {
  const stageRef = useRef(null);
  const trackRef = useRef(null);
  const dotsRef = useRef(null);
  const navigate = useNavigate();

  function updateSlots() {
    const slots = document.querySelectorAll('.frame-slot');
    if (!slots.length) return;
    const N = activeSet.length;
    slots.forEach((sl, i) => {
      let rel = i - showcaseOff;
      while (rel > N / 2) rel -= N;
      while (rel < -N / 2) rel += N;
      const t = slotTransform(rel);
      const isCenter = Math.abs(rel) < 0.55;
      sl.style.cssText = `position:absolute;left:50%;top:50%;will-change:transform,opacity;cursor:pointer;outline:none;
        transform:translate3d(calc(-50% + ${t.x.toFixed(1)}px),calc(-50% + ${t.y.toFixed(1)}px),${t.z.toFixed(1)}px) rotateY(${t.rotY.toFixed(2)}deg) scale(${t.scale.toFixed(3)});
        opacity:${t.opacity.toFixed(3)};z-index:${t.zIdx};filter:${t.blur > .12 ? `blur(${t.blur.toFixed(2)}px)` : ''};pointer-events:${t.opacity < .05 ? 'none' : 'auto'}`;
      sl.classList.toggle('center-frame', isCenter);
      const outer = sl.querySelector('.frame-outer');
      if (outer) outer.style.boxShadow = isCenter
        ? '0 28px 80px rgba(0,0,0,.32),0 10px 28px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.14)'
        : '0 6px 22px rgba(0,0,0,.18),0 2px 8px rgba(0,0,0,.12)';
      const shadow = sl.querySelector('.frame-shadow');
      if (shadow) shadow.style.opacity = String(Math.max(0, 0.7 - Math.abs(rel) * .22));
    });
    const dots = document.querySelectorAll('.stage-dot');
    const ci = ((Math.round(showcaseOff) % N) + N) % N;
    dots.forEach((d, i) => d.classList.toggle('active', i === ci));
  }

  function animLoop() {
    if (!autoPaused) targetOff += SPEED;
    showcaseOff = lerp(showcaseOff, targetOff, EASE);
    updateSlots();
    rafId = requestAnimationFrame(animLoop);
  }

  function navigateCarousel(dir) {
    targetOff += dir;
    autoPaused = true;
    clearTimeout(window._jRe);
    window._jRe = setTimeout(() => { autoPaused = false; }, 3200);
  }

  function buildCarousel(indices) {
    const track = trackRef.current;
    const dotsEl = dotsRef.current;
    if (!track || !dotsEl) return;
    track.innerHTML = '';
    dotsEl.innerHTML = '';
    activeSet = indices;
    indices.forEach((pi, i) => {
      const p = SHOWCASE[pi];
      if (!p) return;
      const sl = document.createElement('div');
      sl.className = 'frame-slot';
      sl.setAttribute('tabindex', '0');
      sl.setAttribute('role', 'button');
      sl.setAttribute('aria-label', `${p.name} — ₹${p.price.toLocaleString('en-IN')}`);
      sl.dataset.pid = p.id;
      sl.innerHTML = `<div class="frame-body"><div class="frame-outer" style="background:${p.fc};background-image:linear-gradient(160deg,${p.fc}f0 0%,${p.fc}cc 100%)"><div class="frame-inner"><div class="frame-img-wrap">${p.art}</div><div class="frame-glass"></div></div></div><div class="frame-shadow"></div><div class="frame-label"><div class="frame-label-name">${p.name}</div><div class="frame-label-price">₹${p.price.toLocaleString('en-IN')}</div></div></div>`;
      sl.addEventListener('click', () => {
        const N = activeSet.length;
        let rel = i - targetOff;
        while (rel > N / 2) rel -= N;
        while (rel < -N / 2) rel += N;
        if (Math.abs(rel) < 0.65) { navigate(`/product/${p.id}`); }
        else { navigateCarousel(rel); }
      });
      sl.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') sl.click();
        if (e.key === 'ArrowLeft') navigateCarousel(-1);
        if (e.key === 'ArrowRight') navigateCarousel(1);
      });
      track.appendChild(sl);
      const dot = document.createElement('button');
      dot.className = 'stage-dot';
      dot.setAttribute('aria-label', 'Go to ' + p.name);
      dot.addEventListener('click', () => navigateCarousel(i - Math.round(targetOff)));
      dotsEl.appendChild(dot);
    });
    showcaseOff = 0; targetOff = 0; updateSlots();
  }

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    buildCarousel([0, 1, 2, 3, 4, 5, 6, 7]);

    const track = trackRef.current;
    stage.addEventListener('mouseenter', () => { autoPaused = true; });
    stage.addEventListener('mouseleave', () => { autoPaused = false; if (track) track.style.transform = ''; });
    stage.addEventListener('mousemove', e => {
      const r = stage.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width - .5) * 2;
      const my = ((e.clientY - r.top) / r.height - .5) * 2;
      if (track) track.style.transform = `rotateX(${(-my * 3.5).toFixed(2)}deg) rotateY(${(mx * 4.5).toFixed(2)}deg)`;
    });

    let tx0 = 0;
    stage.addEventListener('touchstart', e => { tx0 = e.touches[0].clientX; autoPaused = true; }, { passive: true });
    stage.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - tx0;
      if (Math.abs(dx) > 38) navigateCarousel(dx < 0 ? 1 : -1);
      setTimeout(() => { autoPaused = false; }, 2200);
    }, { passive: true });

    if (!window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
      showcaseOff = 0; targetOff = 0;
      animLoop();
    } else {
      updateSlots();
    }

    return () => {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    };
  }, []);

  return (
    <div className="hero-visual" id="heroVisual">
      <div className="jhayra-stage" id="jhayraStage" ref={stageRef}>
        <div className="stage-track" id="stageTrack" ref={trackRef}></div>
      </div>
      <div className="stage-nav">
        <button className="stage-btn" id="stagePrev" aria-label="Previous" onClick={() => navigateCarousel(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <div className="stage-dots" id="stageDots" ref={dotsRef}></div>
        <button className="stage-btn" id="stageNext" aria-label="Next" onClick={() => navigateCarousel(1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6"/></svg>
        </button>
      </div>
    </div>
  );
}
