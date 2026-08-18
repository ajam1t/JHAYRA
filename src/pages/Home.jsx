import { Link } from 'react-router-dom';
import Hero3D from '../components/Hero3D';
import ProductCard from '../components/ProductCard';
import { useScrollReveal } from '../components/ScrollReveal';
import { useProducts } from '../hooks/useProducts';
import { useHomepageCollections } from '../hooks/useHomepageCollections';
import SEO from '../components/SEO';

export default function Home() {
  const { products: bestSellers } = useProducts({ homepage: true, limit: 4 });
  const { items: collections } = useHomepageCollections();
  useScrollReveal([bestSellers.length, collections.length]);

  return (
    <div data-page="home">
      <SEO
        title="JHAYRA — Crafting Memories Into Art | Premium Wall Décor India"
        description="Handcrafted photo frames, personalized gifts, canvas prints and spiritual art. Free delivery across India on all orders."
        path="/"
        ogImage="https://jhayra.com/Images/personalized.jpg"
      />
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
        </div>
        <div className="container">
          <div className="hero-split">
            <div className="hero-content">
              <h1 className="hero-title">The photo<br />you keep<br />going back to<br /><em>deserves a frame.</em></h1>
              <p className="hero-sub">Turn the moments you love into something worth living with. Personalised frames, spiritual art and canvas prints — crafted by hand, made to last.</p>
              <div className="hero-cta">
                <Link to="/customize" className="btn btn-gold btn-lg">Create Your Frame</Link>
                <Link to="/shop" className="btn btn-outline">Explore Collections</Link>
              </div>
            </div>
            <Hero3D />
          </div>
        </div>
      </section>

      {/* Benefits strip */}
      <section className="benefits-strip">
        <div className="container">
          <div className="benefits-row">
            <div className="benefit">
              <svg viewBox="0 0 24 24"><path d="M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.1-6.6-5-4.9 6.9-1z"/></svg>
              <span><b>10,000+</b> Happy Homes</span>
            </div>
            <div className="benefit">
              <svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><path d="m16 8 5 1v5h-5z"/></svg>
              <span><b>Free Delivery</b> Across India</span>
            </div>
            <div className="benefit">
              <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span><b>Secure</b> Packaging</span>
            </div>
            <div className="benefit">
              <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg>
              <span><b>Easy</b> Returns</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section" style={{background:'#fff'}}>
        <div className="container">
          <div className="section-header s-reveal">
            <p className="eyebrow">Explore Our Collections</p>
            <h2 className="display-3">Every Wall Has a Story</h2>
            <div className="divider"></div>
          </div>
          <div className="cat-grid">
            {collections.map((col, i) => {
              const link = col.link || '/shop';
              const isExternal = /^https?:\/\//i.test(link);
              const alt = col.alt_text || col.title;
              const inner = (
                <>
                  {col.image_url ? (
                    <img loading="lazy" src={col.image_url} alt={alt} />
                  ) : (
                    <div style={{width:'100%',height:'100%',background:`hsl(${i*40},25%,75%)`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'1.2rem',fontWeight:700}}>{col.title}</div>
                  )}
                  <div className="cat-card-overlay"></div>
                  <div className="cat-card-body">
                    <div className="cat-card-name">{col.title}</div>
                    {col.subtitle && <div className="cat-card-count">{col.subtitle}</div>}
                  </div>
                  <div className="cat-card-arrow">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>
                  </div>
                </>
              );
              return isExternal ? (
                <a href={link} className="cat-card reveal" key={col.id} aria-label={col.title} target="_blank" rel="noopener noreferrer">{inner}</a>
              ) : (
                <Link to={link} className="cat-card reveal" key={col.id} aria-label={col.title}>{inner}</Link>
              );
            })}
          </div>
          <div style={{textAlign:'center',marginTop:'1.5rem'}}>
            <Link to="/collections" className="btn btn-outline">View All Collections</Link>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="section">
        <div className="container">
          <div className="section-header s-reveal">
            <p className="eyebrow">Best Sellers</p>
            <h2 className="display-3">Our Most Loved Picks</h2>
            <div className="divider"></div>
          </div>
          <div className="products-grid">
            {bestSellers.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
          <div style={{textAlign:'center',marginTop:'2.5rem'}}>
            <Link to="/shop" className="btn btn-outline">View All Products</Link>
          </div>
        </div>
      </section>

      {/* Why JHAYRA */}
      <section className="section" style={{background:'#fff'}}>
        <div className="container">
          <div className="section-header s-reveal">
            <p className="eyebrow">The JHAYRA Difference</p>
            <h2 className="display-3">Why 10,000+ Homes Trust Us</h2>
            <div className="divider"></div>
          </div>
          <div className="why-grid">
            {[
              {icon:<svg viewBox="0 0 24 24"><path d="M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.1-6.6-5-4.9 6.9-1z"/></svg>,title:'Premium Quality',desc:'Every frame is crafted with museum-grade materials and precision printing for lasting beauty.'},
              {icon:<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>,title:'Made to Order',desc:'Each piece is uniquely crafted for you — no two frames are alike.'},
              {icon:<svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><path d="m16 8 5 1v5h-5z"/></svg>,title:'Fast Delivery',desc:'Carefully packed and delivered to your doorstep within 5–7 business days.'},
              {icon:<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,title:'Happiness Guaranteed',desc:"Not happy? We'll make it right. Easy returns and responsive support."},
            ].map((w, i) => (
              <div className="why-card s-reveal" key={i}>
                <div className="why-icon">{w.icon}</div>
                <div className="why-title">{w.title}</div>
                <p className="why-desc">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
