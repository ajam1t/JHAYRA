import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useScrollReveal } from '../components/ScrollReveal';
import { useProduct } from '../hooks/useProducts';
import { PRODUCT_ART } from '../data/artwork';
import { FRAME_SIZES, coloursForSize, getFrameOption, FRAME_COLOUR_HEX } from '../data/frameOptions';
import SEO from '../components/SEO';

const FRAME_SHADOW = {
  Black: '0 12px 40px rgba(0,0,0,.22),0 4px 14px rgba(0,0,0,.14)',
  Gold:  '0 12px 40px rgba(0,0,0,.18),0 4px 14px rgba(0,0,0,.10),0 0 0 1px rgba(196,155,46,.30)',
  Brown: '0 12px 40px rgba(0,0,0,.20),0 4px 14px rgba(0,0,0,.12)',
};
const FRAME_BW = { 'A4':12, 'A3+':14, '18 × 24':16, '24 × 36':20 };
/* Physical portrait dimensions (inches): w = width, h = height */
const SIZE_DIMS = {
  'A4':     { w:9.5, h:13 },
  'A3+':    { w:12,  h:18 },
  '18 × 24':{ w:18,  h:24 },
  '24 × 36':{ w:24,  h:36 },
};
/* Portrait display height (px) per size — determines overall visual scale */
const FRAME_SCALE_H = { 'A4':320, 'A3+':390, '18 × 24':470, '24 × 36':560 };

export default function Product() {
  useScrollReveal();
  const { addToCartWithFrame } = useCart();
  const { toast } = useToast();
  const galleryRef = useRef(null);
  const { id } = useParams();
  const { product, loading } = useProduct(id || 'p001');
  const art = PRODUCT_ART[product?.id];

  const [selectedSize,        setSelectedSize]        = useState(FRAME_SIZES[0]);
  const [selectedColour,      setSelectedColour]      = useState(coloursForSize(FRAME_SIZES[0])[0]);
  const [selectedOrientation, setSelectedOrientation] = useState('Vertical');
  const [qty, setQty] = useState(1);

  const availableColours = coloursForSize(selectedSize);
  const frameOption      = getFrameOption(selectedSize, selectedColour);
  const price            = frameOption?.price ?? product?.price ?? 499;

  /* Frame geometry — portrait dims flipped for landscape */
  const isPortrait = selectedOrientation === 'Vertical';
  const dims    = SIZE_DIMS[selectedSize] || { w:18, h:24 };
  const scaleH  = FRAME_SCALE_H[selectedSize] || 320;
  const scaleW  = Math.round(scaleH * dims.w / dims.h);
  const frameH  = isPortrait ? scaleH : scaleW;   // px
  const frameW  = isPortrait ? scaleW : scaleH;   // px
  const actualSize = isPortrait
    ? `${dims.w} × ${dims.h} inches`
    : `${dims.h} × ${dims.w} inches`;

  /* When size changes, reset colour to first available for that size */
  const handleSizeChange = (size) => {
    setSelectedSize(size);
    const cols = coloursForSize(size);
    if (!cols.includes(selectedColour)) setSelectedColour(cols[0]);
  };

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

  if (loading) return <div className="container" style={{padding:'4rem 0',textAlign:'center',color:'var(--muted)'}}>Loading…</div>;
  if (!product) return <div className="container" style={{padding:'4rem 0',textAlign:'center'}}>Product not found.</div>;

  const handleAddToCart = () => {
    if (!frameOption) return;
    addToCartWithFrame(product.id, frameOption, product.name, qty, selectedOrientation, frameOption?.price ?? product.price);
    toast('Added to cart ✓');
  };

  const waMsg = `Hello JHAYRA! I'd like to order:\n• ${product.name}\n  Frame: ${selectedSize} · ${selectedOrientation} · ${actualSize} · ${selectedColour} PS Moulding\n  Qty: ${qty} — ₹${(price * qty).toLocaleString('en-IN')}\n\nPlease confirm.`;

  const productId = id || product.id;
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    brand: { '@type': 'Brand', name: 'JHAYRA' },
    url: `https://jhayra.com/product/${productId}`,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'INR',
      availability: product.stockStatus === 'in-stock'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `https://jhayra.com/product/${productId}`,
      seller: { '@type': 'Organization', name: 'JHAYRA' },
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://jhayra.com/' },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://jhayra.com/shop' },
      { '@type': 'ListItem', position: 3, name: product.name, item: `https://jhayra.com/product/${productId}` },
    ],
  };

  return (
    <div data-page="product">
      <SEO
        title={`${product.name} | JHAYRA`}
        description={`${product.description} — Available from ₹${product.price} in A4, A3+, 18×24 and 24×36 inch sizes.`}
        path={`/product/${productId}`}
        ogType="product"
        schema={[productSchema, breadcrumbSchema]}
        schemaId="product-schema"
      />
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
              {/* Frame preview — height grows with selected size */}
              <div style={{
                width:'100%',
                minHeight:`${frameH + 80}px`,
                background:'var(--bg)',
                display:'flex', alignItems:'center', justifyContent:'center',
                borderRadius:'1rem', overflow:'hidden', padding:'2.5rem 2rem',
                position:'relative',
                transition:'min-height .45s ease',
              }}>
                {/* Frame — border colour and thickness update with selectedColour and selectedSize */}
                <div style={{
                  position:'relative',
                  border:`${FRAME_BW[selectedSize]||14}px solid ${FRAME_COLOUR_HEX[selectedColour]||'#1C1C1C'}`,
                  boxShadow:FRAME_SHADOW[selectedColour]||FRAME_SHADOW.Black,
                  height:`${frameH}px`,
                  width:`${frameW}px`,
                  maxWidth:'calc(100% - 2rem)',
                  flexShrink:0,
                  overflow:'hidden',
                  borderRadius:'1px',
                  transition:'border-color .4s ease,border-width .4s ease,box-shadow .4s ease,height .45s ease,width .45s ease',
                }}>
                  {art ? (
                    <div style={{width:'100%',height:'100%',overflow:'hidden',background:`${art.fc}cc`}}>
                      <div style={{width:'100%',height:'100%'}} dangerouslySetInnerHTML={{__html:
                        art.art
                          .replace(/preserveAspectRatio="[^"]*" */g, '')
                          .replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block;" ')
                      }} />
                    </div>
                  ) : (
                    <div style={{width:'100%',height:'100%',background:'linear-gradient(150deg,#F7F3EC,#EDE7D9)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',padding:'1.2rem',textAlign:'center'}}>
                      <div style={{fontFamily:'var(--fd)',fontSize:'1rem',color:'var(--text)',lineHeight:1.4}}>{product.name}</div>
                      <div style={{fontSize:'.72rem',color:'var(--muted)',marginTop:'.5rem'}}>{selectedSize} · {selectedColour}</div>
                    </div>
                  )}
                  {/* Gloss overlay */}
                  <div style={{position:'absolute',inset:0,background:'linear-gradient(148deg,rgba(255,255,255,.12) 0%,rgba(255,255,255,.03) 35%,transparent 60%)',pointerEvents:'none'}} />
                </div>
              </div>
            </div>
            {/* Thumbnails — one per available colour for current size; clicking changes frame colour */}
            <div className="gallery-thumbs" style={{display:'flex',gap:'.5rem',marginTop:'.75rem'}}>
              {availableColours.map(col => {
                const isActive = col === selectedColour;
                const thumbHex = FRAME_COLOUR_HEX[col] || '#1C1C1C';
                return (
                  <div key={col} onClick={()=>setSelectedColour(col)} style={{
                    width:'64px', height:'64px', borderRadius:'.5rem', cursor:'pointer',
                    background:'var(--bg)',
                    border:`2px solid ${isActive?'var(--gold)':'var(--cream)'}`,
                    overflow:'hidden', position:'relative',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'border-color .2s',
                    flexShrink:0,
                  }}>
                    <div style={{border:`5px solid ${thumbHex}`,width:'40px',height:'52px',overflow:'hidden',flexShrink:0,boxShadow:'0 3px 10px rgba(0,0,0,.18)'}}>
                      {art ? (
                        <div style={{width:'100%',height:'100%',overflow:'hidden',background:`${art.fc}cc`}}>
                          <div style={{width:'100%',height:'100%'}} dangerouslySetInnerHTML={{__html:
                            art.art
                              .replace(/preserveAspectRatio="[^"]*" */g, '')
                              .replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block;" ')
                          }} />
                        </div>
                      ) : (
                        <div style={{width:'100%',height:'100%',background:'#EDE7D9'}} />
                      )}
                    </div>
                    <div style={{position:'absolute',bottom:'2px',left:0,right:0,textAlign:'center',fontSize:'.42rem',color:isActive?'var(--gold)':'var(--muted)',letterSpacing:'.06em',fontWeight:700,textTransform:'uppercase'}}>{col}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info */}
          <div className="product-info">
            <div style={{display:'flex',gap:'.5rem',marginBottom:'.8rem',flexWrap:'wrap'}}>
              {product.bestSeller && <span className="badge" style={{background:'var(--gold)',color:'#fff'}}>Best Seller</span>}
              {product.newArrival && <span className="badge" style={{background:'#22C55E',color:'#fff'}}>New</span>}
            </div>
            <h1 className="product-name" style={{fontFamily:'var(--fd)',fontSize:'clamp(1.5rem,2.5vw,2rem)',marginBottom:'.5rem'}}>{product.name}</h1>
            <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.8rem'}}>
              <span className="stars" style={{color:'#F59E0B',fontSize:'1rem'}}>{'★'.repeat(Math.round(product.rating))}</span>
              <span style={{fontSize:'.85rem',color:'var(--muted)'}}>({product.reviewCount} reviews)</span>
            </div>

            {/* Dynamic price from selected frame option */}
            <div style={{display:'flex',alignItems:'baseline',gap:'.75rem',marginBottom:'1.2rem'}}>
              <span className="price-now" style={{fontSize:'1.6rem',fontFamily:'var(--fd)',fontWeight:700}}>
                ₹{price.toLocaleString('en-IN')}
              </span>
              <span style={{fontSize:'.82rem',color:'var(--muted)'}}>PS Moulding · Free Delivery</span>
            </div>

            {/* Frame Size */}
            <div style={{marginBottom:'1rem'}}>
              <div style={{fontSize:'.8rem',fontWeight:600,marginBottom:'.5rem',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--muted)'}}>
                Frame Size: {selectedSize}
              </div>
              <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap'}}>
                {FRAME_SIZES.map(s => (
                  <button key={s} onClick={()=>handleSizeChange(s)} style={{
                    padding:'.4rem .9rem',borderRadius:'.4rem',
                    border:`1.5px solid ${selectedSize===s?'var(--gold)':'var(--cream)'}`,
                    background:selectedSize===s?'rgba(182,141,64,.08)':'#fff',
                    cursor:'pointer',fontSize:'.82rem',fontWeight:selectedSize===s?600:400,
                    color:selectedSize===s?'var(--gold)':'var(--text)',
                  }}>{s}</button>
                ))}
              </div>
              <div style={{fontSize:'.75rem',color:'var(--muted)',marginTop:'.35rem'}}>
                Actual size: {actualSize}
              </div>
            </div>

            {/* Orientation */}
            <div style={{marginBottom:'1rem'}}>
              <div style={{fontSize:'.8rem',fontWeight:600,marginBottom:'.5rem',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--muted)'}}>
                Orientation: {selectedOrientation === 'Vertical' ? 'Vertical / Portrait' : 'Horizontal / Landscape'}
              </div>
              <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap'}}>
                {[
                  { key:'Vertical',   label:'Vertical',   icon:'▯' },
                  { key:'Horizontal', label:'Horizontal', icon:'▭' },
                ].map(({ key, label, icon }) => (
                  <button key={key} onClick={()=>setSelectedOrientation(key)} style={{
                    padding:'.4rem .9rem', borderRadius:'.4rem', cursor:'pointer',
                    border:`1.5px solid ${selectedOrientation===key?'var(--gold)':'var(--cream)'}`,
                    background:selectedOrientation===key?'rgba(182,141,64,.08)':'#fff',
                    fontSize:'.82rem', fontWeight:selectedOrientation===key?600:400,
                    color:selectedOrientation===key?'var(--gold)':'var(--text)',
                    display:'flex', alignItems:'center', gap:'.35rem',
                  }}>
                    <span style={{fontSize:'.9rem',lineHeight:1}}>{icon}</span> {label}
                  </button>
                ))}
              </div>
              <div style={{fontSize:'.75rem',color:'var(--muted)',marginTop:'.35rem'}}>
                {actualSize}
              </div>
            </div>

            {/* Frame Colour — only shows colours valid for selected size */}
            <div style={{marginBottom:'1.5rem'}}>
              <div style={{fontSize:'.8rem',fontWeight:600,marginBottom:'.5rem',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--muted)'}}>
                Frame Colour: {selectedColour}
              </div>
              <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap'}}>
                {availableColours.map(c => (
                  <button key={c} onClick={()=>setSelectedColour(c)} style={{
                    padding:'.4rem .9rem',borderRadius:'.4rem',
                    border:`1.5px solid ${selectedColour===c?'var(--gold)':'var(--cream)'}`,
                    background:selectedColour===c?'rgba(182,141,64,.08)':'#fff',
                    cursor:'pointer',fontSize:'.82rem',fontWeight:selectedColour===c?600:400,
                    color:selectedColour===c?'var(--gold)':'var(--text)',
                  }}>{c}</button>
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
              <button className="btn btn-gold btn-lg" style={{flex:1}} onClick={handleAddToCart}>
                Add to Cart · ₹{(price * qty).toLocaleString('en-IN')}
              </button>
            </div>
            <button className="btn btn-outline" style={{width:'100%',marginBottom:'1.2rem'}} onClick={()=>{
              window.open(`https://wa.me/917070728989?text=${encodeURIComponent(waMsg)}`, '_blank');
            }}>🟢 Order on WhatsApp</button>

            {/* Delivery info */}
            <div style={{display:'flex',flexDirection:'column',gap:'.6rem',fontSize:'.82rem',color:'var(--muted)',background:'var(--bg)',borderRadius:'.75rem',padding:'1rem'}}>
              <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><path d="m16 8 5 1v5h-5z"/></svg> Free Delivery Across India — On All Orders</div>
              <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Delivered in 5–7 business days</div>
              <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> Handcrafted to order · PS Moulding</div>
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
