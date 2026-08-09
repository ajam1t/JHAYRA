import { useState } from 'react';
import { useScrollReveal } from '../components/ScrollReveal';
import ProductCard from '../components/ProductCard';
import { JHAYRA_DATA } from '../data/products';
import { OCCASIONS, RECIPIENTS } from '../data/occasions';

export default function GiftFinder() {
  useScrollReveal();
  const [tab, setTab] = useState('occasion');
  const [selected, setSelected] = useState(null);

  const list = tab === 'occasion' ? OCCASIONS : RECIPIENTS;
  const item = list.find(x => x.id === selected);
  const giftProducts = item ? item.productIds.map(id => JHAYRA_DATA.get(id)).filter(Boolean) : [];

  const handleTab = (t) => { setTab(t); setSelected(null); };
  const handleSelect = (id) => setSelected(id === selected ? null : id);

  return (
    <div data-page="gift-finder">
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow">Find the Perfect Gift</p>
          <h1>Gift Finder</h1>
          <p>Discover the ideal JHAYRA gift — browse by occasion or by who you're shopping for.</p>
        </div>
      </div>

      <div className="container" style={{paddingTop:'2.5rem',paddingBottom:'4rem'}}>
        {/* Tab bar */}
        <div className="gift-tab-bar">
          <button
            className={`gift-tab${tab==='occasion'?' active':''}`}
            onClick={()=>handleTab('occasion')}
          >
            By Occasion
          </button>
          <button
            className={`gift-tab${tab==='recipient'?' active':''}`}
            onClick={()=>handleTab('recipient')}
          >
            By Recipient
          </button>
        </div>

        {/* Card grid */}
        <div className="gift-cards">
          {list.map(x => (
            <div
              key={x.id}
              role="button"
              tabIndex={0}
              className={`gift-card${selected===x.id?' active':''}`}
              style={{background:x.bg, color:x.tc}}
              onClick={()=>handleSelect(x.id)}
              onKeyDown={e=>e.key==='Enter'&&handleSelect(x.id)}
            >
              <div className="gift-card-emoji">{x.emoji}</div>
              <div className="gift-card-label" style={{color:x.tc}}>{x.label}</div>
              <div className="gift-card-desc" style={{color:x.tc}}>{x.description}</div>
            </div>
          ))}
        </div>

        {/* Results */}
        {selected && giftProducts.length > 0 && (
          <div className="s-reveal">
            <p className="gift-results-title">{item.emoji} Perfect for {item.label}</p>
            <div className="products-grid">
              {giftProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}

        {!selected && (
          <div style={{textAlign:'center',padding:'3rem 0',color:'#9A8A6A'}}>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🎁</div>
            <p style={{fontSize:'1rem'}}>
              {tab==='occasion'
                ? 'Select an occasion above to see curated gift ideas'
                : 'Select a recipient to see the perfect gift suggestions'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
