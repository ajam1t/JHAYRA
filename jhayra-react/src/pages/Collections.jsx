import { Link } from 'react-router-dom';
import { useScrollReveal } from '../components/ScrollReveal';
import { CATALOG } from '../data/catalog';

export default function Collections() {
  useScrollReveal();
  return (
    <div data-page="collections">
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow">All Collections</p>
          <h1>Collections</h1>
          <p>Curated by theme, made to match your space</p>
        </div>
      </div>
      <div className="container section">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'1.5rem'}}>
          {CATALOG.filter(c=>c.active).map(cat => (
            <Link to={`/shop?category=${cat.slug}`} key={cat.slug} className="cat-card" style={{textDecoration:'none'}}>
              <div className="cat-card-thumb">{cat.icon}</div>
              <div className="cat-card-body">
                <div className="cat-card-name">{cat.name}</div>
                <div className="cat-card-desc">{cat.description}</div>
                {cat.subcategories?.length > 0 && (
                  <div className="cat-card-count">{cat.subcategories.length} subcategories</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
