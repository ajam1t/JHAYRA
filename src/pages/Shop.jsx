import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import Icon from '../components/Icon';
import Frame from '../components/Frame';
import TemplateCanvas from '../components/TemplateCanvas';
import { Seo } from '../lib/seo';
import { searchProducts, useCategories, useProducts } from '../lib/catalog';
import { useTemplates } from '../lib/templates';
import { BRAND } from '../lib/brand';
import { waLink } from '../lib/site';
import { ROOMS, ROOM_MAP } from '../lib/rooms';

const SORTS = [
  ['featured', 'Featured'],
  ['bestsellers', 'Bestsellers'],
  ['new', 'New arrivals'],
  ['rating', 'Top rated'],
  ['az', 'A → Z'],
];

function PersonaliseCard() {
  const { active } = useTemplates();
  const t = active.find((x) => x.group === 'couple-frame') || active[0];
  return (
    <Link to="/customize" className="promo-card">
      <div className="promo-art">
        {t && (
          <Frame ratio={{ w: 12, h: 16 }} colour="#B8932A" glare={false}>
            <TemplateCanvas template={t} mini />
          </Frame>
        )}
      </div>
      <span className="eyebrow">Make it yours</span>
      <b>Your photos, names & dates — designed live.</b>
      <span className="link">
        Personalise <Icon name="arrow" size={16} />
      </span>
    </Link>
  );
}

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const { data: products, loading } = useProducts();
  const { data: categories } = useCategories();
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'featured';
  const q = params.get('q') || '';
  const photo = params.get('photo') === '1';
  const room = ROOM_MAP[params.get('room')];

  const set = (k, v) => {
    const n = new URLSearchParams(params);
    if (v) n.set(k, v);
    else n.delete(k);
    setParams(n, { replace: true });
  };

  const usedCats = useMemo(() => {
    const counts = {};
    (products || []).forEach((p) => p.category && (counts[p.category] = (counts[p.category] || 0) + 1));
    return (categories || []).filter((c) => counts[c.slug]).map((c) => ({ ...c, count: counts[c.slug] }));
  }, [products, categories]);

  const list = useMemo(() => {
    let l = products || [];
    if (category) l = l.filter((p) => p.category === category);
    if (room) l = l.filter((p) => room.cats.includes(p.category));
    if (photo) l = l.filter((p) => p.customer_photo_eligible);
    if (q) l = searchProducts(l, q);
    else if (sort === 'bestsellers') l = [...l].sort((a, b) => b.is_bestseller - a.is_bestseller || (b.review_count || 0) - (a.review_count || 0));
    else if (sort === 'new') l = [...l].sort((a, b) => b.is_new_arrival - a.is_new_arrival);
    else if (sort === 'rating') l = [...l].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sort === 'az') l = [...l].sort((a, b) => a.name.localeCompare(b.name));
    return l;
  }, [products, category, photo, q, sort, room]);

  const cat = categories?.find((c) => c.slug === category);
  const title = q ? `Results for “${q}”` : cat ? cat.name : room ? `Wall art for your ${room.label.toLowerCase()}` : 'All frames & wall art';

  return (
    <>
      <Seo
        title={cat ? `${cat.name} Frames & Wall Art` : 'Shop Personalised Photo Frames & Wall Art'}
        description={cat?.description || `Shop handcrafted frames — spiritual, modern, nature, couple and family wall art. Free delivery across India. Since ${BRAND.since}.`}
        path={category ? `/shop?category=${category}` : room ? `/shop?room=${room.id}` : '/shop'}
        noindex={!!q}
      />
      <section className="page-hero shop-hero">
        <div className="wrap">
          <span className="eyebrow">Shop</span>
          <h1 className="h1">{title}</h1>
          <p className="lead">{cat?.description || room?.blurb || 'Handcrafted to order in India. Every design comes in four sizes and a choice of frame finishes — all delivered free.'}</p>
        </div>
      </section>
      <div className="filterbar">
        <div className="wrap">
          <div className="chips scroll" role="toolbar" aria-label="Filter by category">
            {ROOMS.map((r) => (
              <button key={r.id} className="chip chip-room" aria-pressed={room?.id === r.id} onClick={() => set('room', room?.id === r.id ? '' : r.id)}>
                {r.label}
              </button>
            ))}
            <span className="chip-sep" aria-hidden="true" />
            <button className="chip" aria-pressed={!category && !room} onClick={() => setParams({}, { replace: true })}>
              All <span className="chip-n">{products?.length || ''}</span>
            </button>
            {usedCats.map((c) => (
              <button key={c.slug} className="chip" aria-pressed={category === c.slug} onClick={() => set('category', category === c.slug ? '' : c.slug)}>
                {c.name} <span className="chip-n">{c.count}</span>
              </button>
            ))}
          </div>
          <div className="filter-row">
            <label className="toggle">
              <input type="checkbox" checked={photo} onChange={(e) => set('photo', e.target.checked ? '1' : '')} />
              <span />
              Can add my photo
            </label>
            <div className="row">
              {q && (
                <button className="chip on" onClick={() => set('q', '')}>
                  “{q}” <Icon name="close" size={14} />
                </button>
              )}
              <label className="sort">
                <span className="sr-only">Sort</span>
                <select className="select" value={sort} onChange={(e) => set('sort', e.target.value === 'featured' ? '' : e.target.value)}>
                  {SORTS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>
      <section className="section-sm">
        <div className="wrap">
          <p className="muted small" style={{ marginBottom: 18 }}>
            {loading ? 'Loading designs…' : `${list.length} design${list.length === 1 ? '' : 's'}`}
          </p>
          <div className="grid-products">
            {loading && Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)}
            {!loading &&
              list.map((p, i) => (
                <FragmentWithPromo key={p.id} show={i === 5 && !q}>
                  <ProductCard product={p} categories={categories} priority={i < 4} index={i} />
                </FragmentWithPromo>
              ))}
          </div>
          {!loading && list.length === 0 && (
            <div className="empty">
              <h2 className="h3">Nothing here yet</h2>
              <p className="muted" style={{ margin: '10px 0 22px' }}>
                Tell us what you're looking for — we can often make it.
              </p>
              <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-sm" onClick={() => setParams({})}>
                  Clear filters
                </button>
                <a className="btn btn-wa btn-sm" href={waLink(`Hi JHAYRA! I'm looking for: ${q || cat?.name || ''}`)} target="_blank" rel="noopener noreferrer">
                  Ask on WhatsApp
                </a>
              </div>
            </div>
          )}
          <p className="small muted" style={{ marginTop: 28 }}>
            ★ {BRAND.ratingSource}.
          </p>
        </div>
      </section>
    </>
  );
}

function FragmentWithPromo({ show, children }) {
  return (
    <>
      {children}
      {show && <PersonaliseCard />}
    </>
  );
}
