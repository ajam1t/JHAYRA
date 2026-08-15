import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useScrollReveal } from '../components/ScrollReveal';
import ProductCard from '../components/ProductCard';
import { CATALOG } from '../data/catalog';
import { useProducts } from '../hooks/useProducts';
import SEO from '../components/SEO';

export default function Shop() {
  const [searchParams] = useSearchParams();
  const viewParam     = searchParams.get('view');
  const categoryParam = searchParams.get('category');
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
  if (priceFilter === 'under1k')   products = products.filter(p => p.price < 1000);
  else if (priceFilter === '1k-2k') products = products.filter(p => p.price >= 1000 && p.price <= 2000);
  else if (priceFilter === 'above2k') products = products.filter(p => p.price > 2000);
  if (sort === 'price-asc')  products = [...products].sort((a,b) => a.price - b.price);
  if (sort === 'price-desc') products = [...products].sort((a,b) => b.price - a.price);
  if (sort === 'new')  products = products.filter(p => p.newArrival);
  if (sort === 'best') products = products.filter(p => p.bestSeller);

  const activeCats = CATALOG.filter(c => c.active);
  const activeFilterCount = (filter !== 'all' ? 1 : 0) + (priceFilter !== 'all' ? 1 : 0);

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
        title="Shop Personalized Photo Frames | JHAYRA"
        description="Browse JHAYRA's complete collection of personalized photo frames, canvas prints & spiritual wall art. Available in A4, A3+ and large sizes. Starting ₹499."
        path="/shop"
      />
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow">Our Collections</p>
          <h1>Shop All</h1>
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
