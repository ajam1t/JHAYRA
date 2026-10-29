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
import { useCategories, useOptionSummary, useProducts } from '../lib/catalog';
import { COLLECTION_MAP, collectionProducts } from '../lib/collections';
import CampaignBanner from '../components/CampaignBanner';
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
  const zoom = Math.min(1.9, 118 / Math.max(totalW, 1), 52 / maxH);
  let x = -totalW / 2;
  const frames = list.map((s) => {
    const sz = sizeOf(s.size);
    const dx = x + sz.w / 2;
    x += sz.w + GAP_IN;
    const p = prodOf(s);
    return { key: s.key, src: s.photo?.url || p?.thumbnail, wIn: sz.w, hIn: sz.h, dxIn: dx, colour: COLOURS[s.colour].hex, hotspot: `Change ${s.photo ? 'your photo' : p?.name || 'artwork'}` };
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
        <div className="gh-room-inner" ref={room}>
          <RoomScene wall={WALL.porcelain} furniture="sofa" frames={frames} groupHeightIn={maxH} zoom={zoom} furnitureWidth={0.6} decor tone="gallery" selected={sel} onFrameClick={(k) => setSel((s) => (s === k ? null : k))} className="room-hero" />
        </div>
        <div className="gh-hud">
          <span className="gh-hint glass">{cur ? 'Style this frame' : 'Tap any artwork on the wall'}</span>
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

/* ── Shop by category: round artwork thumbnails from live categories ──── */
function ShopByCategory({ products, categories }) {
  const art = (products || []).filter((p) => p.thumbnail);
  const cats = (categories || [])
    .map((c) => {
      const items = art.filter((p) => p.category === c.slug);
      const pick = items.find((p) => p.is_bestseller) || items[0];
      return pick && { slug: c.slug, name: c.name, img: pick.thumbnail, n: items.length };
    })
    .filter(Boolean)
    .sort((a, b) => b.n - a.n)
    .slice(0, 11);
  if (!cats.length) return <div style={{ minHeight: 220 }} />;
  const items = [...cats.slice(0, 6), { slug: 'custom', name: 'Custom Art', img: '/samples/couple-1.webp', to: '/customize' }, ...cats.slice(6)];
  return (
    <section className="hs hs-cats">
      <div className="wrap">
        <div className="hs-head">
          <h2 className="hs-title">Shop by Category</h2>
          <Link to="/shop" className="hs-all">
            View all <Icon name="arrow" size={14} />
          </Link>
        </div>
        <div className="hs-scroll hs-cat-row">
          {items.map((c) => (
            <Link key={c.slug} to={c.to || `/shop?category=${c.slug}`} className="hs-cat">
              <span className="hs-cat-img">
                <Img src={c.img} alt="" sizes="120px" width={260} />
              </span>
              <span className="hs-cat-name">{c.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Shop by room: warm room scenes that fill each card ─────────────────── */
// [room, title, line, frames [w, h] in inches, furniture width share, art zoom, art centre height]
const ROOM_CARDS = [
  ['living', 'Living Room', 'Make a statement', [[12, 16], [12, 16]], 0.8, 1.75, 0.255],
  ['bedroom', 'Bedroom', 'Calm and cozy vibes', [[18, 24]], 0.76, 1.15, 0.26],
  ['dining', 'Dining Room', 'Elevate every meal', [[18, 24]], 0.8, 1.15, 0.31],
  ['office', 'Office', 'Stay inspired', [[9.5, 13], [9.5, 13]], 0.46, 1.95, 0.245],
  ['pooja', 'Pooja & Vastu', 'A sacred corner', [[12, 16]], 0.44, 1.65, 0.255],
];
function ShopByRoom({ products }) {
  const art = (products || []).filter((p) => p.thumbnail);
  // Each card shows different pieces from its room's categories.
  const used = new Set();
  const pick = (cats, n) => {
    const pool = art.filter((p) => cats.includes(p.category) && !used.has(p.id));
    const out = pool.slice(0, n);
    out.forEach((p) => used.add(p.id));
    return out;
  };
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
          {ROOM_CARDS.map(([id, title, line, sizes, fw, zoom, y]) => {
            const r = ROOMS.find((x) => x.id === id);
            const items = pick(r.cats, sizes.length);
            const gap = 2.5;
            const total = sizes.reduce((t, [w]) => t + w, 0) + gap * (sizes.length - 1);
            let x = -total / 2;
            const frames = sizes.map(([w, h], k) => {
              const dx = x + w / 2;
              x += w + gap;
              return { key: `${id}${k}`, src: items[k]?.thumbnail, wIn: w, hIn: h, dxIn: dx, y, colour: '#1C1C1C', thickness: 3 };
            });
            return (
              <Link key={id} to={`/shop?room=${id}`} className="hs-room">
                <div className="hs-room-scene">
                  <RoomScene wall={WALL.ivory} furniture={r.furniture} frames={frames} zoom={zoom} furnitureWidth={fw} decor tone="gallery" className="room-mini" />
                </div>
                <span className="hs-room-label">
                  <b>{title}</b>
                  <small>{line}</small>
                </span>
              </Link>
            );
          })}
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

/* ── Brand benefits (each one stated in our policies) ───────────────────── */
const BENEFITS = [
  ['shield', 'Premium materials', 'PS moulding, HD print, front sheet'],
  ['brush', 'Handcrafted to order', 'Made in India, one at a time'],
  ['box', 'Packed securely', 'Quality-checked before dispatch'],
  ['truck', 'Free delivery', 'Across India, 5–7 business days'],
  ['lock', 'Secure payments', 'UPI, cards, netbanking'],
];
function Benefits() {
  return (
    <section className="hs-benefits" aria-label="Why shop with JHAYRA">
      <ul className="wrap">
        {BENEFITS.map(([ic, a, b]) => (
          <li key={a}>
            <Icon name={ic} size={26} stroke={1.4} />
            <span>
              <b>{a}</b>
              <small>{b}</small>
            </span>
          </li>
        ))}
      </ul>
    </section>
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
        <div className="hs-custom">
          <div className="hs-custom-copy">
            <span className="hs-kick">Make it personal</span>
            <h2 className="hs-title">Custom Art for Your Story</h2>
            <p>Turn your photos, special places or meaningful moments into framed wall art. Upload, choose a style, add names or a date — the preview is exactly what we print.</p>
            <ol className="hs-custom-steps">
              <li>
                <Icon name="upload" size={16} /> Upload a photo
              </li>
              <li>
                <Icon name="brush" size={16} /> Choose a style
              </li>
              <li>
                <Icon name="wall" size={16} /> We frame &amp; deliver
              </li>
            </ol>
            <Link to="/customize/photo" className="btn btn-gold sheen">
              Create Your Custom Art <Icon name="arrow" size={16} />
            </Link>
          </div>
          <div className="hs-custom-art" aria-hidden="true">
            <span className="hs-polaroid">
              <img src="/samples/couple-2.webp" alt="" loading="lazy" width="300" height="300" />
              <i>Your photo</i>
            </span>
            <Icon name="arrow" size={22} />
            <span className="hs-custom-frame">
              <Frame src="/samples/couple-2.webp" alt="" ratio={{ w: 12, h: 16 }} colour="#1C1C1C" mat glare sizes="160px" />
            </span>
          </div>
        </div>
        <div className="hs-reviews">
          <h2 className="hs-title">What Our Customers Say</h2>
          {total > 0 ? (
            <>
              <div className="hs-score">
                <b>{avg.toFixed(1)}</b>
                <span>
                  <span className="hs-stars" aria-hidden="true">
                    ★★★★★
                  </span>
                  <small>Average from {total.toLocaleString('en-IN')} product ratings</small>
                </span>
              </div>
              <ul className="hs-toprated">
                {top.map((p) => (
                  <li key={p.id}>
                    <Link to={`/product/${p.id}`}>
                      <span className="hs-tr-img">
                        <Frame src={p.thumbnail} alt="" ratio={{ w: 12, h: 16 }} colour="#1C1C1C" glare={false} sizes="(max-width: 760px) 28vw, 120px" />
                      </span>
                      <b>{p.name}</b>
                      <small>
                        ★ {Number(p.rating).toFixed(1)} · {p.review_count.toLocaleString('en-IN')}
                      </small>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="muted">Ratings appear here as customers review their frames.</p>
          )}
          <p className="hs-since">
            Trusted by {BRAND.homes} homes since {BRAND.since}.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── Bestsellers & trending ────────────────────────────────────────── */
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

/* ── FAQ (WAI-ARIA accordion: buttons, regions, arrow keys) ───────── */
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

/* ── Final call to action ─────────────────────────────────────────── */
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
          <span className="deco deco-light" aria-hidden="true" />
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
      <CampaignBanner />
      <ShopByCategory products={products} categories={categories} />
      <LazyMount minHeight={420}>
        <ShopByRoom products={products} />
      </LazyMount>
      <LazyMount minHeight={360}>
        <FeaturedCollections products={products} />
      </LazyMount>
      <Benefits />
      <LazyMount minHeight={520}>
        <CustomAndReviews products={products} />
      </LazyMount>
      <LazyMount minHeight={900}>
        <Bestsellers products={products} categories={categories} loading={loading} />
      </LazyMount>
      <Faq />
      <FinalCta />
    </>
  );
}
