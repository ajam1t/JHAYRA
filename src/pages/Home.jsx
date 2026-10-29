import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Frame from '../components/Frame';
import Img from '../components/Img';
import Icon from '../components/Icon';
import Reveal from '../components/Reveal';
import RoomScene, { WALLS } from '../components/RoomScene';
import Particles from '../components/Particles';
import TemplateCanvas from '../components/TemplateCanvas';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import LazyMount from '../components/LazyMount';
import Monogram3D from '../components/Monogram3D';
import { Seo } from '../lib/seo';
import { useCategories, useFrameTables, useOptionSummary, useProducts } from '../lib/catalog';
import { COLLECTION_MAP, collectionProducts } from '../lib/collections';
import { useTemplates } from '../lib/templates';
import { ROOMS } from '../lib/rooms';
import { HOME_FAQ } from '../lib/faq';
import { useFestival } from '../state/festival';
import { useToast } from '../state/store';
import { daysUntil, orderBy } from '../lib/festivals';
import { money, SITE, waLink } from '../lib/site';
import { BRAND } from '../lib/brand';
import { COLOURS, MIN_PRICE, SIZES } from '../lib/frames';
import { photoHandoff, readPhoto } from '../lib/upload';

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

/* ── Hero: an interactive living room ────────────────────────────── */
const ART_CATS = ['nature', 'personalized', 'modern-art', 'art-abstract', 'canvas', 'religious', 'home-vastu', 'running-horses', 'photography'];
// Finishes every product is offered in (catalog fallback: black, gold, brown).
const HERO_FINISHES = ['Black', 'Gold', 'Brown'];
const GAP_IN = 3;
const HERO_FACTS = [
  ['truck', 'Free delivery', 'across India'],
  ['brush', 'Handcrafted', 'to order'],
  ['wall', '4 sizes,', '3 frame finishes'],
  ['lock', 'Secure', 'payments'],
];

function Hero({ products }) {
  const navigate = useNavigate();
  const toast = useToast();
  const art = useMemo(() => (products || []).filter((p) => p.thumbnail && ART_CATS.includes(p.category)).sort((a, b) => b.is_bestseller - a.is_bestseller), [products]);
  // Three slots on the wall; each remembers its own artwork, frame and size.
  const [slots, setSlots] = useState(null);
  const [sel, setSel] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const room = useRef(null);
  useEffect(() => {
    if (!slots && art.length >= 3) setSlots(art.slice(0, 3).map((p, i) => ({ key: `s${i}`, productId: p.id, photo: null, colour: 'Black', size: 'a3plus' })));
  }, [art, slots]);

  const list = slots || [];
  const sizeOf = (slug) => SIZES.find((x) => x.slug === slug) || SIZES[1];
  const prodOf = (s) => art.find((p) => p.id === s.productId);
  // True relative scale: zoom out when larger sizes are chosen so all three still fit.
  const totalW = list.reduce((a, s) => a + sizeOf(s.size).w, 0) + GAP_IN * Math.max(0, list.length - 1);
  const maxH = Math.max(18, ...list.map((s) => sizeOf(s.size).h));
  // Photo room (public/rooms/hero-living.webp, 1024×922): the sofa spans 84%
  // of the width and its back sits 61% down; frames hang just above it.
  const SOFA_W = 0.84;
  const ASPECT = 1024 / 922;
  const zoom = Math.min(1.7, 90 / Math.max(totalW, 1), 38 / maxH);
  const inH = (SOFA_W / 84) * zoom * ASPECT; // one inch as a share of the scene height
  const hangY = 0.56 - (maxH * inH) / 2;
  let x = -totalW / 2;
  const frames = list.map((s) => {
    const sz = sizeOf(s.size);
    const dx = x + sz.w / 2;
    x += sz.w + GAP_IN;
    const p = prodOf(s);
    return { key: s.key, src: s.photo?.url || p?.thumbnail, wIn: sz.w, hIn: sz.h, dxIn: dx, y: Math.max(0.08, hangY + ((maxH - sz.h) * inH) / 2), colour: COLOURS[s.colour].hex, hotspot: `Change ${s.photo ? 'your photo' : p?.name || 'artwork'}` };
  });
  const cur = list.find((s) => s.key === sel);
  const curP = cur && prodOf(cur);
  const curSize = cur && sizeOf(cur.size);
  const set = (patch) => setSlots((l) => l.map((s) => (s.key === sel ? { ...s, ...patch } : s)));

  const onPhoto = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const photo = await readPhoto(file);
      if (photo.noPreview) throw new Error('This photo type can’t be previewed here — open the studio to use it.');
      set({ photo });
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setBusy(false);
    }
  };
  const frameMyPhoto = () => {
    photoHandoff.set(cur.photo);
    navigate('/customize/photo');
  };

  // Slight depth on scroll: desktop only, never with reduced motion.
  useEffect(() => {
    const el = room.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce), (max-width: 899px)').matches) return;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate3d(0, ${Math.min(window.scrollY, 700) * 0.06}px, 0)`;
      });
    };
    window.addEventListener('scroll', on, { passive: true });
    return () => {
      window.removeEventListener('scroll', on);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="gh sf-hero mesh" aria-label="Welcome to JHAYRA">
      <div className="gh-copy wrap">
        <h1 className="gh-title sf-hero-title">
          <Kinetic text="Your Home." />{' '}
          <em>
            <Kinetic text="Your Story." start={2} />
          </em>
        </h1>
        <p className="lead sf-in" style={{ '--d': '.25s' }}>
          Wall art and personalised frames that make your spaces feel unmistakably yours. Tap any frame on the wall to try a different artwork, frame, size — or your own photo.
        </p>
        <div className="sf-hero-act">
          <div className="row gh-ctas sf-in" style={{ '--d': '.32s' }}>
            <Link to="/shop" className="btn btn-gold btn-lg sheen">
              Shop Wall Art <Icon name="arrow" size={18} />
            </Link>
            <Link to="/customize" className="btn btn-ghost btn-lg">
              Create Your Own
            </Link>
          </div>
          <Monogram3D className="sf-hero-3d sf-in" />
        </div>
        <ul className="hx-facts sf-in" style={{ '--d': '.4s' }}>
          {HERO_FACTS.map(([ic, a, b]) => (
            <li key={a}>
              <Icon name={ic} size={20} />
              <span>
                {a}
                <br />
                {b}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="gh-room">
        <div className="hs-head hx-head wrap">
          <h2 className="hs-title">Interactive Wall Art Studio</h2>
        </div>
        <div className={`hx-stage ${cur ? 'editing' : ''}`}>
          <div className="gh-room-inner" ref={room}>
            <RoomScene photo="/rooms/hero-living.webp" furniture="sofa" frames={frames} zoom={zoom} furnitureWidth={SOFA_W} tone="gallery" selected={sel} onFrameClick={(k) => setSel((s) => (s === k ? null : k))} className="room-hero" />
          </div>
          <div className="gh-hud">
            <span className="gh-hint glass">{cur ? 'Style this frame' : 'Tap any artwork on the wall'}</span>
          </div>
        </div>
        {cur && (
          <div className="hx-panel glass" role="dialog" aria-label="Style this frame">
            <div className="hx-top">
              <div className="grow">
                <small>{cur.photo ? 'Your photo' : curP?.category?.replace(/-/g, ' ')}</small>
                <b>{cur.photo ? 'Your memory, framed' : curP?.name}</b>
                <span>
                  {curSize.dimensions} · {cur.colour.toLowerCase()} frame · <strong>{money(curSize.price)}</strong>
                </span>
              </div>
              <button className="icon-btn" onClick={() => setSel(null)} aria-label="Close">
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="hx-row" role="group" aria-label="Artwork">
              <span className="hx-lab">Artwork</span>
              <div className="hx-thumbs">
                <button type="button" className={`hx-thumb hx-own ${cur.photo ? 'on' : ''}`} onClick={() => fileRef.current?.click()} aria-label="Preview your own photo" disabled={busy}>
                  {cur.photo ? <img src={cur.photo.url} alt="" /> : <Icon name="camera" size={18} />}
                  <span>{busy ? '…' : 'Your photo'}</span>
                </button>
                {art.slice(0, 14).map((p) => (
                  <button key={p.id} type="button" className={`hx-thumb ${!cur.photo && cur.productId === p.id ? 'on' : ''}`} aria-pressed={!cur.photo && cur.productId === p.id} aria-label={p.name} onClick={() => set({ productId: p.id, photo: null })}>
                    <Img src={p.thumbnail} alt="" sizes="52px" width={120} />
                  </button>
                ))}
              </div>
            </div>
            <div className="hx-row" role="radiogroup" aria-label="Frame">
              <span className="hx-lab">Frame</span>
              <div className="hx-chips">
                {HERO_FINISHES.map((c) => (
                  <button key={c} type="button" role="radio" aria-checked={cur.colour === c} className="hx-swatch" onClick={() => set({ colour: c })}>
                    <span style={{ background: COLOURS[c].hex }} />
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="hx-row" role="radiogroup" aria-label="Size">
              <span className="hx-lab">Size</span>
              <div className="hx-chips">
                {SIZES.map((z) => (
                  <button key={z.slug} type="button" role="radio" aria-checked={cur.size === z.slug} className="hx-size" onClick={() => set({ size: z.slug })}>
                    <b>{z.name}</b>
                    <small>{money(z.price)}</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="hx-actions">
              {cur.photo ? (
                <button type="button" className="btn btn-gold btn-sm" onClick={frameMyPhoto}>
                  Frame this photo <Icon name="arrow" size={15} />
                </button>
              ) : (
                curP && (
                  <Link to={`/product/${curP.id}?size=${cur.size}`} className="btn btn-gold btn-sm">
                    View &amp; buy <Icon name="arrow" size={15} />
                  </Link>
                )
              )}
              {curP && !cur.photo && (
                <Link to={`/visualise?p=${curP.id}`} className="btn btn-ghost btn-sm">
                  On my wall
                </Link>
              )}
            </div>
            <p className="hx-note">Frames hang to scale against an 84-inch sofa. Your photo stays on this device until you order.</p>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => (onPhoto(e.target.files?.[0]), (e.target.value = ''))} />
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Shop by category: A4 framed artwork in the real frame colours ─────── */
// Colours shown are those the category's products are actually offered in
// (product_options), using the frame_colours table for names and shades.
const FRAME_ORDER = ['black', 'gold', 'brown', 'natural', 'white', 'silver'];
const FRAME_LABEL = { brown: 'Wood', natural: 'Natural wood' };

function CategoryCard({ c, colours, i }) {
  const [sel, setSel] = useState(colours[0]?.slug);
  const cur = colours.find((x) => x.slug === sel) || colours[0];
  return (
    <article className="hc-card" style={{ '--i': i }}>
      <Link to={`/shop?category=${c.slug}`} className="hc-link">
        <span className="hc-hang">
          <span className="hc-wire" aria-hidden="true" />
          <span className="hc-stage" key={cur?.slug}>
            <Frame src={c.img} alt={`${c.name} wall art in a ${cur?.name.toLowerCase() || 'black'} frame`} ratio={{ w: 9.5, h: 13 }} colour={cur?.hex || '#1C1C1C'} thickness={4} glare sizes="(max-width: 760px) 34vw, 12vw" />
          </span>
        </span>
        <span className="hc-name">{c.name}</span>
        <small className="hc-n">
          {c.n} design{c.n > 1 ? 's' : ''}
        </small>
      </Link>
      {colours.length > 1 && (
        <div className="hc-swatches" role="radiogroup" aria-label={`${c.name} frame colour`}>
          {colours.map((x) => (
            <button key={x.slug} type="button" role="radio" aria-checked={x.slug === cur?.slug} aria-label={`${FRAME_LABEL[x.slug] || x.name} frame`} title={FRAME_LABEL[x.slug] || x.name} style={{ '--sw': x.hex }} onClick={() => setSel(x.slug)} />
          ))}
        </div>
      )}
    </article>
  );
}

function ShopByCategory({ products, categories }) {
  const { data: opts } = useOptionSummary();
  const { data: tables } = useFrameTables();
  const art = (products || []).filter((p) => p.thumbnail);
  const hexOf = Object.fromEntries((tables?.colours || []).map((c) => [c.slug, c]));
  const cats = (categories || [])
    .map((c) => {
      const items = art.filter((p) => p.category === c.slug);
      const pick = items.find((p) => p.is_bestseller) || items[0];
      if (!pick) return null;
      const slugs = new Set(items.flatMap((p) => opts?.[p.dbId]?.colourSlugs || []));
      if (!slugs.size) ['black', 'gold', 'brown'].forEach((x) => slugs.add(x));
      const colours = FRAME_ORDER.filter((x) => slugs.has(x)).map((x) => ({ slug: x, name: hexOf[x]?.name || x, hex: hexOf[x]?.hex || COLOURS[x[0].toUpperCase() + x.slice(1)]?.hex || '#1C1C1C' }));
      return { slug: c.slug, name: c.name, img: pick.thumbnail, n: items.length, colours };
    })
    .filter(Boolean)
    .sort((a, b) => b.n - a.n)
    .slice(0, 10);
  if (!cats.length) return <div style={{ minHeight: 420 }} />;
  return (
    <section className="hs hs-cats">
      <div className="wrap">
        <div className="hs-head">
          <h2 className="hs-title">Shop by Category</h2>
          <Link to="/shop" className="hs-all">
            View all <Icon name="arrow" size={14} />
          </Link>
        </div>
        <div className="hs-scroll hc-row">
          {cats.map((c, i) => (
            <CategoryCard key={c.slug} c={c} colours={c.colours} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Shop by room: real interior photographs ─────────────────────────── */
// Photos: Unsplash and Pexels (free for commercial use), cropped in public/rooms.
const ROOM_CARDS = [
  ['living', 'Living Room', 'Make a statement'],
  ['bedroom', 'Bedroom', 'Calm and cozy vibes'],
  ['dining', 'Dining Room', 'Elevate every meal'],
  ['office', 'Office', 'Stay inspired'],
  ['entryway', 'Entryway', 'A warm first impression'],
];
function ShopByRoom() {
  return (
    <section className="hs hs-rooms">
      <div className="wrap">
        <div className="hs-head">
          <h2 className="hs-title">Shop by Room</h2>
          <Link to="/room-inspiration" className="hs-all">
            View all <Icon name="arrow" size={14} />
          </Link>
        </div>
        <div className="hs-scroll hs-room-row">
          {ROOM_CARDS.map(([id, title, line]) => (
            <Link key={id} to={`/shop?room=${id}`} className="hs-room">
              <div className="hs-room-scene">
                <img src={`/rooms/${id}.webp`} alt={`${title} styled with framed wall art`} width="900" height="611" loading="lazy" decoding="async" />
              </div>
              <span className="hs-room-label">
                <b>{title}</b>
                <small>{line}</small>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Featured collections: editorial cards, words left, art right ──────── */
const FEATURED = [
  ['nature-reimagined', 'Nature’s', 'Beauty'],
  ['minimalist-living', 'Modern', 'Minimal'],
  ['abstract-forms', 'Abstract', 'Forms'],
  ['divine', 'Spiritual', '& Divine'],
];
function FeaturedCollections({ products }) {
  const list = products || [];
  const cards = FEATURED.map(([id, a, b]) => {
    if (id === 'divine') {
      const p = list.find((x) => x.thumbnail && x.category === 'religious' && x.is_bestseller) || list.find((x) => x.thumbnail && x.category === 'religious');
      return { id, a, b, story: 'Devotional art that brings peace within — for the pooja room and beyond.', to: '/worlds/divine', img: p?.thumbnail };
    }
    const c = COLLECTION_MAP[id];
    const p = collectionProducts(c, list).find((x) => x.thumbnail);
    return { id, a, b, story: c.story, to: `/collections/${id}`, img: p?.thumbnail };
  });
  return (
    <section className="hs hs-feat">
      <div className="wrap">
        <div className="hs-head">
          <h2 className="hs-title">Featured Collections</h2>
          <Link to="/collections" className="hs-all">
            View all <Icon name="arrow" size={14} />
          </Link>
        </div>
        <div className="hs-scroll hs-feat-row">
          {cards.map((c, i) => (
            <Link key={c.id} to={c.to} className={`hs-fc t${i}`}>
              <span className="hs-fc-copy">
                <b>
                  {c.a}
                  <br />
                  {c.b}
                </b>
                <small>{c.story}</small>
                <span className="hs-fc-go">
                  Shop now <Icon name="arrow" size={14} />
                </span>
              </span>
              <span className="hs-fc-art">{c.img && <Frame src={c.img} alt="" ratio={{ w: 12, h: 16 }} colour="#1C1C1C" glare={false} sizes="(max-width: 760px) 34vw, 12vw" />}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Custom art: an animated walk-through of photo → framed art ─────────── */
const CS_STEPS = [
  ['upload', 'Upload a photo', 'Any phone photo — we check it will print sharp.'],
  ['brush', 'Choose a style', 'Original, monochrome, vintage or pencil sketch.'],
  ['type', 'Add names & a date', 'Set in our typography, exactly as you type.'],
  ['wall', 'We frame & deliver', 'Handcrafted to order, delivered free across India.'],
];
const CS_STYLES = [
  ['Original', 'none'],
  ['Monochrome', 'grayscale(1) contrast(1.08)'],
  ['Vintage', 'sepia(0.55) saturate(0.85) contrast(0.95) brightness(1.04)'],
  ['Pencil sketch', 'grayscale(1) contrast(1.6) brightness(1.15)'],
];
function CustomStudio() {
  const [step, setStep] = useState(0);
  const [style, setStyle] = useState(0);
  const [live, setLive] = useState(false);
  const [paused, setPaused] = useState(false);
  const box = useRef(null);
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Play only while the section is on screen.
  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (reduce) return setStep(3);
    if (!live || paused) return;
    const t = setTimeout(() => setStep((x) => (x + 1) % 4), step === 3 ? 3600 : 2600);
    return () => clearTimeout(t);
  }, [step, live, paused, reduce]);
  // While on "Choose a style", flick through the looks.
  useEffect(() => {
    if (step !== 1 || reduce) return setStyle(step === 0 ? 0 : 2);
    setStyle(0);
    const t = setInterval(() => setStyle((x) => (x + 1) % CS_STYLES.length), 620);
    return () => clearInterval(t);
  }, [step, reduce]);
  return (
    <div className="cs" ref={box} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="cs-copy">
        <p>Turn your photos, special places and meaningful moments into framed wall art. The preview is exactly what we print.</p>
        <ol className="cs-steps">
          {CS_STEPS.map(([ic, t, d], i) => (
            <li key={t} className={i === step ? 'on' : i < step ? 'done' : ''}>
              <button type="button" onClick={() => (setStep(i), setPaused(true))} aria-current={i === step ? 'step' : undefined}>
                <span className="cs-n">{i < step ? <Icon name="check" size={14} stroke={2.2} /> : i + 1}</span>
                <span>
                  <b>{t}</b>
                  <small>{d}</small>
                </span>
                <span className="cs-bar" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
        <Link to="/customize/photo" className="btn btn-gold btn-lg sheen">
          Create Your Custom Art <Icon name="arrow" size={18} />
        </Link>
      </div>
      <div className={`cs-stage s${step}`} aria-hidden="true">
        <span className="cs-glow" />
        <div className="cs-upload">
          <Icon name="upload" size={18} />
          <span>
            our-day.jpg <i />
          </span>
        </div>
        <div className="cs-art">
          <div className="cs-mat">
            <div className="cs-photo">
              <img src="/samples/couple-2.webp" alt="" loading="lazy" width="560" height="560" style={{ filter: CS_STYLES[style][1] }} />
              <span className="cs-crop" />
            </div>
            <div className="cs-caption">
              <b>Aarav &amp; Ananya</b>
              <small>14 · 02 · 2024</small>
            </div>
          </div>
        </div>
        <div className="cs-chips">
          {CS_STYLES.map(([n], i) => (
            <span key={n} className={i === style ? 'on' : ''}>
              {n}
            </span>
          ))}
        </div>
        <div className="cs-badge">
          <Icon name="truck" size={15} /> Framed &amp; delivered free
        </div>
      </div>
    </div>
  );
}

/* ── Custom art + customer ratings ──────────────────────────────────────── */
function CustomAndReviews({ products }) {
  const rated = (products || []).filter((p) => p.thumbnail && p.rating && p.review_count);
  const total = rated.reduce((a, p) => a + p.review_count, 0);
  const avg = total ? rated.reduce((a, p) => a + p.rating * p.review_count, 0) / total : 0;
  const top = [...rated].sort((a, b) => b.rating - a.rating || b.review_count - a.review_count).slice(0, 3);
  return (
    <section className="hs hs-duo">
      <div className="wrap hs-duo-grid">
        <div>
          <div className="hs-head">
            <h2 className="hs-title">Custom Art for Your Story</h2>
            <Link to="/customize" className="hs-all">
              Create yours <Icon name="arrow" size={14} />
            </Link>
          </div>
          <CustomStudio />
        </div>
        <div>
          <div className="hs-head">
            <h2 className="hs-title">What Our Customers Say</h2>
          </div>
          <div className="hs-reviews rv">
            {total > 0 ? (
              <>
                <div className="rv-score">
                  <svg className="rv-ring" viewBox="0 0 120 120" aria-hidden="true">
                    <circle cx="60" cy="60" r="52" className="rv-track" />
                    <circle cx="60" cy="60" r="52" className="rv-fill" style={{ '--v': avg / 5 }} />
                  </svg>
                  <span className="rv-num">
                    <b>{avg.toFixed(1)}</b>
                    <small>out of 5</small>
                  </span>
                </div>
                <div className="rv-stars" aria-label={`Average ${avg.toFixed(1)} out of 5`}>
                  <span style={{ '--pct': `${(avg / 5) * 100}%` }}>★★★★★</span>
                </div>
                <p className="rv-sub">
                  from <b>{total.toLocaleString('en-IN')}</b> product ratings · trusted by <b>{BRAND.homes}</b> homes since {BRAND.since}
                </p>
                <div className="rv-fan">
                  {top.map((p, k) => (
                    <Link key={p.id} to={`/product/${p.id}`} className="rv-card" style={{ '--k': k - 1 }}>
                      <Frame src={p.thumbnail} alt={p.name} ratio={{ w: 12, h: 16 }} colour="#1C1C1C" glare={false} sizes="(max-width: 760px) 30vw, 130px" />
                      <span className="rv-badge">★ {Number(p.rating).toFixed(1)}</span>
                      <span className="rv-name">{p.name}</span>
                    </Link>
                  ))}
                </div>
                <small className="rv-note">Top-rated designs</small>
              </>
            ) : (
              <p className="muted">Ratings appear here as customers review their frames.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Bestsellers & trending ────────────────────────────────────────── */
function Bestsellers({ products }) {
  const { data: opts } = useOptionSummary();
  // Bestsellers, most-reviewed first.
  const items = useMemo(() => (products || []).filter((p) => p.thumbnail && p.is_bestseller).sort((a, b) => (b.review_count || 0) - (a.review_count || 0)).slice(0, 8), [products]);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const drag = useRef(null);
  const n = items.length;
  const go = (d) => setI((x) => (x + d + n) % n);
  useEffect(() => {
    if (n < 2 || paused || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 4200);
    return () => clearInterval(t);
  }, [n, paused]);
  if (!n) return <div style={{ minHeight: 520 }} />;
  const cur = items[i % n];
  const o = opts?.[cur.dbId];
  return (
    <section className="section sf-best bf" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="wrap">
        <div className="hs-head">
          <h2 className="hs-title">Bestsellers</h2>
          <Link to="/shop?sort=bestsellers" className="hs-all">
            View all <Icon name="arrow" size={14} />
          </Link>
        </div>
        <div
          className="bf-stage"
          role="region"
          aria-roledescription="carousel"
          aria-label="Bestsellers"
          onPointerDown={(e) => {
            drag.current = e.clientX;
            setPaused(true);
          }}
          onPointerUp={(e) => {
            if (drag.current == null) return;
            const dx = e.clientX - drag.current;
            drag.current = null;
            if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') go(1);
            if (e.key === 'ArrowLeft') go(-1);
          }}
        >
          <span className="bf-spot" aria-hidden="true" />
          {items.map((p, k) => {
            let d = k - i;
            if (d > n / 2) d -= n;
            if (d < -n / 2) d += n;
            const hidden = Math.abs(d) > 2;
            return (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className={`bf-card ${d === 0 ? 'on' : ''}`}
                style={{ '--d': d, '--ad': Math.abs(d) }}
                aria-hidden={d !== 0}
                tabIndex={d === 0 ? 0 : -1}
                draggable="false"
                onClick={(e) => {
                  if (d !== 0) {
                    e.preventDefault();
                    setI(k);
                  }
                }}
                hidden={hidden}
              >
                <Frame src={p.thumbnail} alt={d === 0 ? p.name : ''} ratio={{ w: 12, h: 16 }} colour="#1C1C1C" glare sizes="(max-width: 760px) 56vw, 280px" />
              </Link>
            );
          })}
        </div>
        <div className="bf-info" aria-live="polite">
          <span className="bf-count">
            {String(i + 1).padStart(2, '0')} <i>/</i> {String(n).padStart(2, '0')}
          </span>
          <small>{cur.category?.replace(/-/g, ' ')}</small>
          <h3 key={cur.id}>{cur.name}</h3>
          <p>
            {cur.rating ? (
              <>
                <span className="bf-stars">★</span> {Number(cur.rating).toFixed(1)} · {cur.review_count?.toLocaleString('en-IN')} ratings ·{' '}
              </>
            ) : null}
            from <b>{money(cur.price)}</b>
            {o?.sizes ? ` · ${o.sizes} sizes` : ''}
          </p>
          <div className="bf-ctl">
            <button type="button" className="icon-btn" aria-label="Previous bestseller" onClick={() => (go(-1), setPaused(true))}>
              <Icon name="arrowL" size={18} />
            </button>
            <Link to={`/product/${cur.id}`} className="btn btn-gold sheen">
              View this frame <Icon name="arrow" size={16} />
            </Link>
            <button type="button" className="icon-btn" aria-label="Next bestseller" onClick={() => (go(1), setPaused(true))}>
              <Icon name="arrow" size={18} />
            </button>
          </div>
          <div className="bf-dots" aria-hidden="true">
            {items.map((p, k) => (
              <span key={p.id} className={k === i ? 'on' : ''} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── FAQ (WAI-ARIA accordion: buttons, regions, arrow keys) ───────── */
function Faq() {
  const [open, setOpen] = useState(-1);
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

/* ── Final call to action ─────────────────────────────────────────── */
export default function Home() {
  const festival = useFestival();
  const { data: products, loading } = useProducts();
  const { data: categories } = useCategories();

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
      <ShopByCategory products={products} categories={categories} />
      <LazyMount minHeight={420}>
        <ShopByRoom />
      </LazyMount>
      <LazyMount minHeight={360}>
        <FeaturedCollections products={products} />
      </LazyMount>
      <LazyMount minHeight={520}>
        <CustomAndReviews products={products} />
      </LazyMount>
      <LazyMount minHeight={900}>
        <Bestsellers products={products} />
      </LazyMount>
      <Faq />
    </>
  );
}
