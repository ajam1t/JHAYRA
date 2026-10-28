import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Icon, { WhatsAppGlyph } from './Icon';
import Reveal from './Reveal';
import { BRAND } from '../lib/brand';
import { waLink } from '../lib/site';

const NAME = 'Sandeep Jha';

// 3D tilt that follows the pointer (fine pointers only, never with reduced motion).
function useTilt() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`);
        el.style.setProperty('--ry', `${(x * 9).toFixed(2)}deg`);
        el.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`);
      });
    };
    const leave = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      cancelAnimationFrame(raf);
    };
  }, []);
  return ref;
}

// "Since 2017" on split-flap tiles.
function Flap({ value }) {
  return (
    <span className="fd-flap">
      <span className="sr-only">{value}</span>
      {[...value].map((d, i) => (
        <span key={i} className="fd-flap-d" style={{ '--i': i }} aria-hidden="true">
          {d}
        </span>
      ))}
    </span>
  );
}

export default function Founder({ variant = 'home' }) {
  const tilt = useTilt();
  const Heading = variant === 'about' ? 'h2' : 'h3';
  return (
    <section className={`fd fd-${variant} mesh-dark`} aria-labelledby="founder-name">
      <span className="dust" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <i key={i} style={{ '--i': i }} />
        ))}
      </span>
      <div className="wrap fd-grid">
        <Reveal className="fd-photo-wrap">
          <span className="fd-morph" aria-hidden="true" />
          <div className="fd-photo" ref={tilt}>
            <span className="fd-corners" aria-hidden="true" />
            <img src="/founder/sandeep-jha.webp" alt={`${NAME}, founder of JHAYRA`} width="900" height="1125" loading="lazy" decoding="async" />
            <span className="fd-holo" aria-hidden="true" />
            <div className="fd-tag glass-dark">
              <b>{NAME}</b>
              <small>Founder, JHAYRA</small>
            </div>
          </div>
        </Reveal>
        <div className="fd-copy">
          <Reveal>
            <span className="eyebrow">Meet the founder</span>
          </Reveal>
          <Reveal className="fd-head">
          <Heading className="fd-name" id="founder-name" aria-label={NAME}>
            {[...NAME].map((ch, i) => (
              <span key={i} className="fd-ch" style={{ '--i': i }} aria-hidden="true">
                {ch === ' ' ? ' ' : ch}
              </span>
            ))}
          </Heading>
          <svg className="fd-sign" viewBox="0 0 320 24" aria-hidden="true">
            <path d="M4 16 C 60 4, 110 22, 160 12 S 260 2, 316 14" />
          </svg>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="fd-since">
              Founded JHAYRA in <Flap value={String(BRAND.since)} />
            </p>
            <p className="lead">
              {NAME} started JHAYRA with one idea: the moments people love most deserve a place on their walls, not just on their phones. Since {BRAND.since}, that idea has framed memories for {BRAND.homes} homes across India.
            </p>
            <p className="fd-wink">And sometimes, in selected locations, your order arrives with a personal hello from him. 😉</p>
            <div className="row fd-ctas">
              {variant === 'home' ? (
                <Link to="/about" className="btn btn-light sheen">
                  Read our story <Icon name="arrow" size={16} />
                </Link>
              ) : (
                <a className="btn btn-light sheen" href={waLink('Hi Sandeep! I have a question about JHAYRA.')} target="_blank" rel="noopener noreferrer">
                  <WhatsAppGlyph size={18} /> Say hello on WhatsApp
                </a>
              )}
              <Link to="/#signature" className="btn btn-ghost-light">
                The Signature Experience
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
