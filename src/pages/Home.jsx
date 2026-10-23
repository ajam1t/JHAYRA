import { useMemo, useState } from 'react';
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
            <Frame ratio={{ w: 12, h: 16 }} colour="#B8932A" tilt mat>
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
                  <Frame ratio={{ w: 12, h: 16 }} colour="#B8932A" glare={false}>
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

/* ── Hero: a styled room with real bestsellers on the wall ─────────────── */
const ART_CATS = ['nature', 'personalized', 'modern-art', 'art-abstract', 'canvas', 'religious', 'home-vastu', 'running-horses'];
const WALL = Object.fromEntries(WALLS.map((w) => [w.id, w]));
const FINISH = ['#B8932A', '#1C1C1C', '#6B4423'];

function RoomHero({ products }) {
  const sets = useMemo(() => {
    const art = (products || []).filter((p) => p.thumbnail && ART_CATS.includes(p.category)).sort((a, b) => b.is_bestseller - a.is_bestseller);
    const out = [];
    for (let i = 0; i + 3 <= art.length && out.length < 4; i += 3) out.push(art.slice(i, i + 3));
    return out;
  }, [products]);
  const [n, setN] = useState(0);
  const set = sets[n % Math.max(1, sets.length)] || [];
  const frames = set.map((p, i) => ({ key: `${n}-${i}`, src: p.thumbnail, wIn: 12, hIn: 18, dxIn: (i - 1) * 14.5, dyIn: 0, colour: FINISH[n % 3] }));

  return (
    <section className="rh">
      <div className="rh-copy wrap">
        <span className="eyebrow">Since {BRAND.since} · {BRAND.homes} homes</span>
        <h1 className="display">
          Turn your moments into <em>timeless art.</em>
        </h1>
        <p className="lead">Premium wall art and personalised frames, handcrafted in India and delivered free — so your walls finally feel like you.</p>
        <div className="row rh-ctas">
          <Link to="/shop" className="btn btn-gold btn-lg">
            Explore collection <Icon name="arrow" size={18} />
          </Link>
          <Link to="/customize/photo" className="btn btn-ghost btn-lg">
            Frame your photo
          </Link>
        </div>
        <ul className="rh-trust">
          <li>
            <Icon name="sparkle" size={20} />
            <span>
              <b>Premium quality</b>Frames & prints
            </span>
          </li>
          <li>
            <Icon name="truck" size={20} />
            <span>
              <b>Free delivery</b>Across India
            </span>
          </li>
          <li>
            <Icon name="brush" size={20} />
            <span>
              <b>Personalised</b>Just for you
            </span>
          </li>
          <li>
            <Icon name="refresh" size={20} />
            <span>
              <b>Free replacement</b>If it arrives damaged
            </span>
          </li>
        </ul>
      </div>
      <div className="rh-room">
        <RoomScene wall={WALL.ivory} furniture="sofa" frames={frames} groupHeightIn={18} zoom={1.9} furnitureWidth={0.6} decor className="room-hero" />
        {sets.length > 1 && (
            <span className="rh-arrows rh-arrows-room">
              <button className="icon-btn" aria-label="Previous wall" onClick={() => setN((x) => (x + sets.length - 1) % sets.length)}>
                <Icon name="arrowL" size={18} />
              </button>
              <button className="icon-btn" aria-label="Next wall" onClick={() => setN((x) => (x + 1) % sets.length)}>
                <Icon name="arrow" size={18} />
              </button>
            </span>
          )}

        {set.length > 0 && (
          <div className="rh-tags">
            {set.map((p) => (
              <Link key={p.id} to={`/product/${p.id}`}>
                {p.name} <span>from {money(p.price)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Shop by room ─────────────────────────────────────────────────────── */
function ShopByRoom({ products }) {
  return (
    <section className="section-sm">
      <div className="wrap">
        <div className="rooms-rail">
          {ROOMS.map((r, i) => {
            const pick = (products || []).filter((p) => p.thumbnail && r.cats.includes(p.category)).slice(0, 2);
            const frames = pick.map((p, k) => ({ key: p.id, src: p.thumbnail, wIn: 9.5, hIn: 13, dxIn: pick.length > 1 ? (k ? 6 : -6) : 0, colour: FINISH[(i + k) % 3] }));
            return (
              <Reveal key={r.id} delay={i * 0.05}>
                <Link to={`/shop?room=${r.id}`} className="room-card">
                  <RoomScene wall={WALL[r.wall]} furniture={r.furniture} frames={frames} groupHeightIn={13} zoom={2.1} furnitureWidth={0.78} className="room-mini" />
                  <b>{r.label}</b>
                  <span className="link-sm">
                    Shop now <Icon name="arrow" size={14} />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Personalised wall art studio ─────────────────────────────────────── */
const STUDIO = [
  ['Single photo frame', '/customize/photo', 'single-photo'],
  ['Couple frame', '/customize?moment=anniversary', 'couple-frame'],
  ['Photo collage', '/customize?group=collage-frame', 'collage-frame'],
  ['Moon & stars', '/customize?moment=moon', 'moon-style'],
];

function Studio({ products }) {
  const { active } = useTemplates();
  const photo = (products || []).find((p) => p.category === 'love-romance' && p.thumbnail) || (products || []).find((p) => p.thumbnail);
  const couple = active.find((t) => t.group === 'couple-frame' && t.slots?.length === 1) || active.find((t) => t.slots?.length === 1);
  return (
    <section className="section studio-sec">
      <div className="wrap studio-grid">
        <div className="studio-copy">
          <span className="eyebrow">Our signature</span>
          <h2 className="h1" style={{ margin: '14px 0 16px' }}>
            Personalised <em>wall art studio.</em>
          </h2>
          <p className="lead">Turn your favourite photo into a framed keepsake. Add names, dates and a message, choose the size and finish, and see a live preview before you order.</p>
          <Link to="/customize" className="btn btn-lg" style={{ marginTop: 26 }}>
            Create your artwork <Icon name="arrow" size={18} />
          </Link>
        </div>
        <div className="studio-visual" aria-hidden="true">
          {photo && (
            <div className="studio-polaroid">
              <Img src={photo.thumbnail} alt="" sizes="200px" width={400} />
            </div>
          )}
          <span className="studio-arrow">
            <Icon name="arrow" size={26} />
          </span>
          <div className="studio-frame">
            {couple && (
              <Frame ratio={{ w: 12, h: 16 }} colour="#B8932A" mat tilt>
                <TemplateCanvas template={couple} photos={photo ? { [couple.slots[0].id]: photo.thumbnail } : {}} texts={{ name1: 'Aarav', name2: 'Ananya', name: 'Aarav & Ananya', date: '14 February 2024', msg: 'Forever starts here' }} />
              </Frame>
            )}
          </div>
        </div>
        <ul className="studio-opts">
          {STUDIO.map(([label, to, group]) => {
            const t = active.find((x) => x.group === group);
            return (
              <li key={label}>
                <Link to={to}>
                  <span className="studio-thumb">
                    {t && (
                      <Frame ratio={{ w: 12, h: 16 }} colour="#1C1C1C" glare={false} thickness={6}>
                        <TemplateCanvas template={t} mini />
                      </Frame>
                    )}
                  </span>
                  {label}
                  <Icon name="chevron" size={16} />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ── See it on your wall ──────────────────────────────────────────────── */
function WallBanner({ products }) {
  const p = (products || []).find((x) => x.is_bestseller && x.thumbnail);
  if (!p) return null;
  return (
    <section className="wall-banner surface-night">
      <div className="wrap wall-banner-grid">
        <div className="phone" aria-hidden="true">
          <div className="phone-screen">
            <RoomScene wall={WALL.sage} furniture="sofa" frames={[{ key: 'p', src: p.thumbnail, wIn: 18, hIn: 24, colour: '#B8932A' }]} zoom={2.2} furnitureWidth={0.8} className="room-phone" />
            <span className="phone-a4">A4</span>
            <span className="phone-shutter" />
          </div>
        </div>
        <div>
          <span className="eyebrow">Visualise</span>
          <h2 className="h1" style={{ margin: '14px 0 16px' }}>
            See it on <em>your wall.</em>
          </h2>
          <p className="lead">Point your phone at your wall and see any frame hanging there, at its real size — or try it in a room with your wall colour before you buy.</p>
          <Link to={`/product/${p.id}?view=room`} className="btn btn-light btn-lg" style={{ marginTop: 26 }}>
            Try the room visualiser <Icon name="arrow" size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const festival = useFestival();
  const { data: products, loading } = useProducts();
  const { data: categories } = useCategories();
  const featured = (products || []).filter((p) => p.homepage_visible || p.is_bestseller).slice(0, 8);

  return (
    <>
      <Seo
        title={festival ? `${festival.name} Gifts — Personalised Frames | JHAYRA` : 'JHAYRA — Personalised Photo Frames & Wall Art, Made in India'}
        description={festival ? festival.lead : 'Premium wall art and personalised photo frames, handcrafted in India since 2017. Shop by room, design your own, and see it on your wall. Free delivery across India.'}
        path="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'JHAYRA',
          url: SITE.url,
          logo: SITE.ogImage,
          foundingDate: String(BRAND.since),
          sameAs: [SITE.instagram],
          contactPoint: { '@type': 'ContactPoint', telephone: '+91-7070728989', contactType: 'customer service', availableLanguage: ['English', 'Hindi'] },
        }}
      />
      {festival ? <FestivalHero festival={festival} /> : <RoomHero products={products} />}
      {festival && <FestivalPicks festival={festival} products={products} categories={categories} />}
      <ShopByRoom products={products} />
      <Studio products={products} />
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2 className="h2">Bestsellers</h2>
              <p className="muted" style={{ marginTop: 8 }}>
                Our most-loved wall art, chosen by {BRAND.homes} happy homes.
              </p>
            </div>
            <Link to="/shop?sort=bestsellers" className="link">
              View all <Icon name="arrow" size={16} />
            </Link>
          </div>
          <div className="grid-products home-best">
            {loading
              ? Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)
              : featured.map((p, i) => <ProductCard key={p.id} product={p} categories={categories} index={i} room />)}
          </div>
          <p className="small muted" style={{ marginTop: 18 }}>
            ★ {BRAND.ratingSource}.
          </p>
        </div>
      </section>
      <WallBanner products={products} />
    </>
  );
}
