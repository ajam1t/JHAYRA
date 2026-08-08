import { Link } from 'react-router-dom';
import { useScrollReveal } from '../components/ScrollReveal';
import { CATEGORIES } from '../data/categories';

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
        <div className="cat-grid">
          {CATEGORIES.map((cat, i) => (
            <Link to={`/shop?category=${cat.slug}`} className="cat-card reveal" key={cat.slug} aria-label={cat.name}>
              {cat.image ? (
                <img loading="lazy" src={cat.image} alt={cat.name} />
              ) : (
                <div style={{width:'100%',height:'100%',background:`hsl(${i*40},25%,65%)`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'1.2rem',fontWeight:700}}>{cat.name}</div>
              )}
              <div className="cat-card-overlay"></div>
              <div className="cat-card-body">
                <div className="cat-card-name">{cat.name}</div>
                <div className="cat-card-count">{cat.count}</div>
              </div>
              <div className="cat-card-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
