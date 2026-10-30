import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import Frame from '../components/Frame';
import Img from '../components/Img';
import Icon from '../components/Icon';
import Reveal from '../components/Reveal';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import { Seo } from '../lib/seo';
import { useCategories, useProducts } from '../lib/catalog';
import { COLLECTIONS, COLLECTION_MAP, collectionProducts } from '../lib/collections';
import { money } from '../lib/site';

/** One collection as an art-directed block: tone + layout give it its own identity. */
export function CollectionBlock({ c, products, index = 0, compact = false }) {
  const items = useMemo(() => collectionProducts(c, products).filter((p) => p.thumbnail), [c, products]);
  if (!items.length) return null;
  const from = Math.min(...items.map((p) => p.price || 499));
  const shown = items.slice(0, c.layout === 'mosaic' ? 4 : 3);
  return (
    <Reveal className={`cblock tone-${c.tone} lay-${c.layout} ${index % 2 ? 'flip' : ''} ${compact ? 'compact' : ''}`}>
      <div className="cblock-copy">
        <span className="cblock-n">{String(index + 1).padStart(2, '0')}</span>
        <span className="eyebrow">{c.kicker}</span>
        <h2 className="h2">{c.title}</h2>
        <p>{c.story}</p>
        <span className="cblock-meta">
          {items.length} pieces · from {money(from)}
        </span>
        <Link to={`/collections/${c.id}`} className="btn btn-ghost">
          Explore {c.title} <Icon name="arrow" size={16} />
        </Link>
      </div>
      <div className="cblock-art">
        {shown.map((p, i) => (
          <Link key={p.id} to={`/product/${p.id}`} className={`cblock-piece p${i}`} aria-label={`${p.name}, from ${money(p.price)}`}>
            <Frame src={p.thumbnail} alt={p.name} ratio={{ w: 12, h: i === 0 && c.layout === 'feature' ? 16 : 15 }} colour="#1C1C1C" glare={false} sizes="(max-width: 760px) 45vw, 22vw" />
            <span className="cblock-cap">
              {p.name} <em>{money(p.price)}</em>
            </span>
          </Link>
        ))}
      </div>
    </Reveal>
  );
}

function Index() {
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const cats = (categories || [])
    .map((c) => {
      const items = (products || []).filter((p) => p.category === c.slug);
      return { ...c, count: items.length, cover: (items.find((p) => p.is_bestseller) || items[0])?.thumbnail };
    })
    .filter((c) => c.count);
  return (
    <>
      <Seo title="Collections — Curated Wall Art" description="Nature Reimagined, Abstract Forms, Minimalist Living, Botanical Stories, Personal Memories and Art for Gifting — curated JHAYRA wall art in black frames." path="/collections" />
      <section className="wrap page-hero">
        <span className="eyebrow">Curated collections</span>
        <h1 className="display" style={{ marginTop: 16, maxWidth: '13ch' }}>
          Six ways to <em>tell your story.</em>
        </h1>
      </section>
      <section className="wrap collections-stack">
        {COLLECTIONS.map((c, i) => (
          <CollectionBlock key={c.id} c={c} products={products} index={i} />
        ))}
      </section>
      <section className="wrap" style={{ padding: '40px var(--gutter) 90px' }}>
        <h2 className="h2" style={{ marginBottom: 24 }}>
          Every category
        </h2>
        <div className="cat-grid">
          {cats.map((c) => (
            <Link key={c.slug} to={`/shop/${c.slug}`} className="cat">
              <div className="cat-img">{c.cover && <Img src={c.cover} alt="" sizes="(max-width: 760px) 50vw, 25vw" />}</div>
              <b>{c.name}</b>
              <small>
                {c.count} design{c.count > 1 ? 's' : ''}
              </small>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function Detail({ c }) {
  const { data: products, loading } = useProducts();
  const { data: categories } = useCategories();
  const items = useMemo(() => collectionProducts(c, products || []), [c, products]);
  return (
    <>
      <Seo title={`${c.title} — Wall Art Collection`} description={c.story} path={`/collections/${c.id}`} />
      <section className={`collection-hero tone-${c.tone}`}>
        <div className="wrap">
          <Link to="/collections" className="crumbs" style={{ display: 'inline-flex' }}>
            <Icon name="arrowL" size={15} /> All collections
          </Link>
          <span className="eyebrow">{c.kicker}</span>
          <h1 className="display">{c.title}</h1>
          <p className="lead">{c.story}</p>
          {c.personal && (
            <Link to="/customize" className="btn btn-gold" style={{ marginTop: 22 }}>
              Personalise with your photos <Icon name="arrow" size={16} />
            </Link>
          )}
        </div>
      </section>
      <section className="wrap section-sm">
        <p className="muted small" style={{ marginBottom: 18 }}>
          {loading ? 'Loading…' : `${items.length} pieces`}
        </p>
        <div className="grid-products">
          {loading ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />) : items.map((p, i) => <ProductCard key={p.id} product={p} categories={categories} index={i} room />)}
        </div>
        <div className="collection-more">
          {COLLECTIONS.filter((x) => x.id !== c.id)
            .slice(0, 3)
            .map((x) => (
              <Link key={x.id} to={`/collections/${x.id}`} className={`collection-chip tone-${x.tone}`}>
                <small>{x.kicker}</small>
                <b>{x.title}</b>
              </Link>
            ))}
        </div>
      </section>
    </>
  );
}

export default function Collections() {
  const { id } = useParams();
  if (!id) return <Index />;
  const c = COLLECTION_MAP[id];
  if (!c)
    return (
      <div className="wrap section center">
        <h1 className="h2">Collection not found</h1>
        <Link to="/collections" className="btn" style={{ marginTop: 20 }}>
          All collections
        </Link>
      </div>
    );
  return <Detail c={c} />;
}
