import { Fragment, lazy, Suspense, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Frame from '../components/Frame';
import Img from '../components/Img';
import Icon from '../components/Icon';
import Reveal from '../components/Reveal';
import RoomScene, { WALLS } from '../components/RoomScene';
import Particles from '../components/Particles';
import TemplateCanvas from '../components/TemplateCanvas';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import LazyMount from '../components/LazyMount';
import Founder from '../components/Founder';
import { Seo } from '../lib/seo';
import { useCategories, useOptionSummary, useProducts, useSamplePhoto } from '../lib/catalog';
import { useTemplates } from '../lib/templates';
import { ROOMS } from '../lib/rooms';
import { HOME_FAQ } from '../lib/faq';
import { useFestival } from '../state/festival';
import { useToast } from '../state/store';
import { useCart } from '../state/cart';
import { daysUntil, orderBy } from '../lib/festivals';
import { money, SITE, waLink } from '../lib/site';
import { BRAND } from '../lib/brand';
import { MIN_PRICE, SIZES } from '../lib/frames';

const LivingStudio = lazy(() => import('../components/LivingStudio'));
const WALL = Object.fromEntries(WALLS.map((w) => [w.id, w]));

// Splits a headline into words that rise in one after another (CSS only;
// the full text is in the DOM from the first paint and reads normally).
function Kinetic({ text, start = 0, className = '' }) {
  const words = text.split(' ');
  return words.map((w, i) => (
    <Fragment key={i}>
      <span className={`kw ${className}`} style={{ '--w': start + i }}>
        {w}
      </span>
      {i < words.length - 1 ? ' ' : null}
    </Fragment>
  ));
}

function SectionHead({ eyebrow, title, em, children, center }) {
  return (
    <div className={`sf-head ${center ? 'center' : ''}`}>
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="h2">
          {title} {em && <em>{em}</em>}
        </h2>
      </div>
      {children}
    </div>
  );
}

/* ── Festival world hero ──────────────────────────────────────────────── */
function Countdown({ festival }) {
  const left = daysUntil(festival);
  const by = orderBy(festival);
  const late = by < new Date();
  const fmt = (d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  if (left < 0) return null;
  return (
    <div className="fx-count">
      <div className="fx-count-num">
        <b>{left === 0 ? 'Today' : left}</b>
        {left > 0 && <span>{left === 1 ? 'day to go' : 'days to go'}</span>}
      </div>
      <p>
        {late ? (
          <>
            Short on time? <a href={waLink(`Hi JHAYRA! Can you deliver a ${festival.name} frame before ${fmt(new Date(festival.date))}? My pincode is: `)} target="_blank" rel="noopener noreferrer">WhatsApp us</a> — we'll tell you honestly if we can make it to your city.
          </>
        ) : (
          <>
            Order by <b>{fmt(by)}</b> for delivery before {festival.name}.
          </>
        )}
      </p>
    </div>
  );
}

function CouponChip({ code, offer }) {
  const toast = useToast();
  if (!code) return null;
  return (
    <button
      type="button"
      className="fx-coupon"
      onClick={() => {
        navigator.clipboard?.writeText(code).catch(() => {});
        toast(`Code ${code} copied — it's applied automatically at checkout`, 'ok');
      }}
    >
      <span>{offer}</span>
      <b>{code}</b>
      <small>Tap to copy</small>
    </button>
  );
}

function FestivalHero({ festival }) {
  const { active } = useTemplates();
  const pick = useMemo(() => {
    for (const g of festival.templateGroups) {
      const t = active.find((x) => x.group === g && !x.layout.startsWith('calendar') && (x.slots?.length || 0) <= 2);
      if (t) return t;
    }
    return active[0];
  }, [active, festival]);
  const texts = festival.id === 'karva-chauth' ? { name1: 'Aarav', name2: 'Ananya', name: 'Aarav & Ananya', msg: 'My moon, my forever', date: festival.date } : {};
  return (
    <section className="fx-hero" aria-label={`${festival.name} collection`}>
      <Particles kind={festival.particles} />
      {festival.theme.moon && <div className="fx-moon" aria-hidden="true" />}
      {festival.theme.rangoli && <div className="fx-rangoli" aria-hidden="true" />}
      <div className="wrap fx-grid">
        <div className="fx-copy">
          <span className="eyebrow">{festival.eyebrow}</span>
          <h1 className="display fx-title">
            {festival.title.map((line, i) => (
              <span key={i} style={{ '--i': i }}>
                {i === festival.title.length - 1 ? <em>{line}</em> : line}
              </span>
            ))}
          </h1>
          <p className="lead">{festival.lead}</p>
          <CouponChip code={festival.coupon} offer={festival.offer} />
          <div className="row fx-ctas">
            <Link to={festival.cta.to} className="btn btn-gold btn-lg">
              {festival.cta.label} <Icon name="arrow" size={18} />
            </Link>
            <Link to={festival.cta2.to} className="btn btn-ghost-light btn-lg">
              {festival.cta2.label}
            </Link>
          </div>
          <Countdown festival={festival} />
        </div>
        <div className="fx-art" aria-hidden="true">
          <div className="fx-art-glow" />
          {pick && (
            <Frame ratio={{ w: 12, h: 16 }} colour="#1C1C1C" tilt mat>
              <TemplateCanvas template={pick} texts={{ ...texts }} />
            </Frame>
          )}
        </div>
      </div>
    </section>
  );
}

function FestivalPicks({ festival, products, categories }) {
  const { active } = useTemplates();
  const templates = active.filter((t) => festival.templateGroups.includes(t.group)).slice(0, 8);
  const picks = (products || [])
    .filter((p) => festival.categories.includes(p.category) || festival.keywords.some((k) => p.name.toLowerCase().includes(k)))
    .slice(0, 8);
  if (!templates.length && !picks.length) return null;
  return (
    <section className="section fx-picks">
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="eyebrow">{festival.name} edit</span>
            <h2 className="h2">
              Made for <em>this {festival.name}</em>
            </h2>
          </div>
          <Link to={festival.cta.to} className="link">
            See everything <Icon name="arrow" size={16} />
          </Link>
        </div>
        {templates.length > 0 && (
          <div className="rail" role="list">
            {templates.map((t) => (
              <Link key={t.id} to={`/customize/${t.id}`} className="rail-item tcard" role="listitem">
                <div className="tcard-stage">
                  <Frame ratio={{ w: 12, h: 16 }} colour="#1C1C1C" glare={false}>
                    <TemplateCanvas template={t} mini />
                  </Frame>
                </div>
                <b>{t.title}</b>
                <small>Personalise · from {money(MIN_PRICE)}</small>
              </Link>
            ))}
          </div>
        )}
        {picks.length > 0 && (
          <div className="grid-products" style={{ marginTop: 48 }}>
            {picks.slice(0, 4).map((p, i) => (
              <ProductCard key={p.id} product={p} categories={categories} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── 2 · Hero: real artwork on a styled wall ───────────────────────────── */
const ART_CATS = ['nature', 'personalized', 'modern-art', 'art-abstract', 'canvas', 'religious', 'home-vastu', 'running-horses', 'photography'];

function Hero({ products }) {
  const sets = useMemo(() => {
    const art = (products || []).filter((p) => p.thumbnail && ART_CATS.includes(p.category)).sort((a, b) => b.is_bestseller - a.is_bestseller);
    const out = [];
    for (let i = 0; i + 3 <= art.length && out.length < 5; i += 3) out.push(art.slice(i, i + 3));
    return out;
  }, [products]);
  const [n, setN] = useState(0);
  const [sel, setSel] = useState(null);
  const room = useRef(null);
  const set = sets[n % Math.max(1, sets.length)] || [];
  const frames = set.map((p, i) => ({ key: p.id, src: p.thumbnail, wIn: 12, hIn: 18, dxIn: (i - 1) * 14.5, colour: '#1C1C1C', hotspot: `About ${p.name}` }));
  const active = set.find((p) => p.id === sel);

  // Slight depth on scroll: desktop only, never with reduced motion.
  useEffect(() => {
    const el = room.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce), (max-width: 899px)').matches) return;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 700);
        el.style.transform = `translate3d(0, ${y * 0.06}px, 0)`;
      });
    };
    window.addEventListener('scroll', on, { passive: true });
    return () => {
      window.removeEventListener('scroll', on);
      cancelAnimationFrame(raf);
    };
  }, []);

  const step = (d) => {
    setSel(null);
    setN((x) => (x + d + sets.length) % sets.length);
  };

  return (
    <section className="gh sf-hero mesh" aria-label="Welcome to JHAYRA">
      <div className="gh-copy wrap">
        <span className="eyebrow sf-in" style={{ '--d': '0s' }}>
          Your home, your story
        </span>
        <h1 className="gh-title sf-hero-title">
          <Kinetic text="Crafting Memories" />{' '}
          <br />
          <em>
            <Kinetic text="Into Art." start={2} />
          </em>
        </h1>
        <p className="lead sf-in" style={{ '--d': '.25s' }}>
          Discover thoughtfully designed wall art and personalised frames that make your spaces feel unmistakably yours.
        </p>
        <div className="row gh-ctas sf-in" style={{ '--d': '.32s' }}>
          <Link to="/shop" className="btn btn-gold btn-lg sheen">
            Shop Wall Art <Icon name="arrow" size={18} />
          </Link>
          <Link to="/customize" className="btn btn-ghost btn-lg">
            Create Your Own
          </Link>
        </div>
        <ul className="sf-hero-facts sf-in" style={{ '--d': '.4s' }}>
          <li>
            <Icon name="truck" size={16} /> Free delivery across India
          </li>
          <li>
            <Icon name="refresh" size={16} /> Free replacement if damaged
          </li>
        </ul>
      </div>
      <div className="gh-room">
        <div className="gh-room-inner" ref={room}>
          <RoomScene wall={WALL.porcelain} furniture="sofa" frames={frames} groupHeightIn={18} zoom={1.9} furnitureWidth={0.6} decor tone="gallery" selected={sel} onFrameClick={(k) => setSel((s) => (s === k ? null : k))} className="room-hero" />
        </div>
        <div className="gh-hud">
          <span className="gh-hint glass">{active ? 'Selected artwork' : 'Tap any artwork on the wall'}</span>
          {sets.length > 1 && (
            <span className="gh-arrows glass">
              <button className="icon-btn" aria-label="Previous wall" onClick={() => step(-1)}>
                <Icon name="arrowL" size={18} />
              </button>
              <span className="gh-count" aria-live="polite">
                {String((n % sets.length) + 1).padStart(2, '0')} / {String(sets.length).padStart(2, '0')}
              </span>
              <button className="icon-btn" aria-label="Next wall" onClick={() => step(1)}>
                <Icon name="arrow" size={18} />
              </button>
            </span>
          )}
        </div>
        {active && (
          <div className="gh-panel glass" role="dialog" aria-label={active.name}>
            <div className="gh-panel-img">
              <Img src={active.thumbnail} alt="" sizes="72px" width={160} />
            </div>
            <div className="grow">
              <small>{active.category?.replace(/-/g, ' ')}</small>
              <b>{active.name}</b>
              <span>from {money(active.price)}</span>
            </div>
            <div className="gh-panel-actions">
              <Link to={`/product/${active.id}`} className="btn btn-gold btn-sm">
                View
              </Link>
              <Link to={`/visualise?p=${active.id}`} className="btn btn-ghost btn-sm">
                In my room
              </Link>
            </div>
            <button className="icon-btn gh-panel-x" onClick={() => setSel(null)} aria-label="Close">
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── 3 · Shop by room or category ──────────────────────────────────────── */
function RoomsAndCategories({ products }) {
  const { active } = useTemplates();
  const list = (products || []).filter((p) => p.thumbnail);
  const framesFor = (items, n = 2, wIn = 9.5, hIn = 13) => items.slice(0, n).map((p, k) => ({ key: p.id, src: p.thumbnail, wIn, hIn, dxIn: n > 1 ? (k - (n - 1) / 2) * (wIn + 2.5) : 0, colour: '#1C1C1C' }));
  const personal = active.find((t) => t.group === 'couple-frame' && (t.slots?.length || 0) >= 2) || active[0];
  // A five-frame gallery arrangement built from real artwork.
  const gal = list.slice(6, 11);
  const gallery = gal.map((p, k) => ({ key: p.id, src: p.thumbnail, wIn: k === 2 ? 12 : 8, hIn: k === 2 ? 16 : 10.5, dxIn: [-20, -10.5, 0, 10.5, 20][k], dyIn: [-2.5, 3.5, 0, -3, 2.5][k], colour: '#1C1C1C' }));
  const tiles = [
    ...['living', 'bedroom', 'office', 'dining'].map((id) => {
      const r = ROOMS.find((x) => x.id === id);
      const items = list.filter((p) => r.cats.includes(p.category));
      return { id, label: r.label, sub: r.blurb, to: `/shop?room=${id}`, count: `${items.length} pieces`, scene: <RoomScene wall={WALL[r.wall]} furniture={r.furniture} frames={framesFor(items)} groupHeightIn={13} zoom={2.1} furnitureWidth={0.78} tone="gallery" className="room-mini" /> };
    }),
    {
      id: 'personal',
      label: 'Personalised photo frames',
      sub: 'Your photos, names and dates',
      to: '/customize',
      count: `${active.length} designs`,
      scene: (
        <div className="env-solo">
          {personal && (
            <Frame ratio={{ w: 12, h: 16 }} colour="#1C1C1C" glare={false} mat>
              <TemplateCanvas template={personal} mini />
            </Frame>
          )}
        </div>
      ),
    },
    { id: 'gallery', label: 'Gallery walls', sub: 'Plan a wall true to scale', to: '/wall-planner', count: 'Free planner', scene: <RoomScene wall={WALL.stone} furniture="console" frames={gallery} groupHeightIn={16} zoom={1.7} furnitureWidth={0.7} tone="gallery" className="room-mini" /> },
  ];
  return (
    <section className="section sf-rooms">
      <div className="wrap">
        <SectionHead eyebrow="Shop by room or category" title="Art for every" em="room you live in.">
          <Link to="/shop" className="link">
            Shop all wall art <Icon name="arrow" size={16} />
          </Link>
        </SectionHead>
        <div className="sf-room-grid">
          {tiles.map((t, i) => (
            <Reveal key={t.id} as={Link} to={t.to} className="env sf-tile" delay={(i % 3) * 0.06}>
              <div className="env-scene">{t.scene}</div>
              <div className="env-foot">
                <span>
                  <b>{t.label}</b>
                  <small>{t.sub}</small>
                </span>
                <span className="sf-tile-n">
                  {t.count} <Icon name="arrow" size={14} />
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 4 · Bestsellers & trending ────────────────────────────────────────── */
function Bestsellers({ products, categories, loading }) {
  const { data: opts } = useOptionSummary();
  const items = (products || []).filter((p) => p.thumbnail && p.is_bestseller).slice(0, 8);
  return (
    <section className="section sf-best">
      <div className="wrap">
        <SectionHead eyebrow="Most loved" title="Bestsellers &" em="trending designs.">
          <Link to="/shop?sort=bestsellers" className="link">
            Shop all bestsellers <Icon name="arrow" size={16} />
          </Link>
        </SectionHead>
        <div className="grid-products sf-stagger">
          {loading && !products ? Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />) : items.map((p, i) => <ProductCard key={p.id} product={p} categories={categories} index={i} options={opts?.[p.dbId]} />)}
        </div>
        <div className="center" style={{ marginTop: 36 }}>
          <Link to="/shop" className="btn btn-lg">
            Shop All <Icon name="arrow" size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── 4b · The JHAYRA Signature Experience ──────────────────────────────── */
// Scrolls to #signature below the sticky header; instant when reduced motion
// is preferred. Sections above may still be mounting, so it re-checks once.
function scrollToSignature() {
  const el = document.getElementById('signature');
  if (!el) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const offset = () => (document.querySelector('.header')?.offsetHeight || 68) + 12;
  const target = () => Math.round(el.getBoundingClientRect().top + window.scrollY - offset());
  window.scrollTo({ top: target(), behavior: reduce ? 'auto' : 'smooth' });
  // Sections above may finish mounting during the scroll and push the target
  // down; correct a few times, but stop as soon as the visitor scrolls themselves.
  let last = null;
  let tries = 0;
  const done = () => el.querySelector('h2')?.focus({ preventScroll: true });
  const settle = () => {
    if (last !== null && Math.abs(window.scrollY - last) > 4) return done();
    const t = target();
    if (Math.abs(window.scrollY - t) > 8) window.scrollTo({ top: t, behavior: 'auto' });
    last = window.scrollY;
    if (++tries < 4) setTimeout(settle, 400);
    else done();
  };
  setTimeout(settle, reduce ? 50 : 900);
}

function SignatureCard({ icon, title, children, cta, to, href, note, className = '', i = 0 }) {
  const action = href ? (
    <a className="link sig-cta" href={href} target="_blank" rel="noopener noreferrer">
      {cta} <Icon name="arrow" size={15} />
    </a>
  ) : (
    <Link className="link sig-cta" to={to}>
      {cta} <Icon name="arrow" size={15} />
    </Link>
  );
  return (
    <Reveal as="article" className={`sig-card ${className}`} delay={(i % 3) * 0.06}>
      <span className="sig-ic" aria-hidden="true">
        {icon}
      </span>
      <h3>{title}</h3>
      <div className="sig-body">{children}</div>
      {note && <p className="sig-note">{note}</p>}
      {action}
    </Reveal>
  );
}

function Signature({ products }) {
  const { count } = useCart();
  const art = (products || []).filter((p) => p.thumbnail);
  // Curated: the highest-rated bestseller from a few different categories.
  const curated = useMemo(() => {
    const seen = new Set();
    return art
      .filter((p) => p.is_bestseller)
      .sort((a, b) => (b.rating || 0) * (b.review_count || 0) - (a.rating || 0) * (a.review_count || 0))
      .filter((p) => !seen.has(p.category) && seen.add(p.category))
      .slice(0, 3);
  }, [products]); // eslint-disable-line react-hooks/exhaustive-deps
  const feature = curated[0];
  return (
    <section className="section sig" id="signature" aria-labelledby="sig-title">
      <div className="wrap">
        <div className="sig-intro">
          <Reveal className="sig-copy">
            <span className="eyebrow">The Jhayra Signature Experience</span>
            <h2 className="h2" id="sig-title" tabIndex={-1}>
              Enter a World of <em>Extraordinary Art.</em>
            </h2>
            <p className="lead">Exceptional designs, thoughtful craftsmanship, beautiful packaging, and personal touches that make every Jhayra order feel special.</p>
            <a
              className="btn btn-gold btn-lg sheen"
              href="#sig-cards"
              onClick={(e) => {
                e.preventDefault();
                const c = document.getElementById('sig-cards');
                const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
                const offset = (document.querySelector('.header')?.offsetHeight || 68) + 12;
                c && window.scrollTo({ top: c.getBoundingClientRect().top + window.scrollY - offset, behavior: reduce ? 'auto' : 'smooth' });
              }}
            >
              Explore the Experience <Icon name="arrow" size={18} />
            </a>
          </Reveal>
          <Reveal className="sig-art" delay={0.08}>
            {feature && (
              <Link to={`/product/${feature.id}`} className="sig-feature" aria-label={`${feature.name}, from ${money(feature.price)}`}>
                <Frame src={feature.thumbnail} alt={feature.name} ratio={{ w: 12, h: 16 }} colour="#1C1C1C" glare mat sizes="(max-width: 900px) 70vw, 30vw" />
              </Link>
            )}
            <span className="sig-seal" aria-hidden="true">
              <span>JHAYRA</span>
              <small>Signature</small>
            </span>
          </Reveal>
        </div>

        <div className="sig-cards" id="sig-cards">
          <SignatureCard i={0} className="sig-curated" icon={<Icon name="star" size={18} />} title="Curated Artwork" cta="Explore the Collection" to="/collections">
            <p>Bestsellers chosen from across our styles.</p>
            <ul className="sig-picks">
              {curated.map((p) => (
                <li key={p.id}>
                  <Link to={`/product/${p.id}`}>
                    <span className="sig-pick-img">
                      <Img src={p.thumbnail} alt="" sizes="56px" width={140} />
                    </span>
                    <span>
                      <b>{p.name}</b>
                      <small>from {money(p.price)}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </SignatureCard>
          <SignatureCard i={1} icon={<Icon name="box" size={18} />} title="Beautiful Packaging" cta="Discover the Packaging" to="/replacement-policy">
            <p>Every order is quality-checked and packed securely for its journey. Ordering a gift? Your printed gift card goes inside the box and the price stays hidden.</p>
          </SignatureCard>
          <SignatureCard i={2} icon={<Icon name="edit" size={18} />} title="Personalised Gift Messages" cta="Make It Personal" to={count ? '/checkout?gift=1' : '/shop'} note={count ? 'Opens checkout with the gift card ready to write.' : 'Add a free gift card with your message at checkout.'}>
            <p>Write who it’s for, who it’s from and a message from the heart. We print it on a card and send it with the artwork — free on every order.</p>
          </SignatureCard>
          <SignatureCard
            i={3}
            icon={<Icon name="truck" size={18} />}
            title="Priority Delivery"
            cta="Check Delivery Options"
            href={waLink('Hi JHAYRA! I’d like to check faster delivery. My pincode is: … and I need it by: …')}
            note="Faster delivery isn’t bookable online yet. We confirm availability and any extra cost on WhatsApp before you pay."
          >
            <p>
              Standard delivery is free: made to order in 1–2 business days, then 5–7 business days in transit. Need it sooner? Faster delivery may be possible for some orders and pincodes.
            </p>
          </SignatureCard>
          <SignatureCard
            i={4}
            className="sig-founder"
            icon={<span className="sig-wink">😉</span>}
            title="Delivered by the Founder"
            cta="Request Founder Delivery"
            href={waLink('Hi JHAYRA! I’d love to request founder delivery for my order. My city and pincode are: …  (I understand this is a request and not confirmed until you accept it.)')}
            note="A request, not a booking — it’s only confirmed once we reply and accept."
          >
            <p>Sometimes, your order comes with a personal hello. Available in selected locations, subject to confirmation.</p>
          </SignatureCard>
          <SignatureCard i={5} icon={<Icon name="sparkle" size={18} />} title="Personal Art Concierge" cta="Get Personal Guidance" href={waLink('Hi JHAYRA! I’d like help choosing artwork — size, frame or a gift.')} note={`Mon–Sat 9–7 · Sun 10–4 · ${SITE.phoneDisplay}`}>
            <p>Not sure which size suits your wall, which frame finish goes with your room, or what to gift? Talk to a real person on WhatsApp.</p>
          </SignatureCard>
        </div>
      </div>
    </section>
  );
}

/* ── 5 · Create your own ───────────────────────────────────────────────── */
const CREATE_STEPS = [
  ['upload', 'Upload your photo', 'We check its resolution and tell you which sizes will print sharp.'],
  ['move', 'Crop and position', 'Drag and zoom to frame it exactly how you want.'],
  ['type', 'Add names, dates or a message', 'Where the design allows — set in our typography.'],
  ['wall', 'Choose size and frame', `A4 to 24 × 36 inches, from ${money(MIN_PRICE)}.`],
];
function CreateYourOwn({ sample }) {
  return (
    <section className="section sf-create surface-night" id="create">
      <span className="morph" aria-hidden="true" />
      <div className="wrap">
        <SectionHead eyebrow="Create your own art" title="Your memories deserve" em="a place on your wall.">
          <Link to="/customize" className="btn btn-gold sheen">
            Create Your Own Art <Icon name="arrow" size={16} />
          </Link>
        </SectionHead>
        <div className="sf-create-grid">
          <ol className="sf-steps">
            {CREATE_STEPS.map(([ic, t, d], i) => (
              <Reveal as="li" key={t} delay={i * 0.06}>
                <span className="sf-step-ic">
                  <Icon name={ic} size={20} />
                </span>
                <span>
                  <b>{t}</b>
                  <small>{d}</small>
                </span>
              </Reveal>
            ))}
            <li className="sf-steps-note">The preview is exactly what we print — then add it to your cart with your photo and choices saved.</li>
          </ol>
          <LazyMount minHeight={520} margin="300px">
            <Suspense fallback={<div style={{ minHeight: 520 }} />}>
              <LivingStudio compact samplePhoto={sample} />
            </Suspense>
          </LazyMount>
        </div>
      </div>
    </section>
  );
}

/* ── 6 · Visualise (blueprint of the real sizes against a sofa) ────────── */
function Blueprint() {
  // Inches → SVG units; a 84-inch three-seater for scale.
  const k = 4;
  const sofaW = 84;
  const W = 120 * k;
  const floor = 96 * k;
  const sofaTop = floor - 34 * k;
  const sizes = [...SIZES].reverse();
  let x = (W - sizes.reduce((a, s) => a + s.w * k, 0) - (sizes.length - 1) * 4 * k) / 2;
  return (
    <svg className="blueprint" viewBox={`0 0 ${W} ${floor + 10}`} role="img" aria-label="JHAYRA frame sizes drawn to scale above an 84-inch sofa">
      <defs>
        <pattern id="bp-grid" width={12 * k} height={12 * k} patternUnits="userSpaceOnUse">
          <path d={`M ${12 * k} 0 L 0 0 0 ${12 * k}`} fill="none" stroke="currentColor" strokeOpacity=".12" />
        </pattern>
      </defs>
      <rect width={W} height={floor} fill="url(#bp-grid)" />
      <line x1="0" x2={W} y1={floor} y2={floor} stroke="currentColor" strokeOpacity=".5" />
      <rect className="bp-sofa" x={(W - sofaW * k) / 2} y={sofaTop} width={sofaW * k} height={34 * k} rx={6} />
      <text className="bp-label" x={W / 2} y={sofaTop + 20 * k} textAnchor="middle">
        Sofa · 84 in
      </text>
      {sizes.map((s, i) => {
        const w = s.w * k;
        const h = s.h * k;
        const bottom = sofaTop - 8 * k;
        const fx = x;
        x += w + 4 * k;
        return (
          <g key={s.slug} className="bp-frame" style={{ '--i': i }}>
            <rect x={fx} y={bottom - h} width={w} height={h} />
            <text className="bp-label" x={fx + w / 2} y={bottom - h - 8} textAnchor="middle">
              {s.name}
            </text>
            <text className="bp-dim" x={fx + w / 2} y={bottom - h / 2} textAnchor="middle">
              {s.w}×{s.h}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function VisualiseSection() {
  return (
    <section className="section sf-viz">
      <div className="wrap sf-viz-grid">
        <Reveal className="sf-viz-copy">
          <span className="eyebrow">Visualise</span>
          <h2 className="h2">
            See it on your wall <em>before you buy.</em>
          </h2>
          <ol className="sf-viz-steps">
            <li>
              <b>Take or upload a photo of your wall</b> — or start with one of our rooms.
            </li>
            <li>
              <b>Choose any artwork, size and frame.</b> Every size is drawn to scale.
            </li>
            <li>
              <b>Drag it into place</b> and compare it with something you know, like a sofa or a door.
            </li>
          </ol>
          <p className="small muted">A photo preview to help you decide — no app or AR headset needed.</p>
          <Link to="/visualise" className="btn btn-lg sheen">
            Try Visualise <Icon name="arrow" size={18} />
          </Link>
        </Reveal>
        <Reveal className="sf-viz-art" delay={0.08}>
          <Blueprint />
          <div className="sf-viz-chip glass">
            <Icon name="wall" size={16} /> Four sizes, true to scale
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 7 · Gift Finder teaser ────────────────────────────────────────────── */
const GIFT_FOR = [
  ['partner', 'Partner'],
  ['parents', 'Parents'],
  ['friends', 'Friends'],
  ['family', 'Family'],
  ['housewarming', 'Housewarming'],
  ['myself', 'Myself'],
];
function GiftTeaser() {
  return (
    <section className="section-sm">
      <div className="wrap">
        <Reveal className="sf-gift mesh">
          <div>
            <span className="eyebrow">Gift Finder</span>
            <h2 className="h2">
              Find art <em>they’ll love.</em>
            </h2>
            <p className="lead">Thoughtful gifts for the people, moments, and spaces that matter.</p>
            <Link to="/gift-finder" className="btn btn-gold btn-lg sheen">
              Find the Perfect Gift <Icon name="arrow" size={18} />
            </Link>
          </div>
          <div className="sf-gift-who" aria-label="Start with who it’s for">
            <small>Who is it for?</small>
            <div className="chips">
              {GIFT_FOR.map(([id, label]) => (
                <Link key={id} to={`/gift-finder?who=${id}`} className="chip">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 8 · Why JHAYRA ────────────────────────────────────────────────────── */
function WhyJhayra({ products, categories }) {
  const { active } = useTemplates();
  const art = (products || []).filter((p) => p.thumbnail);
  const cats = new Set(art.map((p) => p.category)).size;
  const pics = art.filter((p) => ['religious', 'nature', 'art-abstract', 'modern-art'].includes(p.category)).slice(0, 3);
  const benefits = [
    ['sparkle', 'Personalised artwork', `${active.length || 'Over 100'} designs to fill with your photos, names and dates.`],
    ['image', 'Thoughtfully selected designs', art.length ? `${art.length} ready-made artworks across ${cats || categories?.length || ''} styles.` : 'Ready-made artworks across many styles.'],
    ['wall', 'Sizes and frame finishes', 'A4 to 24 × 36 inches, framed in black, gold or brown.'],
    ['shield', 'Quality materials', 'Premium PS moulding, a high-definition print and a protective front sheet. Ready to hang.'],
    ['truck', 'Free delivery across India', 'Made to order in 1–2 business days, delivered in 5–7.'],
    ['refresh', 'Clear, honest support', 'Free replacement if it arrives damaged. Real people on WhatsApp.'],
  ];
  return (
    <section className="section sf-why">
      <div className="wrap sf-why-grid">
        <div>
          <SectionHead eyebrow="Why JHAYRA" title="Made for one wall —" em="yours." />
          <p className="lead sf-why-lead">Every piece is printed and framed to order in India, for one customer at a time. Here is exactly what that means for you.</p>
          <ul className="sf-benefits">
            {benefits.map(([ic, t, d], i) => (
              <Reveal as="li" key={t} delay={(i % 2) * 0.05}>
                <Icon name={ic} size={20} />
                <span>
                  <b>{t}</b>
                  <small>{d}</small>
                </span>
              </Reveal>
            ))}
          </ul>
        </div>
        <div className="sf-why-art" aria-hidden="true">
          {pics.map((p, i) => (
            <div key={p.id} className={`sf-why-f f${i}`}>
              <Frame src={p.thumbnail} alt="" ratio={{ w: 12, h: 16 }} colour="#1C1C1C" glare sizes="(max-width: 900px) 40vw, 18vw" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 9 · Our story (no separate review system exists yet, so this shows the
   brand's own record and studio photography rather than testimonials) ──── */
function Story({ products }) {
  const art = (products || []).filter((p) => p.thumbnail);
  const rated = art.filter((p) => p.rating && p.review_count);
  const reviews = rated.reduce((a, p) => a + p.review_count, 0);
  const avg = reviews ? rated.reduce((a, p) => a + p.rating * p.review_count, 0) / reviews : 0;
  const strip = art.filter((p) => ['family', 'wedding', 'love-romance', 'baby-kids', 'occasions', 'animals-pets'].includes(p.category)).slice(0, 6);
  return (
    <section className="section sf-story surface-cream">
      <div className="wrap">
        <div className="sf-story-grid">
          <Reveal>
            <span className="eyebrow">Since {BRAND.since}</span>
            <h2 className="h2">
              Crafting memories for <em>{BRAND.homes} homes.</em>
            </h2>
            <p className="lead">What started in {BRAND.since} as a small framing workshop now hangs in homes, offices and pooja rooms across India — every piece made to order, one customer at a time.</p>
            <dl className="sf-stats">
              <div>
                <dt>Homes</dt>
                <dd>{BRAND.homes}</dd>
              </div>
              <div>
                <dt>Corporate clients</dt>
                <dd>{BRAND.corporates}</dd>
              </div>
              <div>
                <dt>Gifts framed</dt>
                <dd>{BRAND.gifts}</dd>
              </div>
              {reviews > 0 && (
                <div>
                  <dt>Average product rating</dt>
                  <dd>
                    {avg.toFixed(1)}
                    <small>/5 · {reviews.toLocaleString('en-IN')} ratings</small>
                  </dd>
                </div>
              )}
            </dl>
            <Link to="/about" className="link">
              Read our story <Icon name="arrow" size={16} />
            </Link>
          </Reveal>
          <div className="sf-story-strip" aria-label="From the JHAYRA studio">
            {strip.map((p, i) => (
              <Reveal as={Link} key={p.id} to={`/product/${p.id}`} className="sf-story-pic" delay={i * 0.05}>
                <Img src={p.thumbnail} alt={p.name} sizes="(max-width: 900px) 33vw, 16vw" width={480} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 10 · How it works & delivery ──────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    ['search', 'Discover a design', 'Browse wall art — or start with your own photo.'],
    ['brush', 'Make it yours', 'Choose the size, frame and any personalisation.'],
    ['box', 'Receive your art', 'We craft it, quality-check it and deliver it free.'],
  ];
  return (
    <section className="section sf-how">
      <div className="wrap">
        <SectionHead eyebrow="How it works" title="Three steps to" em="a wall you love." center />
        <ol className="sf-how-steps">
          {steps.map(([ic, t, d], i) => (
            <Reveal as="li" key={t} delay={i * 0.08}>
              <span className="sf-how-n">{i + 1}</span>
              <Icon name={ic} size={22} />
              <b>{t}</b>
              <small>{d}</small>
            </Reveal>
          ))}
        </ol>
        <Reveal className="sf-timeline" aria-label="Delivery timeline">
          <div>
            <b>Day 0</b>
            <small>You place your order</small>
          </div>
          <div>
            <b>1–2 business days</b>
            <small>Crafted and quality-checked</small>
          </div>
          <div>
            <b>5–7 business days</b>
            <small>In transit — free across India</small>
          </div>
        </Reveal>
        <div className="center" style={{ marginTop: 34 }}>
          <Link to="/shop" className="btn btn-lg">
            Explore Wall Art <Icon name="arrow" size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── 11 · FAQ (WAI-ARIA accordion: buttons, regions, arrow keys) ───────── */
function Faq() {
  const [open, setOpen] = useState(0);
  const id = useId();
  const btns = useRef([]);
  const onKey = (e, i) => {
    const n = HOME_FAQ.length;
    const to = { ArrowDown: (i + 1) % n, ArrowUp: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    btns.current[to]?.focus();
  };
  return (
    <section className="section sf-faq">
      <div className="wrap wrap-narrow">
        <SectionHead eyebrow="Questions" title="Frequently asked" em="questions." center />
        <div className="sf-acc">
          {HOME_FAQ.map(([q, a], i) => {
            const on = open === i;
            return (
              <div key={q} className={`sf-acc-item ${on ? 'on' : ''}`}>
                <h3>
                  <button ref={(el) => (btns.current[i] = el)} type="button" id={`${id}-b${i}`} aria-expanded={on} aria-controls={`${id}-p${i}`} onClick={() => setOpen(on ? -1 : i)} onKeyDown={(e) => onKey(e, i)}>
                    {q}
                    <span className="sf-acc-ic" aria-hidden="true" />
                  </button>
                </h3>
                <div id={`${id}-p${i}`} role="region" aria-labelledby={`${id}-b${i}`} className="sf-acc-panel" hidden={!on}>
                  <p>{a}</p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="center small muted" style={{ marginTop: 22 }}>
          More answers on our <Link className="link" to="/support">Help & FAQs</Link> page, or{' '}
          <a className="link" href={waLink('Hi JHAYRA! I have a question.')} target="_blank" rel="noopener noreferrer">
            ask us on WhatsApp
          </a>
          .
        </p>
      </div>
    </section>
  );
}

/* ── 12 · Final call to action ─────────────────────────────────────────── */
function FinalCta() {
  return (
    <section className="sf-final mesh-dark">
      <span className="dust" aria-hidden="true">
        {Array.from({ length: 7 }, (_, i) => (
          <i key={i} style={{ '--i': i }} />
        ))}
      </span>
      <div className="wrap center">
        <Reveal>
          <h2 className="display sf-final-title">
            Make your walls <em>mean something.</em>
          </h2>
          <p className="lead">Find the artwork that feels like you, or turn a favourite memory into something lasting.</p>
          <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap', marginTop: 28 }}>
            <Link to="/shop" className="btn btn-light btn-lg sheen">
              Shop Wall Art <Icon name="arrow" size={18} />
            </Link>
            <Link to="/customize" className="btn btn-ghost-light btn-lg">
              Create Your Own
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  const festival = useFestival();
  const location = useLocation();
  // /#signature (from the strip on any page) scrolls to the section.
  useEffect(() => {
    if (location.hash !== '#signature') return;
    const t = setTimeout(scrollToSignature, 60);
    return () => clearTimeout(t);
  }, [location.key, location.hash]);
  const { data: products, loading } = useProducts();
  const { data: categories } = useCategories();
  const sample = useSamplePhoto();

  return (
    <>
      <Seo
        title={festival ? `${festival.name} Gifts — Personalised Frames | JHAYRA` : 'JHAYRA — Crafting Memories Into Art | Wall Art & Personalised Frames'}
        description={festival ? festival.lead : 'Wall art and personalised photo frames, framed to order in India since 2017. Shop by room, create your own, see it on your wall before you buy, and find the perfect gift. Free delivery across India.'}
        path="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              name: 'JHAYRA',
              url: SITE.url,
              logo: SITE.ogImage,
              slogan: 'Crafting Memories Into Art',
              foundingDate: String(BRAND.since),
              sameAs: [SITE.instagram],
              contactPoint: { '@type': 'ContactPoint', telephone: '+91-8446440469', contactType: 'customer service', availableLanguage: ['English', 'Hindi'] },
            },
            { '@type': 'FAQPage', mainEntity: HOME_FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
          ],
        }}
      />
      {festival ? <FestivalHero festival={festival} /> : <Hero products={products} />}
      {festival && <FestivalPicks festival={festival} products={products} categories={categories} />}
      <LazyMount minHeight={760}>
        <RoomsAndCategories products={products} />
      </LazyMount>
      <LazyMount minHeight={900}>
        <Bestsellers products={products} categories={categories} loading={loading} />
      </LazyMount>
      <Signature products={products} />
      <LazyMount minHeight={900}>
        <CreateYourOwn sample={sample} />
      </LazyMount>
      <LazyMount minHeight={700}>
        <VisualiseSection />
      </LazyMount>
      <LazyMount minHeight={360}>
        <GiftTeaser />
      </LazyMount>
      <LazyMount minHeight={800}>
        <WhyJhayra products={products} categories={categories} />
      </LazyMount>
      <LazyMount minHeight={760}>
        <Story products={products} />
      </LazyMount>
      <LazyMount minHeight={760}>
        <Founder />
      </LazyMount>
      <LazyMount minHeight={620}>
        <HowItWorks />
      </LazyMount>
      <Faq />
      <FinalCta />
    </>
  );
}
