import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useScrollReveal } from '../components/ScrollReveal';
import { JHAYRA_DATA } from '../data/products';
import { PRODUCT_ART } from '../data/artwork';

export default function Product() {
  useScrollReveal();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const galleryRef = useRef(null);
  const [selectedSize, setSelectedSize] = useState(0);
  const [selectedMaterial, setSelectedMaterial] = useState(0);
  const [qty, setQty] = useState(1);
  const { id } = useParams();
  const product = JHAYRA_DATA.get(id) || JHAYRA_DATA.get('p001') || JHAYRA_DATA.all()[0];
  const art = PRODUCT_ART[product?.id];

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    const onMove = e => {
      const r = el.getBoundingClientRect();
      const mx = (e.clientX - r.left) / r.width - .5;
      const my = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `perspective(800px) rotateX(${(-my*6).toFixed(2)}deg) rotateY(${(mx*6).toFixed(2)}deg)`;
    };
    const onLeave = () => { el.style.transform = ''; };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, []);

  if (!product) return <div className="container" style={{padding:'4rem 0',textAlign:'center'}}>Product not found.</div>;

  const discount = Math.round((1 - product.price / product.originalPrice) * 100);
  const sizes = product.sizes || ['12×16"','16×20"'];
  const materials = product.materials || ['Canvas'];

  return (
    <div data-page="product">
      {/* Breadcrumb */}
      <div className="container" style={{paddingTop:'calc(var(--nav) + var(--bar) + 1.5rem)',paddingBottom:'.5rem'}}>
        <div style={{display:'flex',gap:'.5rem',alignItems:'center',fontSize:'.8rem',color:'var(--muted)'}}>
          <Link to="/" style={{color:'var(--muted)'}}>Home</Link>
          <span>›</span>
          <Link to="/shop" style={{color:'var(--muted)'}}>Shop</Link>
          <span>›</span>
          <span style={{color:'var(--text)'}}>{product.name}</span>
        </div>
      </div>

      <div className="container">
        <div className="product-layout">
          {/* Gallery */}
          <div>
            <div className="gallery-main" ref={galleryRef} style={{transition:'transform .12s ease',cursor:'crosshair'}}>
              {art ? (
                <div style={{
                  width:'100%', height:'100%', minHeight:'380px',
                  background:`linear-gradient(145deg,${art.fc}f5 0%,${art.fc}cc 100%)`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  borderRadius:'1rem', overflow:'hidden', padding:'1.5rem',
                }}>
                  <div style={{
                    height:'90%', maxHeight:'340px', aspectRatio:'200/260', width:'auto',
                    borderRadius:'6px', overflow:'hidden', position:'relative',
                    boxShadow:'0 24px 64px rgba(0,0,0,.4),0 6px 20px rgba(0,0,0,.2)',
                    flexShrink:0,
                  }}>
                    <div className="pc-art-frame" dangerouslySetInnerHTML={{__html: art.art}} style={{width:'100%',height:'100%'}} />
                    <div style={{position:'absolute',inset:0,background:'linear-gradient(148deg,rgba(255,255,255,.18) 0%,rgba(255,255,255,.05) 35%,transparent 60%)',pointerEvents:'none'}} />
                  </div>
                </div>
              ) : (
                <div style={{width:'100%',height:'100%',background:'linear-gradient(150deg,#F7F3EC,#EDE7D9)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'1rem',padding:'2rem',borderRadius:'1rem',minHeight:'380px'}}>
                  <div style={{fontFamily:'var(--fd)',fontSize:'1.4rem',color:'var(--text)',textAlign:'center'}}>{product.name}</div>
                  <div style={{fontSize:'.85rem',color:'var(--muted)',textAlign:'center'}}>{sizes[selectedSize]} · {materials[selectedMaterial]}</div>
                </div>
              )}
            </div>
            <div className="gallery-thumbs" style={{display:'flex',gap:'.5rem',marginTop:'.75rem'}}>
              {[1,2,3].map(i=>(
                <div key={i} className="gallery-thumb" style={{
                  width:'60px', height:'60px', borderRadius:'.5rem', cursor:'pointer',
                  background: art ? `${art.fc}dd` : 'var(--bg)',
                  border: i===1 ? '2px solid var(--gold)' : '2px solid var(--cream)',
                  overflow:'hidden', position:'relative',
                }}>
                  {art && <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <div style={{height:'80%',aspectRatio:'200/260',overflow:'hidden',borderRadius:'2px'}} dangerouslySetInnerHTML={{__html: art.art}} />
                  </div>}
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="product-info">
            <div style={{display:'flex',gap:'.5rem',marginBottom:'.8rem',flexWrap:'wrap'}}>
              {discount > 0 && <span className="badge badge-sale">-{discount}% OFF</span>}
              {product.bestSeller && <span className="badge" style={{background:'var(--gold)',color:'#fff'}}>Best Seller</span>}
              {product.newArrival && <span className="badge" style={{background:'#22C55E',color:'#fff'}}>New</span>}
            </div>
            <h1 className="product-name" style={{fontFamily:'var(--fd)',fontSize:'clamp(1.5rem,2.5vw,2rem)',marginBottom:'.5rem'}}>{product.name}</h1>
            <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.8rem'}}>
              <span className="stars" style={{color:'#F59E0B',fontSize:'1rem'}}>{'★'.repeat(Math.round(product.rating))}</span>
              <span style={{fontSize:'.85rem',color:'var(--muted)'}}>({product.reviewCount} reviews)</span>
            </div>
            <div style={{display:'flex',alignItems:'baseline',gap:'.75rem',marginBottom:'1.2rem'}}>
              <span className="price-now" style={{fontSize:'1.6rem',fontFamily:'var(--fd)',fontWeight:700}}>₹{product.price.toLocaleString('en-IN')}</span>
              <span className="price-was" style={{fontSize:'1rem'}}>₹{product.originalPrice.toLocaleString('en-IN')}</span>
            </div>

            {/* Size */}
            <div style={{marginBottom:'1rem'}}>
              <div style={{fontSize:'.8rem',fontWeight:600,marginBottom:'.5rem',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--muted)'}}>Size: {sizes[selectedSize]}</div>
              <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap'}}>
                {sizes.map((s, i) => (
                  <button key={s} onClick={()=>setSelectedSize(i)} style={{padding:'.4rem .9rem',borderRadius:'.4rem',border:`1.5px solid ${selectedSize===i?'var(--gold)':'var(--cream)'}`,background:selectedSize===i?'rgba(182,141,64,.08)':'#fff',cursor:'pointer',fontSize:'.82rem',fontWeight:selectedSize===i?600:400,color:selectedSize===i?'var(--gold)':'var(--text)'}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Material */}
            <div style={{marginBottom:'1.5rem'}}>
              <div style={{fontSize:'.8rem',fontWeight:600,marginBottom:'.5rem',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--muted)'}}>Material: {materials[selectedMaterial]}</div>
              <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap'}}>
                {materials.map((m, i) => (
                  <button key={m} onClick={()=>setSelectedMaterial(i)} style={{padding:'.4rem .9rem',borderRadius:'.4rem',border:`1.5px solid ${selectedMaterial===i?'var(--gold)':'var(--cream)'}`,background:selectedMaterial===i?'rgba(182,141,64,.08)':'#fff',cursor:'pointer',fontSize:'.82rem',fontWeight:selectedMaterial===i?600:400,color:selectedMaterial===i?'var(--gold)':'var(--text)'}}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Qty + Add */}
            <div style={{display:'flex',gap:'.75rem',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap'}}>
              <div className="qty" style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
                <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:'32px',height:'32px',border:'1.5px solid var(--cream)',borderRadius:'.4rem',background:'#fff',cursor:'pointer',fontSize:'1rem'}}>−</button>
                <span style={{minWidth:'24px',textAlign:'center',fontWeight:600}}>{qty}</span>
                <button onClick={()=>setQty(q=>q+1)} style={{width:'32px',height:'32px',border:'1.5px solid var(--cream)',borderRadius:'.4rem',background:'#fff',cursor:'pointer',fontSize:'1rem'}}>+</button>
              </div>
              <button className="btn btn-gold btn-lg" style={{flex:1}} onClick={()=>{addToCart(product.id);toast('Added to cart ✓');}}>
                Add to Cart · ₹{(product.price*qty).toLocaleString('en-IN')}
              </button>
            </div>
            <button className="btn btn-outline" style={{width:'100%',marginBottom:'1.2rem'}} onClick={()=>{
              const msg = `Hello JHAYRA! I'd like to order:\n• ${product.name} (${sizes[selectedSize]} · ${materials[selectedMaterial]}) × ${qty} — ₹${(product.price*qty).toLocaleString('en-IN')}\n\nPlease confirm.`;
              window.open(`https://wa.me/917070728989?text=${encodeURIComponent(msg)}`, '_blank');
            }}>🟢 Order on WhatsApp</button>

            {/* Delivery info */}
            <div style={{display:'flex',flexDirection:'column',gap:'.6rem',fontSize:'.82rem',color:'var(--muted)',background:'var(--bg)',borderRadius:'.75rem',padding:'1rem'}}>
              <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><path d="m16 8 5 1v5h-5z"/></svg> Free shipping above ₹999</div>
              <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Delivered in 5–7 business days</div>
              <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> Handcrafted to order</div>
            </div>

            {/* Description */}
            <div style={{marginTop:'1.4rem',padding:'1rem 0',borderTop:'1px solid var(--cream)'}}>
              <div style={{fontWeight:600,marginBottom:'.5rem'}}>Description</div>
              <p style={{color:'var(--muted)',lineHeight:1.75,fontSize:'.9rem'}}>{product.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
