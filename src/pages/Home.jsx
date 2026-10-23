import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Frame from '../components/Frame';
import Img from '../components/Img';
import Icon from '../components/Icon';
import Reveal from '../components/Reveal';
import RoomScene, { WALLS } from '../components/RoomScene';
import Particles from '../components/Particles';
import TemplateCanvas from '../components/TemplateCanvas';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import { Seo } from '../lib/seo';
import { useCategories, useProducts } from '../lib/catalog';
import { useTemplates } from '../lib/templates';
import { ROOMS } from '../lib/rooms';
import { COLLECTION_MAP, collectionProducts } from '../lib/collections';
import { ARTICLES } from '../lib/journal';
import LivingStudio from '../components/LivingStudio';
import { CollectionBlock } from './Collections';
import { JournalCard } from './Journal';
import { useSamplePhoto } from './PhotoBuilder';
import { useFestival } from '../state/festival';
import { useToast } from '../state/store';
import { daysUntil, orderBy } from '../lib/festivals';
import { money, SITE, waLink } from '../lib/site';
import { BRAND } from '../lib/brand';
import { MIN_PRICE } from '../lib/frames';

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

/* ── Hero: the gallery room ────────────────────────────────────────────── */
const ART_CATS = ['nature', 'personalized', 'modern-art', 'art-abstract', 'canvas', 'religious', 'home-vastu', 'running-horses', 'photography'];
const WALL = Object.fromEntries(WALLS.map((w) => [w.id, w]));

function GalleryHero({ products }) {
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

  // Gentle depth on scroll (skipped when reduced motion is preferred).
  useEffect(() => {
    const el = room.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 700);
        el.style.transform = `translate3d(0, ${y * 0.08}px, 0) scale(${1 + y * 0.00012})`;
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
    <section className="gh" aria-label="Featured artwork">
      <div className="gh-copy wrap">
        <span className="eyebrow">Jhayra · Art that lives with you</span>
        <h1 className="gh-title">
          <span>Your space.</span>
          <span>Your story.</span>
          <span>
            <em>Your art.</em>
          </span>
        </h1>
        <p className="lead">Transform the moments you love into art that belongs in your world. Handcrafted in India since {BRAND.since}, delivered free.</p>
        <div className="row gh-ctas">
          <Link to="/collections" className="btn btn-gold btn-lg">
            Explore the collection <Icon name="arrow" size={18} />
          </Link>
          <Link to="/customize/photo" className="btn btn-ghost btn-lg">
            Create your artwork
          </Link>
        </div>
      </div>
      <div className="gh-room">
        <div className="gh-room-inner" ref={room}>
          <RoomScene wall={WALL.porcelain} furniture="sofa" frames={frames} groupHeightIn={18} zoom={1.9} furnitureWidth={0.6} decor tone="gallery" selected={sel} onFrameClick={(k) => setSel((s) => (s === k ? null : k))} className="room-hero" />
        </div>
        <div className="gh-hud">
          <span className="gh-hint">{active ? 'Selected artwork' : 'Tap any artwork on the wall'}</span>
          {sets.length > 1 && (
            <span className="gh-arrows">
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
          <div className="gh-panel" role="dialog" aria-label={active.name}>
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

/* ── Discover by environment ──────────────────────────────────────────── */
function Environments({ products }) {
  const { active } = useTemplates();
  const list = products || [];
  const rooms = ['living', 'bedroom', 'office', 'dining'].map((id) => ROOMS.find((r) => r.id === id));
  const framesFor = (items, n = 2, wIn = 9.5, hIn = 13) =>
    items.slice(0, n).map((p, k) => ({ key: p.id, src: p.thumbnail, wIn, hIn, dxIn: n > 1 ? (k - (n - 1) / 2) * (wIn + 2.5) : 0, colour: '#1C1C1C' }));
  const couple = active.find((t) => t.group === 'couple-frame') || active[0];
  const gifts = collectionProducts(COLLECTION_MAP['art-for-gifting'], list).filter((p) => p.thumbnail);
  const abstract = list.filter((p) => p.thumbnail && ['art-abstract', 'modern-art'].includes(p.category));
  const nature = list.filter((p) => p.thumbnail && ['nature', 'photography'].includes(p.category));
  const tiles = [
    ...rooms.map((r) => {
      const items = list.filter((p) => p.thumbnail && r.cats.includes(p.category));
      return { id: r.id, label: r.label, to: `/shop?room=${r.id}`, count: items.length, scene: <RoomScene wall={WALL[r.wall]} furniture={r.furniture} frames={framesFor(items)} groupHeightIn={13} zoom={2.1} furnitureWidth={0.78} tone="gallery" className="room-mini" /> };
    }),
    {
      id: 'personal',
      label: 'Personalised art',
      to: '/customize',
      count: active.length,
      unit: 'designs',
      scene: (
        <div className="env-solo">
          {couple && (
            <Frame ratio={{ w: 12, h: 16 }} colour="#1C1C1C" glare={false} mat>
              <TemplateCanvas template={couple} mini />
            </Frame>
          )}
        </div>
      ),
    },
    { id: 'gifts', label: 'Gifts', to: '/collections/art-for-gifting', count: gifts.length, scene: <EnvTrio items={gifts} /> },
    { id: 'abstract', label: 'Abstract art', to: '/collections/abstract-forms', count: abstract.length, scene: <EnvTrio items={abstract} /> },
    { id: 'nature', label: 'Nature & landscapes', to: '/collections/nature-reimagined', count: nature.length, scene: <EnvTrio items={nature} /> },
  ];
  return (
    <section className="section env-sec">
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="eyebrow">Discover</span>
            <h2 className="h2">
              Art for every <em>environment.</em>
            </h2>
          </div>
          <Link to="/shop" className="link">
            Shop all art <Icon name="arrow" size={16} />
          </Link>
        </div>
        <div className="env-grid">
          {tiles.map((t, i) => (
            <Link key={t.id} to={t.to} className="env">
              <span className="env-n">{String(i + 1).padStart(2, '0')}</span>
              <div className="env-scene">{t.scene}</div>
              <div className="env-foot">
                <b>{t.label}</b>
                <span>
                  {t.count} {t.unit || 'pieces'} <Icon name="arrow" size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function EnvTrio({ items }) {
  return (
    <div className="env-trio">
      {items.slice(0, 3).map((p) => (
        <Frame key={p.id} src={p.thumbnail} alt="" ratio={{ w: 12, h: 16 }} colour="#1C1C1C" glare={false} sizes="120px" />
      ))}
    </div>
  );
}

/* ── Bestseller rail ──────────────────────────────────────────────────── */
function BestsellerRail({ products, categories, loading }) {
  const rail = useRef(null);
  const items = (products || []).filter((p) => p.is_bestseller || p.homepage_visible).slice(0, 12);
  const scroll = (d) => rail.current?.scrollBy({ left: d * rail.current.clientWidth * 0.8, behavior: 'smooth' });
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="eyebrow">Most loved</span>
            <h2 className="h2">Bestsellers</h2>
          </div>
          <div className="row">
            <button className="icon-btn rail-btn" aria-label="Scroll left" onClick={() => scroll(-1)}>
              <Icon name="arrowL" size={18} />
            </button>
            <button className="icon-btn rail-btn" aria-label="Scroll right" onClick={() => scroll(1)}>
              <Icon name="arrow" size={18} />
            </button>
            <Link to="/shop?sort=bestsellers" className="link" style={{ marginLeft: 8 }}>
              View all
            </Link>
          </div>
        </div>
        <div className="prail" ref={rail}>
          {loading ? Array.from({ length: 5 }, (_, i) => <ProductCardSkeleton key={i} />) : items.map((p, i) => <ProductCard key={p.id} product={p} categories={categories} index={i} room />)}
        </div>
        <p className="small muted" style={{ marginTop: 14 }}>
          ★ {BRAND.ratingSource}.
        </p>
      </div>
    </section>
  );
}

const PROMISES = [
  ['truck', 'Free delivery across India', '/shipping-policy'],
  ['refresh', 'Free replacement if damaged', '/replacement-policy'],
  ['lock', 'Secure payments by Razorpay', '/support'],
  ['shield', 'Your photos stay private', '/privacy'],
];

export default function Home() {
  const festival = useFestival();
  const { data: products, loading } = useProducts();
  const { data: categories } = useCategories();
  const sample = useSamplePhoto();

  return (
    <>
      <Seo
        title={festival ? `${festival.name} Gifts — Personalised Frames | JHAYRA` : 'JHAYRA — Art That Lives With You | Wall Art & Personalised Frames'}
        description={festival ? festival.lead : 'Premium wall art and personalised photo art in black frames, handcrafted in India since 2017. Discover by room, create your own, and visualise it on your wall. Free delivery across India.'}
        path="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'JHAYRA',
          url: SITE.url,
          logo: SITE.ogImage,
          slogan: 'Art that lives with you',
          foundingDate: String(BRAND.since),
          sameAs: [SITE.instagram],
          contactPoint: { '@type': 'ContactPoint', telephone: '+91-7070728989', contactType: 'customer service', availableLanguage: ['English', 'Hindi'] },
        }}
      />
      {festival ? <FestivalHero festival={festival} /> : <GalleryHero products={products} />}
      {festival && <FestivalPicks festival={festival} products={products} categories={categories} />}
      <Environments products={products} />
      <section className="section studio-dark surface-night" id="studio">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="eyebrow">The Living Art Studio</span>
              <h2 className="h2">
                Your photograph, <em>made into art.</em>
              </h2>
            </div>
            <p className="lead" style={{ maxWidth: 440 }}>
              Upload a photo, choose a treatment, add a name or date. The preview is exactly what we print — in a black frame, at the price you see.
            </p>
          </div>
          <LivingStudio compact samplePhoto={sample} />
        </div>
      </section>
      <section className="section collections-home">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="eyebrow">Curated collections</span>
              <h2 className="h2">
                Walls with a <em>point of view.</em>
              </h2>
            </div>
            <Link to="/collections" className="link">
              All six collections <Icon name="arrow" size={16} />
            </Link>
          </div>
          <div className="collections-stack">
            {['nature-reimagined', 'abstract-forms', 'personal-memories'].map((id, i) => (
              <CollectionBlock key={id} c={COLLECTION_MAP[id]} products={products || []} index={i} compact />
            ))}
          </div>
        </div>
      </section>
      <BestsellerRail products={products} categories={categories} loading={loading} />
      <section className="section journal-home surface-cream">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="eyebrow">Inspiration journal</span>
              <h2 className="h2">
                Ideas for <em>better walls.</em>
              </h2>
            </div>
            <Link to="/journal" className="link">
              All articles <Icon name="arrow" size={16} />
            </Link>
          </div>
          <div className="journal-grid">
            {ARTICLES.slice(0, 3).map((a, i) => (
              <JournalCard key={a.slug} a={a} i={i} />
            ))}
          </div>
        </div>
      </section>
      <nav className="promises wrap" aria-label="Our promises">
        {PROMISES.map(([ic, label, to]) => (
          <Link key={label} to={to}>
            <Icon name={ic} size={18} /> {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
