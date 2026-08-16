import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useScrollReveal } from '../components/ScrollReveal';
import ProductCard from '../components/ProductCard';
import { CATALOG } from '../data/catalog';
import { useProducts } from '../hooks/useProducts';
import SEO from '../components/SEO';

/* ── Category SEO metadata map ──────────────────────────────────────────── */
const CATEGORY_SEO = {
  personalized:   { title: 'Personalized Photo Frames | Custom Wall Art', h1: 'Personalized Photo Frames', desc: 'Shop personalized photo frames crafted with your own photos, names & dates. Handmade in India. Starting ₹499. Free delivery.' },
  religious:      { title: 'Religious & Spiritual Wall Art Frames',       h1: 'Religious & Spiritual Art', desc: 'Premium religious wall art — Ganesha, Krishna, Shiva, Hanuman, Lakshmi and more. Handcrafted PS Moulding frames. Starting ₹499.' },
  'love-romance': { title: 'Romantic Couple Photo Frames | Love Gifts',   h1: 'Love & Romance Frames',     desc: 'Beautiful couple photo frames and romantic wall art gifts. Personalized with names, dates & heartfelt messages. Starting ₹499.' },
  wedding:        { title: 'Wedding Photo Frames & Keepsakes',            h1: 'Wedding Photo Frames',       desc: 'Stunning personalized wedding frames and keepsakes. Capture your special day — names, date & photos in a premium handcrafted frame.' },
  family:         { title: 'Family Portrait Frames | Photo Collage',      h1: 'Family Photo Frames',        desc: 'Classic family portrait frames and multi-photo collage prints. Handcrafted wall art for every home. Starting ₹499.' },
  nature:         { title: 'Nature Photography Wall Art Frames',          h1: 'Nature Canvas Prints',       desc: 'Calming nature photography prints and canvas art for living spaces. Museum-grade prints in premium PS Moulding frames.' },
  'modern-art':   { title: 'Modern Abstract Wall Art Frames | JHAYRA',   h1: 'Modern & Abstract Art',      desc: 'Contemporary abstract and modern wall art for your home or office. Bold, minimal, and conversation-starting. Starting ₹499.' },
  canvas:         { title: 'Canvas Prints & Gallery Wall Art | JHAYRA',  h1: 'Canvas Art Prints',          desc: 'Museum-grade gallery canvas prints in premium PS Moulding frames. A versatile statement piece for any room. Starting ₹499.' },
  'baby-kids':    { title: 'Baby & Kids Photo Frames | Milestone Gifts',  h1: 'Baby & Kids Frames',         desc: 'Personalized baby milestone frames and children\'s wall art. Perfect gifts for new parents and birthday celebrations.' },
  'animals-pets': { title: 'Pet Portrait & Wildlife Wall Art Frames',     h1: 'Pet & Wildlife Art',         desc: 'Custom pet portrait frames and majestic wildlife wall art. Because your furry family deserves their own wall art.' },
  occasions:      { title: 'Occasion Gift Frames — Graduation, Retirement & More', h1: 'Occasion Gift Frames', desc: 'Personalized frames for graduation, retirement, housewarming and every milestone. Meaningful gifts starting ₹499.' },
  'art-abstract': { title: 'Folk & Traditional Art Frames — Madhubani, Mithila', h1: 'Folk & Traditional Art', desc: 'Authentic Madhubani and Mithila folk art prints in premium frames. Celebrate India\'s artistic heritage on your walls.' },
  photography:    { title: 'Photography Prints & Canvas Wall Art',         h1: 'Photography Prints',         desc: 'Travel photography, black & white classics and fine art prints in premium PS Moulding frames. Starting ₹499.' },
  quotes:         { title: 'Motivational Quote Wall Art Frames | JHAYRA', h1: 'Quotes & Typography Art',    desc: 'Bold motivational typography and Hindi quote frames for homes, offices and gifting. Premium canvas prints starting ₹499.' },
  'home-vastu':   { title: 'Vastu Wall Art | Seven Horses, Prosperity Frames', h1: 'Vastu & Home Art',     desc: 'Vastu-approved wall art — seven running horses, prosperity symbols and auspicious prints for a positive home.' },
  'running-horses': { title: 'Seven Running Horses Frame | Vastu Wall Art', h1: '7 Running Horses Art',    desc: 'Vastu-approved seven running horses wall art for luck, power and prosperity. Premium handcrafted frames. Starting ₹499.' },
};

export default function Shop() {
  const [searchParams] = useSearchParams();
  const viewParam     = searchParams.get('view');
  const categoryParam = searchParams.get('category');
  const qParam        = searchParams.get('q');
  const [filter, setFilter]           = useState(categoryParam || 'all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sort, setSort]               = useState(viewParam === 'new' ? 'new' : viewParam === 'best' ? 'best' : 'popular');
  const [expanded, setExpanded]       = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen]     = useState(false);

  const { products: allProducts } = useProducts();
  // Re-run after async products load so IntersectionObserver catches newly rendered .reveal cards
  useScrollReveal([allProducts.length]);

  useEffect(() => {
    if (viewParam === 'new') setSort('new');
    else if (viewParam === 'best') setSort('best');
    else setSort('popular');
    setFilter(categoryParam || 'all');
    setPriceFilter('all');
  }, [viewParam, categoryParam]);

  const toggleExpand = (slug) => setExpanded(e => e === slug ? null : slug);
  const closeSheets  = () => { setMobileFilterOpen(false); setMobileSortOpen(false); };

  let products = filter === 'all' ? allProducts : allProducts.filter(p => p.category === filter);

  // URL-based text search (?q=)
  if (qParam) {
    const q = qParam.toLowerCase().trim();
    products = products.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.tags?.some(t => t.toLowerCase().includes(q))
    );
  }

  if (priceFilter === 'under1k')   products = products.filter(p => p.price < 1000);
  else if (priceFilter === '1k-2k') products = products.filter(p => p.price >= 1000 && p.price <= 2000);
  else if (priceFilter === 'above2k') products = products.filter(p => p.price > 2000);
  if (sort === 'price-asc')  products = [...products].sort((a,b) => a.price - b.price);
  if (sort === 'price-desc') products = [...products].sort((a,b) => b.price - a.price);
  if (sort === 'new')  products = products.filter(p => p.newArrival);
  if (sort === 'best') products = products.filter(p => p.bestSeller);

  const activeCats = CATALOG.filter(c => c.active);
  const activeFilterCount = (filter !== 'all' ? 1 : 0) + (priceFilter !== 'all' ? 1 : 0);

  // Dynamic SEO: build title, description and canonical based on active params
  const catSEO = CATEGORY_SEO[categoryParam] || null;
  let seoTitle, seoDesc, seoCanonical, seoH1;
  if (qParam) {
    seoTitle = `Search: "${qParam}" | JHAYRA Wall Art`;
    seoDesc  = `Search results for "${qParam}" on JHAYRA. Browse photo frames, canvas prints and personalized wall art.`;
    seoCanonical = `/shop?q=${encodeURIComponent(qParam)}`;
    seoH1 = `Results for "${qParam}"`;
  } else if (catSEO) {
    seoTitle = `${catSEO.title} | JHAYRA`;
    seoDesc  = catSEO.desc;
    seoCanonical = `/shop?category=${categoryParam}`;
    seoH1 = catSEO.h1;
  } else if (viewParam === 'new') {
    seoTitle = 'New Arrivals — Photo Frames & Wall Art | JHAYRA';
    seoDesc  = 'Discover JHAYRA\'s newest photo frames and wall art. Fresh designs in personalized frames, religious art, canvas prints and more. Starting ₹499.';
    seoCanonical = '/shop?view=new';
    seoH1 = 'New Arrivals';
  } else if (viewParam === 'best') {
    seoTitle = 'Best Sellers — Photo Frames & Wall Art | JHAYRA';
    seoDesc  = 'Shop JHAYRA\'s most loved photo frames and wall art. Customer favourites in personalized frames, religious art and canvas prints. Starting ₹499.';
    seoCanonical = '/shop?view=best';
    seoH1 = 'Best Sellers';
  } else {
    seoTitle = 'Shop Personalized Photo Frames & Wall Art | JHAYRA';
    seoDesc  = 'Browse JHAYRA\'s complete collection of personalized photo frames, religious wall art, canvas prints and spiritual décor. Handcrafted in India. Starting ₹499. Free delivery.';
    seoCanonical = '/shop';
    seoH1 = 'Shop All';
  }

  const sortOptions = [
    { label: 'Most Popular',        value: 'popular' },
    { label: 'Best Sellers',        value: 'best' },
    { label: 'New Arrivals',        value: 'new' },
    { label: 'Price: Low to High',  value: 'price-asc' },
    { label: 'Price: High to Low',  value: 'price-desc' },
  ];
  const priceOptions = [
    { label: 'All Prices',    value: 'all' },
    { label: 'Under ₹1,000', value: 'under1k' },
    { label: '₹1,000–₹2,000', value: '1k-2k' },
    { label: 'Above ₹2,000', value: 'above2k' },
  ];

  return (
    <div data-page="shop">
      <SEO
        title={seoTitle}
        description={seoDesc}
        path={seoCanonical}
        noindex={!!qParam}
      />
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow">Our Collections</p>
          <h1>{seoH1}</h1>
          <p>Discover our curated collection of premium wall art</p>
        </div>
      </div>

      {/* Mobile filter bar — hidden on desktop via CSS */}
      <div className="mobile-filter-bar">
        <button
          className={`mobile-filter-btn${activeFilterCount > 0 ? ' active' : ''}`}
          onClick={() => setMobileFilterOpen(true)}
        >
          <svg viewBox="0 0 24 24"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="10" y2="18"/></svg>
          Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
        <button
          className={`mobile-filter-btn${sort !== 'popular' ? ' active' : ''}`}
          onClick={() => setMobileSortOpen(true)}
        >
          <svg viewBox="0 0 24 24"><path d="M3 9l4-4 4 4M7 5v14"/><path d="M21 15l-4 4-4-4m4 4V5"/></svg>
          Sort
        </button>
      </div>

      <div className="container">
        <div className="shop-wrap">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="sb-title">Categories</div>
            <button
              className={`shop-cat-item${filter === 'all' ? ' active' : ''}`}
              onClick={() => { setFilter('all'); setExpanded(null); }}
            >
              All Products
            </button>
            {activeCats.map(cat => {
              const isExpanded = expanded === cat.slug;
              const isActive   = filter === cat.slug;
              return (
                <div key={cat.slug}>
                  <button
                    className={`shop-cat-item${isActive ? ' active' : ''}${isExpanded ? ' expanded' : ''}`}
                    onClick={() => { setFilter(cat.slug); toggleExpand(cat.slug); }}
                  >
                    <span>{cat.icon} {cat.name}</span>
                    {cat.subcategories?.length > 0 && (
                      <span className="shop-cat-arrow">›</span>
                    )}
                  </button>
                  {cat.subcategories?.length > 0 && (
                    <div className={`shop-subcats${isExpanded ? ' open' : ''}`}>
                      {cat.subcategories.map(sc => (
                        <button
                          key={sc.slug}
                          className={`shop-subcat-item${filter === sc.slug ? ' active' : ''}`}
                          onClick={() => setFilter(sc.slug)}
                        >
                          {sc.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="sb-title" style={{marginTop:'1.5rem'}}>Price</div>
            {priceOptions.map(p => (
              <div
                key={p.value}
                className={`sb-opt${priceFilter === p.value ? ' active' : ''}`}
                onClick={() => setPriceFilter(p.value)}
                style={priceFilter === p.value ? {color:'var(--gold)',background:'rgba(182,141,64,.06)',cursor:'pointer'} : {cursor:'pointer'}}
              >
                {p.label}
              </div>
            ))}
          </aside>

          {/* Product grid */}
          <div>
            <div className="shop-top">
              <span style={{fontSize:'.85rem',color:'var(--muted)'}}>{products.length} products</span>
              <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
                {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {products.length > 0 ? (
              <div className="shop-grid">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <div style={{textAlign:'center',padding:'4rem 0',color:'#9A8A6A'}}>
                <div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>🖼️</div>
                <p>No products found in this category yet.</p>
                <p style={{fontSize:'.85rem',marginTop:'.5rem',opacity:.7}}>More designs coming soon!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom sheet backdrop */}
      <div
        className={`mobile-sheet-backdrop${mobileFilterOpen || mobileSortOpen ? ' open' : ''}`}
        onClick={closeSheets}
        aria-hidden="true"
      />

      {/* Filter bottom sheet */}
      <div className={`mobile-sheet${mobileFilterOpen ? ' open' : ''}`}>
        <div className="mobile-sheet-handle" />
        <div className="mobile-sheet-head">
          <span className="mobile-sheet-title">Filter</span>
          <button className="mobile-sheet-close" onClick={() => setMobileFilterOpen(false)} aria-label="Close">
            <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="mobile-sheet-body">
          <div className="mobile-sheet-section-title">Category</div>
          <div className="mobile-filter-pills">
            <button className={`mobile-filter-pill${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>All</button>
            {activeCats.map(cat => (
              <button
                key={cat.slug}
                className={`mobile-filter-pill${filter === cat.slug ? ' active' : ''}`}
                onClick={() => setFilter(cat.slug)}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
          <div className="mobile-sheet-section-title">Price Range</div>
          <div className="mobile-filter-pills">
            {priceOptions.map(p => (
              <button
                key={p.value}
                className={`mobile-filter-pill${priceFilter === p.value ? ' active' : ''}`}
                onClick={() => setPriceFilter(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button className="mobile-sheet-apply" onClick={() => setMobileFilterOpen(false)}>
            Show {products.length} Products
          </button>
        </div>
      </div>

      {/* Sort bottom sheet */}
      <div className={`mobile-sheet${mobileSortOpen ? ' open' : ''}`}>
        <div className="mobile-sheet-handle" />
        <div className="mobile-sheet-head">
          <span className="mobile-sheet-title">Sort By</span>
          <button className="mobile-sheet-close" onClick={() => setMobileSortOpen(false)} aria-label="Close">
            <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="mobile-sheet-body">
          {sortOptions.map(opt => (
            <div
              key={opt.value}
              className={`sort-option${sort === opt.value ? ' active' : ''}`}
              onClick={() => { setSort(opt.value); setMobileSortOpen(false); }}
            >
              <span className="sort-option-label">{opt.label}</span>
              <div className="sort-radio"><div className="sort-radio-dot" /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
