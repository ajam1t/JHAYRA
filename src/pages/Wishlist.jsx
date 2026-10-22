import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { Seo } from '../lib/seo';
import { useCategories, useProducts } from '../lib/catalog';
import { useShop } from '../state/store';
import { waLink, SITE } from '../lib/site';

export default function Wishlist() {
  const { wish } = useShop();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const list = wish.map((id) => products?.find((p) => p.id === id)).filter(Boolean);
  const share = waLink(`My JHAYRA wishlist 💛\n${list.map((p) => `${p.name}: ${SITE.url}/product/${p.id}`).join('\n')}`);
  return (
    <>
      <Seo title="My Wishlist" path="/wishlist" noindex />
      <section className="wrap page-hero">
        <span className="eyebrow">Wishlist</span>
        <h1 className="h1" style={{ marginTop: 14 }}>
          {list.length ? 'Saved for later' : 'Nothing saved yet'}
        </h1>
        {list.length > 0 ? (
          <a className="btn btn-ghost btn-sm" style={{ marginTop: 18 }} href={share} target="_blank" rel="noopener noreferrer">
            Drop hints — share on WhatsApp
          </a>
        ) : (
          <p className="lead" style={{ marginTop: 12 }}>
            Tap the heart on any design to keep it here. <Link className="link" to="/shop">Browse designs</Link>
          </p>
        )}
      </section>
      <section className="wrap" style={{ paddingBottom: 80 }}>
        <div className="grid-products">
          {list.map((p, i) => (
            <ProductCard key={p.id} product={p} categories={categories} index={i} />
          ))}
        </div>
      </section>
    </>
  );
}
