import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import Icon from '../components/Icon';
import Frame from '../components/Frame';
import Img from '../components/Img';
import TemplateCanvas from '../components/TemplateCanvas';
import LazyMount from '../components/LazyMount';
import { Magnetic, Motion, SmoothTabs, Story, Tilt, morph, ripple, useParallax } from '../components/Motion';
import { Seo } from '../lib/seo';
import { searchProducts, useCategories, useFrameTables, useOptionSummary, useProducts } from '../lib/catalog';
import { useTemplates } from '../lib/templates';
import { BRAND } from '../lib/brand';
import { money, waLink } from '../lib/site';
import { SIZES, COLOURS } from '../lib/frames';
import { ROOMS, ROOM_MAP } from '../lib/rooms';
import { useShop } from '../state/store';

const SORTS = [
  ['featured', 'Featured'],
  ['bestsellers', 'Bestsellers'],
  ['new', 'New arrivals'],
  ['rating', 'Top rated'],
  ['az', 'A → Z'],
];
// Styles and moods group the shop's existing categories (and name words).
const STYLES = [
  ['spiritual', 'Spiritual', ['religious', 'home-vastu']],
  ['modern', 'Modern & abstract', ['modern-art', 'art-abstract', 'canvas']],
  ['nature', 'Nature & calm', ['nature', 'photography']],
  ['love', 'Love & family', ['love-romance', 'wedding', 'family', 'baby-kids', 'occasions']],
  ['spirited', 'Bold & spirited', ['running-horses', 'animals-pets']],
  ['words', 'Words & quotes', ['quotes']],
];
const MOODS = [
  ['calm', 'Calm', '🌿', ['nature', 'photography', 'canvas'], ['sea', 'sunrise', 'mountain', 'lotus']],
  ['joyful', 'Joyful', '☀', ['occasions', 'baby-kids', 'animals-pets', 'family'], []],
  ['devotional', 'Devotional', '🪔', ['religious', 'home-vastu'], []],
  ['romantic', 'Romantic', '❤', ['love-romance', 'wedding'], []],
  ['bold', 'Bold', '⚡', ['running-horses', 'modern-art', 'art-abstract'], []],
  ['thoughtful', 'Thoughtful', '✎', ['quotes'], []],
];
// Price follows size (every design starts at the same price), so a budget
// selects the sizes that fit it.
const PRICES = [
  ['u1000', 'Under ₹1,000', (p) => p < 1000],
  ['1000-2000', '₹1,000 – ₹2,000', (p) => p >= 1000 && p <= 2000],
  ['2000', '₹2,000 and above', (p) => p > 2000],
];
const ROOM_PHOTOS = { living: 'living', bedroom: 'bedroom', dining: 'dining', office: 'office', entryway: 'entryway' };
const FILTER_KEYS = ['room', 'category', 'style', 'mood', 'size', 'price', 'finish', 'orient', 'photo', 'q'];
const words = (p) => p.name.toLowerCase().split(/[^a-z]+/);

/* ── Filters ─────────────────────────────────────────────────────────────── */
function useFilters(params, products, opts, tables) {
  const f = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || '']));
  const sort = params.get('sort') || 'featured';
  const sizes = tables?.sizes?.length ? tables.sizes.map((s) => ({ slug: s.slug, name: s.name, price: +s.base_price })) : SIZES.map((s) => ({ slug: s.slug, name: s.name, price: s.price }));
  const priceFn = PRICES.find(([k]) => k === f.price)?.[2];
  // Sizes a product may be shown in, given the size and budget filters.
  const okSizes = sizes.filter((s) => (!f.size || s.slug === f.size) && (!priceFn || priceFn(s.price)));
  const list = useMemo(() => {
    let l = (products || []).filter((p) => p.thumbnail);
    const room = ROOM_MAP[f.room];
    const style = STYLES.find(([k]) => k === f.style);
    const mood = MOODS.find(([k]) => k === f.mood);
    if (f.category) l = l.filter((p) => p.category === f.category);
    if (room) l = l.filter((p) => room.cats.includes(p.category));
    if (style) l = l.filter((p) => style[2].includes(p.category));
    if (mood) l = l.filter((p) => mood[3].includes(p.category) || mood[4].some((k) => words(p).includes(k)));
    if (f.photo === '1' || f.orient === 'landscape') l = l.filter((p) => p.customer_photo_eligible);
    if (f.finish) l = l.filter((p) => !opts?.[p.dbId]?.colourSlugs?.length || opts[p.dbId].colourSlugs.includes(f.finish));
    if (f.size || f.price) l = l.filter((p) => okSizes.some((s) => !opts?.[p.dbId]?.sizeSlugs?.length || opts[p.dbId].sizeSlugs.includes(s.slug)));
    if (f.q) l = searchProducts(l, f.q);
    else if (sort === 'bestsellers') l = [...l].sort((a, b) => b.is_bestseller - a.is_bestseller || (b.review_count || 0) - (a.review_count || 0));
    else if (sort === 'new') l = [...l].sort((a, b) => b.is_new_arrival - a.is_new_arrival);
    else if (sort === 'rating') l = [...l].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sort === 'az') l = [...l].sort((a, b) => a.name.localeCompare(b.name));
    return l;
  }, [products, opts, params]); // eslint-disable-line react-hooks/exhaustive-deps
  const active = FILTER_KEYS.filter((k) => f[k]);
  return { f, sort, sizes, okSizes, list, active };
}

function FilterSheet({ f, set, clear, count, categories, usedCats, sizes, finishes, onClose }) {
  const panel = useRef(null);
  useEffect(() => {
    panel.current?.focus();
    const key = (e) => e.key === 'Escape' && onClose();
    addEventListener('keydown', key);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      removeEventListener('keydown', key);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  const group = (title, key, items) => (
    <fieldset className="fs-group">
      <legend>{title}</legend>
      <div className="fs-chips">
        {items.map(([v, l, n]) => (
          <button key={v} type="button" className={`fs-chip m-ripple ${f[key] === v ? 'on' : ''}`} aria-pressed={f[key] === v} onClick={(e) => (ripple(e), set(key, f[key] === v ? '' : v))}>
            {l}
            {n ? <small>{n}</small> : null}
          </button>
        ))}
      </div>
    </fieldset>
  );
  return createPortal(
    <div className="fs" role="dialog" aria-modal="true" aria-label="Filter and sort">
      <div className="scrim" onClick={onClose} />
      <div className="fs-panel m-morph" ref={panel} tabIndex={-1}>
        <div className="fs-head">
          <h2>Filter</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close filters">
            <Icon name="close" />
          </button>
        </div>
        <div className="fs-body">
          <label className="toggle fs-photo">
            <input type="checkbox" checked={f.photo === '1'} onChange={(e) => set('photo', e.target.checked ? '1' : '')} />
            <span />
            Personalise with my photo
          </label>
          {group('Room', 'room', ROOMS.map((r) => [r.id, r.label]))}
          {group('Category', 'category', usedCats.map((c) => [c.slug, c.name, c.count]))}
          {group('Style', 'style', STYLES.map(([v, l]) => [v, l]))}
          {group('Mood', 'mood', MOODS.map(([v, l, e]) => [v, `${e} ${l}`]))}
          {group('Price', 'price', PRICES.map(([v, l]) => [v, l]))}
          {group('Size', 'size', sizes.map((s) => [s.slug, `${s.name} · ${money(s.price)}`]))}
          {group('Frame finish', 'finish', finishes.map((c) => [c.slug, c.name]))}
          {group('Orientation', 'orient', [
            ['portrait', 'Portrait'],
            ['landscape', 'Landscape (with your photo)'],
          ])}
        </div>
        <div className="fs-foot">
          <button type="button" className="btn btn-ghost" onClick={clear}>
            Clear all
          </button>
          <button type="button" className="btn m-ripple" onClick={(e) => (ripple(e), onClose())}>
            Show {count} design{count === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Sections ────────────────────────────────────────────────────────────── */
// Round "story" bubbles: quick room filters with real interior photos.
function RoomBubbles({ current, onPick }) {
  return (
    <div className="sh-bubbles" role="group" aria-label="Shop by room">
      {ROOMS.map((r, i) => (
        <button key={r.id} type="button" className={`sh-bubble ${current === r.id ? 'on' : ''}`} style={{ '--i': i }} aria-pressed={current === r.id} onClick={() => onPick(r.id)}>
          <span className="sh-bubble-ring">{ROOM_PHOTOS[r.id] ? <img src={`/rooms/${ROOM_PHOTOS[r.id]}.webp`} alt="" loading="lazy" decoding="async" width="120" height="120" /> : <Icon name={r.id === 'pooja' ? 'temple' : 'users'} size={22} />}</span>
          <small>{r.label}</small>
        </button>
      ))}
    </div>
  );
}

// A salon-style hang of real artworks for the shop's opening view.
function SalonWall({ products }) {
  const art = (products || []).filter((p) => p.thumbnail && p.is_bestseller).slice(0, 5);
  if (art.length < 5) return <div className="sh-salon" aria-hidden="true" />;
  // Balanced hang: one centre line, largest in the middle, even gaps.
  const spots = [
    [14, 1.3, 1],
    [18, 1.32, 0],
    [24, 1.33, 2],
    [18, 1.32, 3],
    [14, 1.3, 4],
  ];
  return (
    <div className="sh-salon" aria-label="A few of our bestsellers">
      {spots.map(([w, r, j], i) => {
        const p = art[j];
        return (
          <Link key={p.id} to={`/product/${p.id}`} className="sh-salon-f m-float" style={{ width: `${w}%`, animationDelay: `${i * -1.3}s`, '--i': i }} aria-label={p.name}>
            <Frame src={p.thumbnail} alt="" ratio={{ w: 12, h: 12 * r }} colour={i === 2 ? '#b08a45' : i === 1 || i === 3 ? '#1C1C1C' : '#6b4a2b'} glare={false} sizes="(max-width: 760px) 26vw, 180px" priority={i === 2} />
          </Link>
        );
      })}
    </div>
  );
}

// Category index: each tile is a mini collage of the category's own artwork.
function CategoryIndex({ products, usedCats, onPick }) {
  const by = {};
  (products || []).forEach((p) => p.thumbnail && (by[p.category] ||= []).push(p));
  const all = usedCats.filter((c) => (by[c.slug] || []).length).sort((a, b) => b.count - a.count);
  const [more, setMore] = useState(false);
  const cats = more ? all : all.slice(0, 6);
  return (
    <section className="hs sh-index">
      <div className="wrap">
        <div className="hs-head">
          <h2 className="hs-title">The Category Index</h2>
          <Link to="/collections" className="hs-all">
            Collections <Icon name="arrow" size={14} />
          </Link>
        </div>
        <Motion type="up" stagger className="sh-index-grid">
          {cats.map((c, i) => {
            const t = by[c.slug].sort((a, b) => b.is_bestseller - a.is_bestseller).slice(0, 3);
            return (
              <button key={c.slug} type="button" className="sh-tile m-glow" style={{ '--i': i }} onClick={() => onPick(c.slug)}>
                <span className={`sh-tile-mosaic n${t.length}`}>
                  {t.map((p) => (
                    <Img key={p.id} src={p.thumbnail} alt="" sizes="(max-width: 760px) 30vw, 160px" width={320} />
                  ))}
                </span>
                <span className="sh-tile-t">
                  <b>{c.name}</b>
                  <small>
                    {c.count} design{c.count > 1 ? 's' : ''}
                  </small>
                </span>
              </button>
            );
          })}
        </Motion>
        {all.length > 6 && (
          <div className="center" style={{ marginTop: 14 }}>
            <button type="button" className="btn btn-ghost btn-sm m-ripple" onClick={(e) => (ripple(e), morph(() => setMore((m) => !m)))} aria-expanded={more}>
              {more ? 'Show fewer' : `Show all ${all.length} categories`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function StyleExplorer({ products }) {
  const [st, setSt] = useState(STYLES[0][0]);
  const style = STYLES.find(([k]) => k === st);
  const items = (products || []).filter((p) => p.thumbnail && style[2].includes(p.category)).slice(0, 4);
  return (
    <section className="hs sh-styles">
      <div className="wrap">
        <div className="hs-head">
          <h2 className="hs-title">Shop by Style</h2>
          <Link to={`/shop?style=${st}#catalogue`} className="hs-all">
            Shop {style[1].toLowerCase()} <Icon name="arrow" size={14} />
          </Link>
        </div>
        <SmoothTabs tabs={STYLES.map(([v, l]) => [v, l])} value={st} onChange={(v) => morph(() => setSt(v))} label="Art styles" />
        <div className="sh-style-grid" key={st}>
          {items.map((p, i) => (
            <Link key={p.id} to={`/product/${p.id}`} className="sh-style-item m-glow" style={{ '--i': i }}>
              <Frame src={p.thumbnail} alt={p.name} ratio={{ w: 12, h: 16 }} colour="#1C1C1C" glare={false} sizes="(max-width: 760px) 22vw, 140px" />
              <small>{p.name}</small>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Moods({ current, onPick }) {
  return (
    <section className="hs sh-moods">
      <div className="wrap">
        <div className="hs-head">
          <h2 className="hs-title">Find Art by Mood</h2>
        </div>
        <Motion type="up" stagger className="sh-mood-row">
          {MOODS.map(([v, l, e], i) => (
            <button key={v} type="button" className={`sh-mood m-ripple ${current === v ? 'on' : ''}`} style={{ '--i': i }} aria-pressed={current === v} onClick={(ev) => (ripple(ev), onPick(v))}>
              <span aria-hidden="true">{e}</span>
              {l}
            </button>
          ))}
        </Motion>
      </div>
    </section>
  );
}

function Trending({ products, categories, opts }) {
  const [tab, setTab] = useState('best');
  const all = (products || []).filter((p) => p.thumbnail);
  const lists = {
    best: all.filter((p) => p.is_bestseller).sort((a, b) => (b.review_count || 0) - (a.review_count || 0)),
    new: all.filter((p) => p.is_new_arrival),
    rated: [...all].filter((p) => p.rating).sort((a, b) => b.rating - a.rating || (b.review_count || 0) - (a.review_count || 0)),
  };
  const tabs = [
    ['best', 'Bestsellers'],
    ['new', 'New arrivals'],
    ['rated', 'Top rated'],
  ].filter(([k]) => lists[k].length);
  const items = (lists[tab] || []).slice(0, 8);
  if (!tabs.length) return null;
  return (
    <section className="hs sh-trend">
      <div className="wrap">
        <div className="hs-head">
          <h2 className="hs-title">Bestsellers & Trending</h2>
          <Link to={`/shop?sort=${tab === 'best' ? 'bestsellers' : tab === 'new' ? 'new' : 'rating'}#catalogue`} className="hs-all">
            View all <Icon name="arrow" size={14} />
          </Link>
        </div>
        <SmoothTabs tabs={tabs} value={tab} onChange={(v) => morph(() => setTab(v))} label="Trending" />
        <div className="hs-scroll sh-rail" key={tab}>
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} categories={categories} index={i} options={opts?.[p.dbId]} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Three bestsellers hung together on a real room photo.
function ShopTheLook({ products }) {
  const wall = useRef(null);
  useParallax(wall, 0.05);
  const art = (products || []).filter((p) => p.thumbnail);
  // One piece from each group, bestsellers first.
  const best = (cats) => art.filter((p) => cats.includes(p.category)).sort((a, b) => b.is_bestseller - a.is_bestseller || (b.review_count || 0) - (a.review_count || 0))[0];
  const look = [best(['nature', 'photography']), best(['religious', 'home-vastu']), best(['art-abstract', 'modern-art', 'canvas'])].filter(Boolean);
  if (look.length < 3) return null;
  const spots = [
    [31, 22, 13],
    [50, 15, 17],
    [69, 22, 13],
  ];
  return (
    <section className="hs sh-look">
      <div className="wrap">
        <div className="hs-head">
          <h2 className="hs-title">Shop the Look</h2>
          <Link to={`/visualise?p=${look[1].id}`} className="hs-all">
            Try on my wall <Icon name="arrow" size={14} />
          </Link>
        </div>
        <div className="sh-look-box">
          <div className="sh-look-room" ref={wall}>
            <img src="/rooms/hero-living.webp" alt="A living room styled with three JHAYRA frames above the sofa" loading="lazy" decoding="async" width="1024" height="922" className="m-parallax" />
            {look.map((p, i) => (
              <Link key={p.id} to={`/product/${p.id}`} className="sh-look-frame m-float" style={{ left: `${spots[i][0]}%`, top: `${spots[i][1]}%`, width: `${spots[i][2]}%`, animationDelay: `${i * -2}s` }} aria-label={p.name}>
                <Tilt max={10}>
                  <Frame src={p.thumbnail} alt="" ratio={{ w: 12, h: 18 }} colour="#1C1C1C" glare={false} sizes="(max-width: 760px) 20vw, 140px" />
                </Tilt>
                <span className="sh-look-dot">{i + 1}</span>
              </Link>
            ))}
          </div>
          <ol className="sh-look-list">
            {look.map((p, i) => (
              <li key={p.id}>
                <span className="sh-look-n">{i + 1}</span>
                <Link to={`/product/${p.id}`} className="sh-look-thumb">
                  <Img src={p.thumbnail} alt="" sizes="56px" width={160} />
                </Link>
                <span className="sh-look-info">
                  <Link to={`/product/${p.id}`}>
                    <b>{p.name}</b>
                  </Link>
                  <small>
                    from {money(p.price)} ·{' '}
                    <Link to={`/visualise?p=${p.id}`} className="link">
                      See it on my wall
                    </Link>
                  </small>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function RecentlyViewed({ products, categories, opts }) {
  const { recent } = useShop();
  const items = recent.map((id) => (products || []).find((p) => p.id === id)).filter((p) => p?.thumbnail).slice(0, 8);
  if (items.length < 2) return null;
  return (
    <section className="hs sh-recent">
      <div className="wrap">
        <div className="hs-head">
          <h2 className="hs-title">Recently Viewed</h2>
        </div>
        <div className="hs-scroll sh-rail">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} categories={categories} index={i} options={opts?.[p.dbId]} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PersonalisePromo() {
  const { active } = useTemplates();
  const t = active.find((x) => x.group === 'couple-frame') || active[0];
  return (
    <section className="hs sh-promo">
      <div className="wrap">
        <Motion type="scale" className="sh-promo-box">
          <div className="sh-promo-art m-float">
            {t && (
              <Frame ratio={{ w: 12, h: 16 }} colour="#1C1C1C" glare={false}>
                <TemplateCanvas template={t} mini />
              </Frame>
            )}
          </div>
          <div className="sh-promo-copy">
            <span className="ev-kick" style={{ color: '#7e5f26' }}>
              Personalised art
            </span>
            <h2 className="hs-title">
              Your photo, <em>beautifully framed.</em>
            </h2>
            <Story
              steps={[
                ['Upload a photo', 'Any phone photo — we check it will print sharp.'],
                ['Choose a design', '150+ layouts for names, dates and moments.'],
                ['We frame & deliver', 'Handcrafted to order, delivered free across India.'],
              ]}
            />
            <div className="row" style={{ gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
              <Magnetic>
                <Link to="/customize/photo" className="btn btn-gold sheen">
                  Frame my photo <Icon name="arrow" size={16} />
                </Link>
              </Magnetic>
              <Link to="/customize" className="btn btn-ghost">
                Browse designs
              </Link>
            </div>
          </div>
        </Motion>
      </div>
    </section>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function Shop() {
  const [params, setParams] = useSearchParams();
  const { data: products, loading } = useProducts();
  const { data: categories } = useCategories();
  const { data: opts } = useOptionSummary();
  const { data: tables } = useFrameTables();
  const { f, sort, sizes, okSizes, list, active } = useFilters(params, products, opts, tables);
  const [sheet, setSheet] = useState(false);
  const [shown, setShown] = useState(24);
  const [big, setBig] = useState(() => {
    try {
      return localStorage.getItem('jh_grid') === 'big';
    } catch {
      return false;
    }
  });
  const toggleGrid = (v) => {
    morph(() => setBig(v));
    try {
      localStorage.setItem('jh_grid', v ? 'big' : 'small');
    } catch {}
  };
  const catRef = useRef(null);
  const landing = !active.length;

  const set = (k, v) => {
    const n = new URLSearchParams(params);
    if (v) n.set(k, v);
    else n.delete(k);
    morph(() => setParams(n, { replace: true }));
  };
  const clear = () => {
    const n = new URLSearchParams();
    if (params.get('sort')) n.set('sort', params.get('sort'));
    morph(() => setParams(n, { replace: true }));
  };
  const toCatalogue = () => catRef.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  useEffect(() => setShown(24), [params]);
  // Links like /shop?room=living#catalogue land on the results.
  useEffect(() => {
    if (location.hash === '#catalogue' && !loading) setTimeout(toCatalogue, 60);
  }, [loading, params]); // eslint-disable-line react-hooks/exhaustive-deps

  const usedCats = useMemo(() => {
    const counts = {};
    (products || []).forEach((p) => p.category && (counts[p.category] = (counts[p.category] || 0) + 1));
    return (categories || []).filter((c) => counts[c.slug]).map((c) => ({ ...c, count: counts[c.slug] }));
  }, [products, categories]);
  const finishes = useMemo(() => {
    const slugs = new Set(Object.values(opts || {}).flatMap((o) => o.colourSlugs || []));
    const rows = (tables?.colours || []).filter((c) => !slugs.size || slugs.has(c.slug));
    return rows.length ? rows.map((c) => ({ slug: c.slug, name: c.name, hex: c.hex })) : Object.entries(COLOURS).map(([n, c]) => ({ slug: c.slug, name: n, hex: c.hex }));
  }, [opts, tables]);

  const cat = categories?.find((c) => c.slug === f.category);
  const room = ROOM_MAP[f.room];
  const label = (k) => {
    const v = f[k];
    if (k === 'category') return cat?.name || v;
    if (k === 'room') return room?.label || v;
    if (k === 'style') return STYLES.find(([s]) => s === v)?.[1];
    if (k === 'mood') return MOODS.find(([s]) => s === v)?.[1];
    if (k === 'price') return PRICES.find(([s]) => s === v)?.[1];
    if (k === 'size') return sizes.find((s) => s.slug === v)?.name;
    if (k === 'finish') return `${finishes.find((c) => c.slug === v)?.name || v} frame`;
    if (k === 'orient') return v === 'landscape' ? 'Landscape' : 'Portrait';
    if (k === 'photo') return 'With my photo';
    if (k === 'q') return `“${v}”`;
    return v;
  };
  const frame = finishes.find((c) => c.slug === f.finish);
  const showSize = f.size || f.price ? okSizes[0] : null;
  const title = f.q ? `Results for “${f.q}”` : cat ? cat.name : room ? `Wall art for your ${room.label.toLowerCase()}` : null;

  return (
    <>
      <Seo
        title={cat ? `${cat.name} Frames & Wall Art` : 'Shop Wall Art & Personalised Frames'}
        description={cat?.description || `Find art that feels like you — shop handcrafted wall art by room, style and mood, in four sizes and three frame finishes. Free delivery across India. Since ${BRAND.since}.`}
        path={f.category ? `/shop?category=${f.category}` : room ? `/shop?room=${room.id}` : '/shop'}
        noindex={!!f.q}
      />
      <section className={`sh-intro ${landing ? 'sh-intro-land' : ''}`}>
        <div className="wrap sh-intro-grid">
          <div>
            {landing && <span className="sh-eyebrow">The JHAYRA gallery</span>}
            <Motion as="h1" type="blur" className="sh-title">
              {title || (
                <>
                  Find Art That <em>Feels Like You.</em>
                </>
              )}
            </Motion>
            {(cat?.description || room?.blurb) && (
              <Motion as="p" type="fade" delay={0.1} className="sh-lead">
                {cat?.description || room?.blurb}
              </Motion>
            )}
            <form
              className="sh-search"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                const v = new FormData(e.currentTarget).get('q').trim();
                set('q', v);
                if (v) setTimeout(toCatalogue, 80);
              }}
            >
              <Icon name="search" size={18} />
              <input name="q" defaultValue={f.q} key={f.q} placeholder="Search Ganesha, horses, wedding…" aria-label="Search wall art" enterKeyHint="search" />
              <button type="submit" className="m-ripple" onClick={ripple}>
                Search
              </button>
            </form>
          </div>
          {landing && <SalonWall products={products} />}
        </div>
        <div className="wrap">
          <RoomBubbles current={f.room} onPick={(id) => (set('room', f.room === id ? '' : id), setTimeout(toCatalogue, 80))} />
        </div>
      </section>

      {landing && (
        <>
          <CategoryIndex products={products} usedCats={usedCats} onPick={(slug) => (set('category', slug), setTimeout(toCatalogue, 80))} />
          <LazyMount minHeight={320}>
            <StyleExplorer products={products} />
          </LazyMount>
          <LazyMount minHeight={460}>
            <Trending products={products} categories={categories} opts={opts} />
          </LazyMount>
          <LazyMount minHeight={180}>
            <Moods current={f.mood} onPick={(v) => (set('mood', v), setTimeout(toCatalogue, 80))} />
          </LazyMount>
          <LazyMount minHeight={420}>
            <ShopTheLook products={products} />
          </LazyMount>
        </>
      )}
      <RecentlyViewed products={products} categories={categories} opts={opts} />

      <section className="sh-cat" id="catalogue" ref={catRef}>
        <div className="sh-bar">
          <div className="wrap sh-bar-in">
            <button type="button" className="sh-bar-btn m-ripple" onClick={(e) => (ripple(e), setSheet(true))} aria-haspopup="dialog">
              <Icon name="filter" size={17} /> Filter{active.filter((k) => k !== 'q').length ? <span className="sh-badge">{active.filter((k) => k !== 'q').length}</span> : null}
            </button>
            <label className="sh-bar-sort">
              <span className="sr-only">Sort</span>
              <Icon name="chevronD" size={15} />
              <select value={sort} onChange={(e) => set('sort', e.target.value === 'featured' ? '' : e.target.value)}>
                {SORTS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className={`sh-bar-chip m-ripple ${f.photo === '1' ? 'on' : ''}`} aria-pressed={f.photo === '1'} onClick={(e) => (ripple(e), set('photo', f.photo === '1' ? '' : '1'))}>
              <Icon name="camera" size={15} /> Photo
            </button>
            <span className="sh-view" role="group" aria-label="Grid size">
              <button type="button" aria-pressed={!big} aria-label="More per row" onClick={() => toggleGrid(false)}>
                <Icon name="grid" size={16} />
              </button>
              <button type="button" aria-pressed={big} aria-label="Bigger pictures" onClick={() => toggleGrid(true)}>
                <Icon name="square" size={16} />
              </button>
            </span>
            <span className="sh-count" aria-live="polite">
              {loading ? 'Loading…' : `${list.length} design${list.length === 1 ? '' : 's'}`}
            </span>
          </div>
        </div>
        <div className="wrap">
          {!landing && (
            <div className="sh-active">
              {active.map((k) => (
                <button key={k} type="button" className="sh-active-chip" onClick={() => set(k, '')} aria-label={`Remove filter ${label(k)}`}>
                  {label(k)} <Icon name="close" size={13} />
                </button>
              ))}
              <button type="button" className="link small" onClick={clear}>
                Clear all
              </button>
            </div>
          )}
          {landing && <h2 className="hs-title sh-all-title">All Wall Art</h2>}
          <div className={`grid-products sh-grid ${big ? 'big' : ''}`}>
            {loading && Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)}
            {!loading &&
              list.slice(0, shown).map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  categories={categories}
                  priority={!landing && i < 4}
                  index={i}
                  options={opts?.[p.dbId]}
                  frame={frame}
                  price={showSize?.price}
                  priceNote={showSize ? `· ${showSize.name}` : null}
                  query={showSize ? `?size=${showSize.slug}` : ''}
                />
              ))}
          </div>
          {!loading && list.length > shown && (
            <div className="center" style={{ marginTop: 24 }}>
              <button type="button" className="btn btn-ghost m-ripple" onClick={(e) => (ripple(e), setShown((n) => n + 24))}>
                Show more <span className="muted small">({list.length - shown} more)</span>
              </button>
            </div>
          )}
          {!loading && list.length === 0 && (
            <div className="empty">
              <h2 className="h3">Nothing matches — yet</h2>
              <p className="muted" style={{ margin: '10px 0 22px' }}>
                Try fewer filters, or tell us what you're looking for — we can often make it.
              </p>
              <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-sm" onClick={clear}>
                  Clear filters
                </button>
                <a className="btn btn-wa btn-sm" href={waLink(`Hi JHAYRA! I'm looking for: ${f.q || cat?.name || ''}`)} target="_blank" rel="noopener noreferrer">
                  Ask on WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      <LazyMount minHeight={360}>
        <PersonalisePromo />
      </LazyMount>

      {sheet && <FilterSheet f={f} set={set} clear={clear} count={list.length} categories={categories} usedCats={usedCats} sizes={sizes} finishes={finishes} onClose={() => setSheet(false)} />}
    </>
  );
}
