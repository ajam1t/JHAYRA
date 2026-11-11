import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon, { WhatsAppGlyph } from './Icon';
import GiftPiece from './GiftPiece';
import { chime } from '../lib/reveal';
import '../styles/reveal.css';

/* The Gift Reveal itself — used unchanged for the sender's preview and the
   recipient's page, so what the sender previews is what the recipient sees.

   data: { to, from, occasion, message, theme, sound, gifts:[…], photos:[{url}], clip:{kind,url}|null }
   gifts come from the real order (see GiftPiece). */

const LOGO = '/logo-mark-lg.webp';
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function Seal() {
  return (
    <span className="grv-seal">
      <img src={LOGO} alt="" />
    </span>
  );
}

// Three ways to open: a wax-sealed letter, a ribboned box, a keepsake case.
function Opener({ theme, open }) {
  if (theme === 'box')
    return (
      <div className={`grv-box ${open ? 'open' : ''}`} aria-hidden="true">
        <div className="grv-box-glow" />
        <div className="grv-box-lid">
          <span className="grv-ribbon-h" />
          <svg className="grv-bow" viewBox="-150 -110 300 170">
            <path d="M-4 0 C-40 -70 -140 -80 -130 -20 C-120 30 -50 20 -4 4 Z" />
            <path d="M4 0 C40 -70 140 -80 130 -20 C120 30 50 20 4 4 Z" />
            <path d="M-6 4 C-30 30 -44 46 -62 60 L-40 64 C-28 46 -14 30 4 10 Z" />
            <path d="M6 4 C30 30 44 46 62 60 L40 64 C28 46 14 30 -4 10 Z" />
            <ellipse cx="0" cy="2" rx="17" ry="14" />
          </svg>
        </div>
        <div className="grv-box-body">
          <span className="grv-ribbon-v" />
          <img className="grv-box-mark" src={LOGO} alt="" />
        </div>
      </div>
    );
  if (theme === 'night')
    return (
      <div className={`grv-case ${open ? 'open' : ''}`} aria-hidden="true">
        <div className="grv-case-glow" />
        <div className="grv-case-lid">
          <img src={LOGO} alt="" />
        </div>
        <div className="grv-case-base">
          <span className="grv-case-clasp" />
        </div>
      </div>
    );
  return (
    <div className={`grv-env ${open ? 'open' : ''}`} aria-hidden="true">
      <div className="grv-env-letter">
        <i />
        <i />
        <i />
      </div>
      <div className="grv-env-back" />
      <div className="grv-env-front" />
      <div className="grv-env-flap" />
      <Seal />
    </div>
  );
}

function Photos({ photos }) {
  const [i, setI] = useState(0);
  const touch = useRef(null);
  const n = photos.length;
  useEffect(() => {
    if (n < 2) return;
    const id = setInterval(() => setI((x) => (x + 1) % n), 4200);
    return () => clearInterval(id);
  }, [n, i]);
  if (!n) return null;
  const go = (d) => setI((x) => (x + d + n) % n);
  return (
    <div
      className="grv-photos"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touch.current ?? 0);
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="grv-photo-stack">
        {photos.map((p, k) => (
          <img key={k} src={p.url} alt={`Photo ${k + 1} of ${n}`} className={k === i ? 'on' : ''} draggable={false} />
        ))}
      </div>
      {n > 1 && (
        <div className="grv-dots" role="tablist" aria-label="Photos">
          {photos.map((_, k) => (
            <button key={k} type="button" role="tab" aria-selected={k === i} aria-label={`Photo ${k + 1}`} className={k === i ? 'on' : ''} onClick={() => setI(k)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Clip({ clip }) {
  if (!clip?.url) return null;
  return clip.kind === 'video' ? <video className="grv-video" src={clip.url} controls playsInline preload="metadata" /> : <audio className="grv-audio" src={clip.url} controls preload="metadata" />;
}

function Gifts({ gifts }) {
  const [i, setI] = useState(0);
  const n = gifts.length;
  if (!n) return null;
  if (n === 1) return <GiftPiece gift={gifts[0]} />;
  return (
    <div className="grv-gifts">
      <div className="grv-gift-track" style={{ transform: `translateX(${-i * 100}%)` }}>
        {gifts.map((g, k) => (
          <div className="grv-gift-slide" key={k} aria-hidden={k !== i}>
            <GiftPiece gift={g} />
          </div>
        ))}
      </div>
      <div className="grv-gift-nav">
        <button type="button" onClick={() => setI((i - 1 + n) % n)} aria-label="Previous gift">
          <Icon name="chevronL" size={18} />
        </button>
        <span>
          Gift {i + 1} of {n}
        </span>
        <button type="button" onClick={() => setI((i + 1) % n)} aria-label="Next gift">
          <Icon name="chevron" size={18} />
        </button>
      </div>
    </div>
  );
}

export default function RevealExperience({ data, preview = false, onClose }) {
  const [stage, setStage] = useState(0); // 0 entrance · 1 opening · 2 memory · 3 gift · 4 closing
  const [muted, setMuted] = useState(!data.sound);
  const gifts = data.gifts || [];
  useEffect(() => setMuted(!data.sound), [data.sound]);
  const theme = ['envelope', 'box', 'night'].includes(data.theme) ? data.theme : 'envelope';
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const openIt = () => {
    if (stage !== 0) return;
    setStage(1);
    if (!muted) chime('open');
    timer.current = setTimeout(() => setStage(2), reduced() ? 400 : 2600);
  };
  const next = () =>
    setStage((s) => {
      if (s === 2 && !muted) chime('gift');
      return Math.min(4, s + 1);
    });
  const replay = () => {
    clearTimeout(timer.current);
    setStage(0);
  };
  const thanks = `Thank you${data.from ? `, ${data.from}` : ''}! I just opened your JHAYRA gift reveal — it’s beautiful. ❤️`;
  const share = async () => {
    try {
      if (navigator.share) return await navigator.share({ text: thanks });
    } catch {
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(thanks)}`, '_blank', 'noopener');
  };

  return (
    <div className={`grv grv-t-${theme} grv-s${stage}`}>
      <div className="grv-bg" aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => (
          <i key={i} style={{ '--x': `${(i * 37) % 100}%`, '--y': `${(i * 53) % 100}%`, '--d': `${(i % 5) * 0.9}s`, '--s': `${3 + (i % 4)}px` }} />
        ))}
      </div>
      {preview && (
        <div className="grv-preview-bar">
          <span>Preview — this is what {data.to || 'they'} will see</span>
          <button type="button" onClick={onClose} aria-label="Close preview">
            <Icon name="close" size={18} />
          </button>
        </div>
      )}
      {data.sound && (
        <button type="button" className={`grv-sound ${preview ? 'below' : ''}`} onClick={() => setMuted((m) => !m)} aria-pressed={!muted} aria-label={muted ? 'Turn sound on' : 'Turn sound off'}>
          <Icon name={muted ? 'volumeOff' : 'volume'} size={18} />
        </button>
      )}

      {/* 1–3 · entrance, personalisation and the reveal */}
      {stage <= 1 && (
        <section className="grv-stage grv-entrance" aria-live="polite">
          <img className="grv-logo" src={LOGO} alt="JHAYRA" />
          <p className="grv-eyebrow">A gift reveal{data.occasion ? ` · ${data.occasion}` : ''}</p>
          <h1 className="grv-to">
            {data.to ? (
              <>
                For <em>{data.to}</em>
              </>
            ) : (
              'For you'
            )}
          </h1>
          <p className="grv-line">Someone has a beautiful memory waiting for you.</p>
          <button type="button" className="grv-opener" onClick={openIt} disabled={stage === 1} aria-label="Open your gift reveal">
            <Opener theme={theme} open={stage === 1} />
          </button>
          <p className={`grv-tap ${stage === 1 ? 'gone' : ''}`}>Tap to open</p>
        </section>
      )}

      {/* 4 · the memory */}
      {stage === 2 && (
        <section className="grv-stage grv-memory">
          {data.occasion && <p className="grv-eyebrow">{data.occasion}</p>}
          <Photos photos={data.photos || []} />
          <div className="grv-letter">
            {data.to && <p className="grv-dear">Dear {data.to},</p>}
            {data.message && <p className="grv-msg">{data.message}</p>}
            {data.from && <p className="grv-from">— {data.from}</p>}
          </div>
          <Clip clip={data.clip} />
          <button type="button" className="grv-next" onClick={next}>
            {gifts.length ? (gifts.length > 1 ? 'See your gifts' : 'See your gift') : 'Continue'} <Icon name="arrow" size={16} />
          </button>
        </section>
      )}

      {/* 5 · the gift, as it was actually ordered */}
      {stage === 3 && (
        <section className="grv-stage grv-gift">
          <p className="grv-eyebrow">{gifts.length > 1 ? 'Your gifts' : 'Your gift'}</p>
          <Gifts gifts={gifts} />
          <h2 className="grv-onway">
            {gifts.length > 1 ? 'Your JHAYRA gifts are' : 'Your JHAYRA gift is'} <em>on the way.</em>
          </h2>
          <p className="grv-line">Handcrafted and framed for you{data.from ? `, with love from ${data.from}` : ''}.</p>
          <button type="button" className="grv-next" onClick={next}>
            Continue <Icon name="arrow" size={16} />
          </button>
        </section>
      )}

      {/* 6 · closing */}
      {stage === 4 && (
        <section className="grv-stage grv-thanks">
          <h2 className="grv-closing">
            Some gifts are opened.
            <br />
            <em>Some memories last forever.</em>
          </h2>
          {data.from && <p className="grv-love">With love, {data.from}</p>}
          <span className="grv-rule" />
          <img className="grv-logo big" src={LOGO} alt="JHAYRA" />
          <p className="grv-tagline">Crafted with love by JHAYRA.</p>
          <div className="grv-actions">
            <button type="button" className="grv-btn gold" onClick={share} disabled={preview} title={preview ? 'Available to the recipient' : undefined}>
              <WhatsAppGlyph size={18} /> Say thank you
            </button>
            <button type="button" className="grv-btn" onClick={replay}>
              <Icon name="rotate" size={16} /> Watch again
            </button>
          </div>
          {!preview && (
            <Link className="grv-own" to="/gift-reveal">
              Create a gift reveal for someone you love <Icon name="arrow" size={14} />
            </Link>
          )}
        </section>
      )}
    </div>
  );
}
