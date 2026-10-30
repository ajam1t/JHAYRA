import { Link } from 'react-router-dom';
import Frame from './Frame';
import Icon from './Icon';
import Particles from './Particles';
import ProductCard from './ProductCard';
import { targetFor } from '../lib/campaigns';

// ════════════════════════════════════════════════════════════════════════
// Festive Experience Engine — reusable pieces that dress any campaign in its
// theme (palette, motifs, particles, layout). Everything sits on JHAYRA's
// ivory foundation; the header, logo and navigation are never restyled.
// ════════════════════════════════════════════════════════════════════════

export const eventVars = (c) => ({
  '--ev-deep': c.palette.deep,
  '--ev-accent': c.palette.accent,
  '--ev-tint': c.palette.tint,
  '--ev-ink': c.palette.ink,
});

const range = (n) => Array.from({ length: n }, (_, i) => i);

// ── Motifs ────────────────────────────────────────────────────────────────
function Lights({ n = 16 }) {
  return (
    <span className="evd evd-lights" aria-hidden="true">
      <svg viewBox="0 0 400 24" preserveAspectRatio="none">
        <path d="M0 4 Q25 22 50 4 T100 4 T150 4 T200 4 T250 4 T300 4 T350 4 T400 4" />
      </svg>
      {range(n).map((i) => (
        <i key={i} style={{ '--i': i, left: `${(i + 0.5) * (100 / n)}%`, top: `${i % 2 ? 4 : 13}px` }} />
      ))}
    </span>
  );
}
const Garland = () => <span className="evd evd-garland" aria-hidden="true" />;
function Toran() {
  return (
    <span className="evd evd-toran" aria-hidden="true">
      {range(14).map((i) => (
        <i key={i} style={{ '--i': i }} />
      ))}
    </span>
  );
}
function Diyas() {
  return (
    <>
      {['l', 'r'].map((s) => (
        <span key={s} className={`evd evd-diya ${s}`} aria-hidden="true">
          <i />
        </span>
      ))}
    </>
  );
}
function Rangoli() {
  const petal = 'M0 -30 C9 -18 9 -8 0 0 C-9 -8 -9 -18 0 -30Z';
  return (
    <>
      {['l', 'r'].map((s) => (
        <svg key={s} className={`evd evd-rangoli ${s}`} viewBox="-40 -40 80 80" aria-hidden="true">
          {range(8).map((i) => (
            <path key={i} d={petal} transform={`rotate(${i * 45})`} />
          ))}
          {range(8).map((i) => (
            <circle key={`c${i}`} r="2.2" cx={Math.sin((i * Math.PI) / 4 + 0.39) * 34} cy={Math.cos((i * Math.PI) / 4 + 0.39) * 34} />
          ))}
          <circle r="6" className="core" />
        </svg>
      ))}
    </>
  );
}
function Lanterns() {
  return (
    <>
      {[12, 26, 82].map((x, i) => (
        <span key={x} className="evd evd-lantern" style={{ left: `${x}%`, '--i': i, '--len': `${18 + (i % 2) * 16}px` }} aria-hidden="true">
          <svg viewBox="0 0 20 34">
            <path d="M7 3h6l1 3H6zM5 6h10l2 6v12l-2 5H5l-2-5V12z" />
            <path className="glow" d="M7 12h6v10H7z" />
          </svg>
        </span>
      ))}
    </>
  );
}
const Moon = () => <span className="evd evd-moon" aria-hidden="true" />;
function Stars() {
  const at = [
    [8, 18],
    [22, 70],
    [40, 12],
    [63, 80],
    [78, 22],
    [91, 62],
  ];
  return (
    <>
      {at.map(([x, y], i) => (
        <span key={i} className="evd evd-star" style={{ left: `${x}%`, top: `${y}%`, '--i': i }} aria-hidden="true" />
      ))}
    </>
  );
}
function Hearts() {
  return (
    <>
      {[10, 30, 70, 88].map((x, i) => (
        <span key={x} className="evd evd-heart" style={{ left: `${x}%`, '--i': i }} aria-hidden="true">
          ♥
        </span>
      ))}
    </>
  );
}
function Bells() {
  return (
    <>
      {['l', 'r'].map((s) => (
        <span key={s} className={`evd evd-bell ${s}`} aria-hidden="true">
          <svg viewBox="0 0 24 30">
            <path d="M12 0v5M5 21c0-8 2-14 7-14s7 6 7 14l2 3H3z" />
            <circle cx="12" cy="26" r="2.4" />
          </svg>
        </span>
      ))}
    </>
  );
}
function Kite() {
  return (
    <span className="evd evd-kite" aria-hidden="true">
      <svg viewBox="0 0 40 70">
        <path d="M20 0 36 18 20 40 4 18z" />
        <path className="line" d="M20 40c-4 10 6 16 0 30" />
      </svg>
    </span>
  );
}
const MOTIFS = { lights: Lights, garland: Garland, toran: Toran, diyas: Diyas, rangoli: Rangoli, lanterns: Lanterns, moon: Moon, stars: Stars, hearts: Hearts, bells: Bells, kite: Kite };

// Decorations for a surface. `only` limits motifs (e.g. the strip only hangs
// lights/garlands/torans so it stays slim).
export function EventDecor({ c, only }) {
  const list = (c.decor || []).filter((d) => MOTIFS[d] && (!only || only.includes(d)));
  return (
    <span className="evd-layer" aria-hidden="true">
      {list.map((d) => {
        const M = MOTIFS[d];
        return <M key={d} />;
      })}
    </span>
  );
}

export function EventParticles({ c, scale = 1 }) {
  if (!c.particles) return null;
  return <Particles kind={c.particles} density={0.6 * (c.intensity || 1) * scale} seconds={c.duration || 0} />;
}

// ── Countdown ─────────────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const day = (s) => new Date(`${s}T00:00:00+05:30`);
function orderBy(dateStr) {
  const d = day(dateStr);
  let n = 9;
  while (n > 0) {
    d.setDate(d.getDate() - 1);
    if (d.getDay() !== 0) n--;
  }
  return d;
}
export function EventCountdown({ c }) {
  if (!c.showCountdown || !c.eventDate) return null;
  const left = Math.ceil((day(c.eventDate) - Date.now()) / 86400000);
  if (left < 0) return null;
  const by = orderBy(c.eventDate);
  const canDeliver = by.getTime() > Date.now();
  return (
    <span className="ev-count">
      <b>{left === 0 ? 'Today' : `${left} day${left > 1 ? 's' : ''} to go`}</b>
      {canDeliver && (
        <>
          {' '}
          · order by {by.getDate()} {MONTHS[by.getMonth()]} for delivery before {c.themeName.split(' ')[0]}
        </>
      )}
    </span>
  );
}

// ── Top strip ─────────────────────────────────────────────────────────────
export function EventStrip({ c }) {
  return (
    <Link to={targetFor(c.target).to} className="ev-strip" style={eventVars(c)}>
      <EventDecor c={c} only={['lights', 'garland', 'toran', 'stars']} />
      <span className="ev-strip-motif" aria-hidden="true">
        {c.motif}
      </span>
      <span className="ev-strip-text">
        <span className="ev-strip-kick">{c.kicker}</span>
        <em>{c.title}</em>
      </span>
      <span className="ev-strip-cta">
        {c.coupon ? `Code ${c.coupon}` : 'Shop'} <Icon name="arrow" size={13} stroke={2} />
      </span>
    </Link>
  );
}

// ── Banner ────────────────────────────────────────────────────────────────
const picksFor = (c, products) => {
  const list = (products || []).filter((p) => p.thumbnail);
  const words = (p) => p.name.toLowerCase().split(/[^a-z]+/);
  const hit = list.filter((p) => c.categories.includes(p.category) || c.keywords.some((k) => words(p).includes(k)));
  return (hit.length ? hit : list.filter((p) => p.is_bestseller)).sort((a, b) => (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0));
};

export function EventBanner({ c, products, as: Tag = 'section' }) {
  const t = targetFor(c.target);
  const lead = (products || []).find((p) => p.id === c.imageProduct);
  const art = [lead, ...picksFor(c, products).filter((p) => p !== lead)].filter(Boolean).slice(0, 3);
  // An uploaded creative is shown as designed, with the CTA beneath it.
  if (c.image || c.imageMobile) {
    return (
      <Tag className="ev-wrap" style={eventVars(c)} aria-label={c.title}>
        <div className="wrap">
          <Link to={t.to} className="ev-creative">
            <picture>
              {c.imageMobile && <source media="(max-width: 700px)" srcSet={c.imageMobile} />}
              <img src={c.image || c.imageMobile} alt={`${c.headline} ${c.em}`.trim()} loading="lazy" decoding="async" />
            </picture>
            <EventDecor c={c} only={['lights', 'garland', 'toran']} />
            <EventParticles c={c} scale={0.7} />
            <span className="ev-creative-cta">
              {c.cta || 'Explore'} <Icon name="arrow" size={15} />
            </span>
          </Link>
        </div>
      </Tag>
    );
  }
  return (
    <Tag className="ev-wrap" style={eventVars(c)} aria-label={c.title}>
      <div className="wrap">
        <div className={`ev-banner ev-${c.layout}`}>
          <EventParticles c={c} />
          <EventDecor c={c} />
          <div className="ev-copy">
            <span className="ev-kick">
              <span aria-hidden="true">{c.motif}</span> {c.kicker}
            </span>
            <h2 className="ev-title">
              {c.headline} {c.em && <em>{c.em}</em>}
            </h2>
            {c.subtitle && <p className="ev-sub">{c.subtitle}</p>}
            <div className="ev-actions">
              <Link to={t.to} className="btn ev-btn sheen">
                {c.cta || 'Explore'} <Icon name="arrow" size={16} />
              </Link>
              {c.coupon && (
                <span className="ev-code">
                  Use code <b>{c.coupon}</b>
                </span>
              )}
            </div>
            <EventCountdown c={c} />
          </div>
          {art.length > 0 && (
            <Link to={t.to} className="ev-art" tabIndex={-1} aria-hidden="true">
              <span className="ev-glow" />
              {(c.layout === 'centered' ? art : art.slice(0, 1)).map((p, i) => (
                <span key={p.id} className={`ev-f f${i}`}>
                  <Frame src={p.thumbnail} alt="" ratio={{ w: 12, h: 16 }} colour="#1C1C1C" glare={false} sizes="(max-width: 760px) 40vw, 240px" />
                </span>
              ))}
            </Link>
          )}
        </div>
      </div>
    </Tag>
  );
}

// ── Campaign picks ────────────────────────────────────────────────────────
export function EventPicks({ c, products, categories }) {
  if (!c.showPicks) return null;
  const picks = picksFor(c, products).slice(0, 8);
  if (picks.length < 2) return null;
  return (
    <section className="hs ev-picks" style={eventVars(c)}>
      <div className="wrap">
        <div className="hs-head">
          <h2 className="hs-title">
            The {c.themeName} <em className="ev-em">edit</em>
          </h2>
          <Link to={targetFor(c.target).to} className="hs-all">
            View all <Icon name="arrow" size={14} />
          </Link>
        </div>
        <div className="hs-scroll ev-picks-row">
          {picks.map((p, i) => (
            <ProductCard key={p.id} product={p} categories={categories} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Thin decorative layer for the hero room while a campaign is live.
export function EventHeroAccent({ c }) {
  return (
    <span className="ev-hero" style={eventVars(c)} aria-hidden="true">
      <EventDecor c={c} only={['lights', 'garland', 'toran', 'lanterns', 'bells']} />
      <EventParticles c={c} scale={0.5} />
    </span>
  );
}

// Banner image for admin lists.
export const eventThumb = (c, products) => c.image || c.imageMobile || (products || []).find((p) => p.id === c.imageProduct)?.thumbnail || picksFor(c, products)[0]?.thumbnail || '';
