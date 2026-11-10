import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon, { WhatsAppGlyph } from './Icon';
import '../styles/reveal.css';

/* The Gift Reveal itself — used unchanged for the sender's preview and the
   recipient's page, so what the sender previews is what the recipient sees.

   data: { to, from, occasion, message, theme, product:{name,image}, photos:[{url}], clip:{kind,url}|null }
   loadClip: optional () => Promise<{kind,url}|null> (recipient page: fetched when the memory is shown) */

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

function Clip({ clip, loadClip }) {
  const [c, setC] = useState(clip || null);
  const [state, setState] = useState(clip ? 'ready' : loadClip ? 'idle' : 'none');
  useEffect(() => {
    setC(clip || null);
    setState(clip ? 'ready' : loadClip ? 'idle' : 'none');
  }, [clip, loadClip]);
  if (state === 'none') return null;
  const fetchIt = async () => {
    setState('loading');
    const r = await loadClip().catch(() => null);
    if (r) {
      setC(r);
      setState('ready');
    } else setState('failed');
  };
  if (state !== 'ready')
    return (
      <button type="button" className="grv-clip-load" onClick={fetchIt} disabled={state === 'loading'}>
        <Icon name="sparkle" size={16} /> {state === 'loading' ? 'Opening…' : state === 'failed' ? 'Couldn’t load — tap to try again' : 'There’s a message to play — tap to open'}
      </button>
    );
  return c.kind === 'video' ? <video className="grv-video" src={c.url} controls playsInline preload="metadata" /> : <audio className="grv-audio" src={c.url} controls preload="metadata" />;
}

export default function RevealExperience({ data, loadClip, preview = false, onClose }) {
  const [stage, setStage] = useState(0); // 0 entrance · 1 opening · 2 memory · 3 forever · 4 gift · 5 thanks
  const theme = ['envelope', 'box', 'night'].includes(data.theme) ? data.theme : 'envelope';
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const openIt = () => {
    if (stage !== 0) return;
    setStage(1);
    timer.current = setTimeout(() => setStage(2), reduced() ? 400 : 2600);
  };
  const next = () => setStage((s) => Math.min(5, s + 1));
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
          <Clip clip={data.clip} loadClip={loadClip} />
          <button type="button" className="grv-next" onClick={next}>
            Continue <Icon name="arrow" size={16} />
          </button>
        </section>
      )}

      {/* 5 · the final surprise */}
      {stage === 3 && (
        <section className="grv-stage grv-forever">
          <span className="grv-rule" />
          <h2>
            A memory,
            <br />
            <em>crafted to stay forever.</em>
          </h2>
          <span className="grv-rule" />
          <button type="button" className="grv-next" onClick={next}>
            See your gift <Icon name="arrow" size={16} />
          </button>
        </section>
      )}

      {/* 6 · the gift */}
      {stage === 4 && (
        <section className="grv-stage grv-gift">
          <p className="grv-eyebrow">Your gift</p>
          {data.product?.image ? (
            <div className="grv-frame">
              <img src={data.product.image} alt={data.product.name || 'Your JHAYRA gift'} />
              <span className="grv-frame-glare" />
            </div>
          ) : (
            <div className="grv-frame grv-frame-empty">
              <img src={LOGO} alt="" />
            </div>
          )}
          {data.product?.name && <p className="grv-product">{data.product.name}</p>}
          <h2 className="grv-onway">
            Your JHAYRA gift is <em>on its way.</em>
          </h2>
          <p className="grv-line">Handcrafted and framed for you{data.from ? `, with love from ${data.from}` : ''}.</p>
          <button type="button" className="grv-next" onClick={next}>
            Continue <Icon name="arrow" size={16} />
          </button>
        </section>
      )}

      {/* 7 · closing */}
      {stage === 5 && (
        <section className="grv-stage grv-thanks">
          <img className="grv-logo big" src={LOGO} alt="JHAYRA" />
          <p className="grv-wordmark">JHAYRA</p>
          <p className="grv-tagline">Crafting Memories Into Art.</p>
          <span className="grv-rule" />
          <h2>
            {data.from ? (
              <>
                With love, <em>{data.from}</em>
              </>
            ) : (
              'With love'
            )}
          </h2>
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
