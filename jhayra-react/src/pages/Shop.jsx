import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useScrollReveal } from '../components/ScrollReveal';
import ProductCard from '../components/ProductCard';
import { JHAYRA_DATA, JHAYRA_PRODUCTS } from '../data/products';

export default function Shop() {
  useScrollReveal();
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  const categoryParam = searchParams.get('category');
  const [filter, setFilter] = useState(categoryParam || 'all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sort, setSort] = useState(viewParam === 'new' ? 'new' : viewParam === 'best' ? 'best' : 'popular');

  useEffect(() => {
    if (viewParam === 'new') setSort('new');
    else if (viewParam === 'best') setSort('best');
    else setSort('popular');
    setFilter(categoryParam || 'all');
    setPriceFilter('all');
  }, [viewParam, categoryParam]);

  const categories = [
    {label:'All',value:'all'},
    {label:'Personalized',value:'personalized'},
    {label:'Religious',value:'religious'},
    {label:'Running Horses',value:'running-horses'},
    {label:'Nature',value:'nature'},
    {label:'Modern Art',value:'modern-art'},
    {label:'Canvas',value:'canvas'},
  ];

  let products = filter === 'all' ? JHAYRA_PRODUCTS : JHAYRA_DATA.byCategory(filter);
  if (priceFilter === 'under1k') products = products.filter(p => p.price < 1000);
  else if (priceFilter === '1k-2k') products = products.filter(p => p.price >= 1000 && p.price <= 2000);
  else if (priceFilter === 'above2k') products = products.filter(p => p.price > 2000);
  if (sort === 'price-asc') products = [...products].sort((a,b)=>a.price-b.price);
  if (sort === 'price-desc') products = [...products].sort((a,b)=>b.price-a.price);
  if (sort === 'new') products = products.filter(p=>p.newArrival);
  if (sort === 'best') products = products.filter(p=>p.bestSeller);

  return (
    <div data-page="shop">
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow">Our Collections</p>
          <h1>Shop All</h1>
          <p>Discover our curated collection of premium wall art</p>
        </div>
      </div>
      <div className="container">
        <div className="shop-wrap">
          <aside className="sidebar">
            <div className="sb-title">Categories</div>
            {categories.map(c => (
              <div key={c.value} className={`sb-opt${filter===c.value?' active':''}`} onClick={() => setFilter(c.value)} style={filter===c.value?{color:'var(--gold)',background:'rgba(182,141,64,.06)',cursor:'pointer'}:{cursor:'pointer'}}>
                {c.label}
              </div>
            ))}
            <div className="sb-title" style={{marginTop:'1.5rem'}}>Price</div>
            {[{label:'All Prices',value:'all'},{label:'Under ₹1,000',value:'under1k'},{label:'₹1,000–₹2,000',value:'1k-2k'},{label:'Above ₹2,000',value:'above2k'}].map(p=>(
              <div key={p.value} className={`sb-opt${priceFilter===p.value?' active':''}`} onClick={()=>setPriceFilter(p.value)} style={priceFilter===p.value?{color:'var(--gold)',background:'rgba(182,141,64,.06)',cursor:'pointer'}:{cursor:'pointer'}}>{p.label}</div>
            ))}
          </aside>
          <div>
            <div className="shop-top">
              <span style={{fontSize:'.85rem',color:'var(--muted)'}}>{products.length} products</span>
              <select className="sort-select" value={sort} onChange={e=>setSort(e.target.value)}>
                <option value="popular">Most Popular</option>
                <option value="best">Best Sellers</option>
                <option value="new">New Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
            <div className="shop-grid">
              {products.map(p=><ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
