import { Link } from 'react-router-dom';
import Img from '../components/Img';
import Reveal from '../components/Reveal';
import { Seo } from '../lib/seo';
import { useCategories, useCollections, useProducts } from '../lib/catalog';

export default function Collections() {
  const { data: categories } = useCategories();
  const { data: products } = useProducts();
  const { data: featured } = useCollections();
  const cats = (categories || [])
    .map((c) => {
      const items = (products || []).filter((p) => p.category === c.slug);
      return { ...c, count: items.length, cover: (items.find((p) => p.is_bestseller) || items[0])?.thumbnail };
    })
    .filter((c) => c.count);
  return (
    <>
      <Seo title="Collections — Spiritual, Modern, Nature & Personalised Wall Art" description="Browse JHAYRA collections: religious and Vastu art, modern and abstract, nature, running horses, couple and family frames." path="/collections" />
      <section className="wrap page-hero">
        <span className="eyebrow">Collections</span>
        <h1 className="display" style={{ marginTop: 16 }}>
          Find your <em>wall’s story.</em>
        </h1>
      </section>
      {featured?.length > 0 && (
        <section className="wrap" style={{ paddingBottom: 56 }}>
          <div className="bento">
            {featured.map((c, i) => (
              <Reveal key={c.id} delay={i * 0.05} className={`bento-item b${i}`}>
                <Link to={c.link || '/shop'} className="bento-link">
                  <Img src={c.image_url} alt={c.alt_text || c.title} sizes="(max-width: 760px) 100vw, 40vw" width={900} />
                  <div className="bento-cap">
                    <small>{c.subtitle}</small>
                    <b>{c.title}</b>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}
      <section className="wrap" style={{ paddingBottom: 80 }}>
        <h2 className="h2" style={{ marginBottom: 24 }}>
          All categories
        </h2>
        <div className="cat-grid">
          {cats.map((c, i) => (
            <Reveal key={c.slug} delay={Math.min(i, 8) * 0.04}>
              <Link to={`/shop?category=${c.slug}`} className="cat">
                <div className="cat-img">{c.cover && <Img src={c.cover} alt="" sizes="(max-width: 760px) 50vw, 25vw" />}</div>
                <b>{c.name}</b>
                <small>
                  {c.count} design{c.count > 1 ? 's' : ''}
                </small>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
