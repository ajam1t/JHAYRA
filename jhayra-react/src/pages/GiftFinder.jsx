import { useState } from 'react';
import { useScrollReveal } from '../components/ScrollReveal';
import ProductCard from '../components/ProductCard';
import { JHAYRA_DATA } from '../data/products';

const OCCASIONS = [
  { id:'birthday', label:'🎂 Birthday', products:['p001','p010','p009'] },
  { id:'anniversary', label:'💑 Anniversary', products:['p001','p008','p009'] },
  { id:'wedding', label:'💒 Wedding', products:['p001','p003','p008'] },
  { id:'housewarming', label:'🏠 Housewarming', products:['p005','p002','p011'] },
  { id:'graduation', label:'🎓 Graduation', products:['p012','p004','p010'] },
];

export default function GiftFinder() {
  useScrollReveal();
  const [selected, setSelected] = useState(null);

  const occasion = OCCASIONS.find(o => o.id === selected);
  const giftProducts = occasion ? occasion.products.map(id => JHAYRA_DATA.get(id)).filter(Boolean) : [];

  return (
    <div data-page="gift-finder">
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow">Find the Perfect Gift</p>
          <h1>What's the Occasion?</h1>
          <p>Pick an occasion and we'll suggest the perfect JHAYRA gift for someone special.</p>
        </div>
      </div>

      <div className="container">
        {/* Occasion grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'1rem',margin:'2.5rem 0'}}>
          {OCCASIONS.map(o => (
            <button key={o.id} onClick={()=>setSelected(o.id)} className={selected===o.id?'btn btn-gold':'btn btn-outline'} style={{padding:'1.2rem',fontSize:'.9rem',display:'flex',flexDirection:'column',alignItems:'center',gap:'.4rem',borderRadius:'1rem',minHeight:'80px'}}>
              <span style={{fontSize:'1.6rem'}}>{o.label.split(' ')[0]}</span>
              <span>{o.label.split(' ').slice(1).join(' ')}</span>
            </button>
          ))}
        </div>

        {/* Gift results */}
        {selected && giftProducts.length > 0 && (
          <div>
            <div className="section-header s-reveal">
              <p className="eyebrow">Perfect for {occasion.label}</p>
              <h2 className="display-3">Our Top Picks</h2>
              <div className="divider"></div>
            </div>
            <div className="products-grid" style={{marginTop:'1.5rem'}}>
              {giftProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}

        {!selected && (
          <div style={{textAlign:'center',padding:'3rem 0',color:'var(--muted)'}}>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🎁</div>
            <p>Select an occasion above to see curated gift ideas</p>
          </div>
        )}
      </div>
    </div>
  );
}
