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
/* Physical portrait dimensions (inches) */
const SIZE_DIMS = {
  'A4':     { w:9.5, h:13 },
  'A3+':    { w:12,  h:18 },
  '18 × 24':{ w:18,  h:24 },
  '24 × 36':{ w:24,  h:36 },
};
/* Portrait display height (px) per size — determines overall visual scale */
const FRAME_SCALE_H = { 'A4':320, 'A3+':390, '18 × 24':470, '24 × 36':560 };

/* Show "Read more" when description exceeds this many characters */
const DESC_THRESHOLD = 160;

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
  const [qty,         setQty]         = useState(1);
  const [shareOpen,   setShareOpen]   = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [descExpanded,setDescExpanded]= useState(false);

  const availableColours = coloursForSize(selectedSize);
  const frameOption      = getFrameOption(selectedSize, selectedColour);
  const price            = frameOption?.price ?? product?.price ?? 499;

  /* Frame geometry — portrait dims flipped for landscape */
  const isPortrait = selectedOrientation === 'Vertical';
  const dims    = SIZE_DIMS[selectedSize] || { w:18, h:24 };
  const scaleH  = FRAME_SCALE_H[selectedSize] || 320;
  const scaleW  = Math.round(scaleH * dims.w / dims.h);
  const frameH  = isPortrait ? scaleH : scaleW;
  const frameW  = isPortrait ? scaleW : scaleH;
  const actualSize = isPortrait
    ? `${dims.w} × ${dims.h} inches`
    : `${dims.h} × ${dims.w} inches`;

  /* When size changes, reset colour to first available for that size */
  const handleSizeChange = (size) => {
    setSelectedSize(size);
    const cols = coloursForSize(size);
    if (!cols.includes(selectedColour)) setSelectedColour(cols[0]);
  };

  /* 3D tilt on desktop */
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

  /* Close share menu on Escape */
  useEffect(() => {
    if (!shareOpen) return;
    const onKey = e => { if (e.key === 'Escape') setShareOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shareOpen]);

  if (loading) return (
    <div className="container" style={{padding:'4rem 0',textAlign:'center',color:'var(--muted)'}}>
      Loading…
    </div>
  );
  if (!product) return (
    <div className="container" style={{padding:'4rem 0',textAlign:'center'}}>
      Product not found.
    </div>
  );

  const handleAddToCart = () => {
    if (!frameOption) return;
    addToCartWithFrame(product.id, frameOption, product.name, qty, selectedOrientation, frameOption?.price ?? product.price);
    toast('Added to cart ✓');
  };

  const waMsg = `Hello JHAYRA! I'd like to order:\n• ${product.name}\n  Frame: ${selectedSize} · ${selectedOrientation} · ${actualSize} · ${selectedColour} PS Moulding\n  Qty: ${qty} — ₹${(price * qty).toLocaleString('en-IN')}\n\nPlease confirm.`;

  const productId  = id || product.id;
  const productUrl = `https://jhayra.com/product/${productId}`;
  const waShareMsg = `I found this beautiful JHAYRA product:\n\n${product.name}\n${productUrl}`;

  async function handleNativeShare() {
    setShareOpen(false);
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: `Check out this beautiful JHAYRA product: ${product.name}`, url: productUrl });
      } catch (e) {
        if (e.name !== 'AbortError') {
          await handleCopyLink();
          alert('Link copied — open Instagram and paste to share.');
        }
      }
    } else {
      await handleCopyLink();
      alert('Link copied — open Instagram and paste to share.');
    }
  }

  async function handleCopyLink() {
    setShareOpen(false);
    try {
      await navigator.clipboard.writeText(productUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = productUrl;
      ta.style.position = 'fixed';
      ta.style.opacity  = '0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const productImageUrl = (product.images && product.images.length > 0)
    ? product.images[0]
    : 'https://jhayra.com/Images/personalized.jpg';

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `https://jhayra.com/product/${productId}#product`,
    name: product.name,
    description: product.description,
    sku: product.id,
    brand: { '@type': 'Brand', name: 'JHAYRA' },
    image: productImageUrl,
    url: `https://jhayra.com/product/${productId}`,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'INR',
      availability: product.stockStatus === 'in-stock'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `https://jhayra.com/product/${productId}`,
      priceValidUntil: '2027-12-31',
      seller: { '@type': 'Organization', name: 'JHAYRA', url: 'https://jhayra.com' },
    },
    ...(product.rating && product.reviewCount ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
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

  const isLongDesc = product.description && product.description.length > DESC_THRESHOLD;

  /* ── shared option-button style ── */
  const optBtn = (active) => ({
    padding: '.35rem .85rem',
    borderRadius: '.4rem',
    border: `1.5px solid ${active ? 'var(--gold)' : 'var(--cream)'}`,
    background: active ? 'rgba(182,141,64,.08)' : '#fff',
    cursor: 'pointer',
    fontSize: '.82rem',
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--gold)' : 'var(--text)',
  });

  /* ── shared option-label style ── */
  const optLabel = {
    fontSize: '.75rem',
    fontWeight: 600,
    marginBottom: '.4rem',
    letterSpacing: '.08em',
    textTransform: 'uppercase',
    color: 'var(--muted)',
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

          {/* ── Gallery ─────────────────────────────────────────── */}
          <div className="product-gallery-col">
            <div className="gallery-main" ref={galleryRef} style={{transition:'transform .12s ease',cursor:'crosshair'}}>
              <div className="product-gallery-area" style={{
                width:'100%',
                minHeight:`${frameH + 80}px`,
                background:'var(--bg)',
                display:'flex', alignItems:'center', justifyContent:'center',
                borderRadius:'1rem', overflow:'hidden', padding:'2.5rem 2rem',
                position:'relative',
                transition:'min-height .45s ease',
              }}>
                <div className="product-frame-box" style={{
                  position:'relative',
                  border:`${FRAME_BW[selectedSize]||14}px solid ${FRAME_COLOUR_HEX[selectedColour]||'#1C1C1C'}`,
                  boxShadow:FRAME_SHADOW[selectedColour]||FRAME_SHADOW.Black,
                  height:`${frameH}px`,
                  width:`${frameW}px`,
                  maxWidth:'calc(100% - 2rem)',
                  aspectRatio:`${frameW} / ${frameH}`,
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

            {/* Colour swatches — hidden on mobile via CSS (.gallery-thumbs{display:none}) */}
            <div className="gallery-thumbs" style={{display:'flex',gap:'.5rem',marginTop:'.75rem'}}>
              {availableColours.map(col => {
                const isActive  = col === selectedColour;
                const thumbHex  = FRAME_COLOUR_HEX[col] || '#1C1C1C';
                return (
                  <div key={col} onClick={()=>setSelectedColour(col)} style={{
                    width:'64px',height:'64px',borderRadius:'.5rem',cursor:'pointer',
                    background:'var(--bg)',
                    border:`2px solid ${isActive?'var(--gold)':'var(--cream)'}`,
                    overflow:'hidden',position:'relative',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    transition:'border-color .2s',flexShrink:0,
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

          {/* ── Info ─────────────────────────────────────────────
               Mobile order: title → description → rating → price
               → frame size → orientation → colour → qty+cart
               → whatsapp+share → delivery                       */}
          <div className="product-info">

            {/* Badges */}
            {(product.bestSeller || product.newArrival) && (
              <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap'}}>
                {product.bestSeller && <span className="badge" style={{background:'var(--gold)',color:'#fff'}}>Best Seller</span>}
                {product.newArrival && <span className="badge" style={{background:'#22C55E',color:'#fff'}}>New</span>}
              </div>
            )}

            {/* Title */}
            <h1 className="product-name" style={{fontFamily:'var(--fd)',fontSize:'clamp(1.3rem,2.5vw,2rem)',margin:0,lineHeight:1.2}}>
              {product.name}
            </h1>

            {/* Description — directly below title with Read more / Read less */}
            {product.description && (
              <div>
                <p style={{
                  color:'var(--muted)',
                  lineHeight:1.65,
                  fontSize:'.88rem',
                  margin:0,
                  ...(descExpanded ? {} : {
                    display:'-webkit-box',
                    WebkitLineClamp:3,
                    WebkitBoxOrient:'vertical',
                    overflow:'hidden',
                  }),
                }}>
                  {product.description}
                </p>
                {isLongDesc && (
                  <button
                    onClick={() => setDescExpanded(e => !e)}
                    style={{
                      fontSize:'.78rem',color:'var(--gold)',fontWeight:600,
                      marginTop:'.25rem',padding:0,background:'none',
                      border:'none',cursor:'pointer',letterSpacing:'.01em',
                    }}
                  >
                    {descExpanded ? 'Read less ↑' : 'Read more ↓'}
                  </button>
                )}
              </div>
            )}

            {/* Rating */}
            <div style={{display:'flex',alignItems:'center',gap:'.4rem'}}>
              <span className="stars" style={{color:'#F59E0B',fontSize:'.95rem'}}>
                {'★'.repeat(Math.round(product.rating))}
              </span>
              <span style={{fontSize:'.82rem',color:'var(--muted)'}}>
                ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div style={{display:'flex',alignItems:'baseline',gap:'.6rem',flexWrap:'wrap'}}>
              <span className="price-now" style={{fontSize:'1.55rem',fontFamily:'var(--fd)',fontWeight:700}}>
                ₹{price.toLocaleString('en-IN')}
              </span>
              <span style={{fontSize:'.8rem',color:'var(--muted)'}}>PS Moulding · Free Delivery</span>
            </div>

            {/* Frame Size */}
            <div>
              <div style={optLabel}>
                Frame Size: <span style={{color:'var(--text)',fontWeight:500,textTransform:'none',letterSpacing:0}}>{selectedSize}</span>
              </div>
              <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap'}}>
                {FRAME_SIZES.map(s => (
                  <button key={s} onClick={()=>handleSizeChange(s)} style={optBtn(selectedSize===s)}>{s}</button>
                ))}
              </div>
              <div style={{fontSize:'.72rem',color:'var(--muted)',marginTop:'.3rem'}}>
                Actual size: {actualSize}
              </div>
            </div>

            {/* Orientation */}
            <div>
              <div style={optLabel}>
                Orientation: <span style={{color:'var(--text)',fontWeight:500,textTransform:'none',letterSpacing:0}}>
                  {selectedOrientation === 'Vertical' ? 'Portrait' : 'Landscape'}
                </span>
              </div>
              <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap'}}>
                {[
                  { key:'Vertical',   label:'Vertical',   icon:'▯' },
                  { key:'Horizontal', label:'Horizontal', icon:'▭' },
                ].map(({ key, label, icon }) => (
                  <button key={key} onClick={()=>setSelectedOrientation(key)}
                    style={{...optBtn(selectedOrientation===key),display:'flex',alignItems:'center',gap:'.3rem'}}
                  >
                    <span style={{fontSize:'.85rem',lineHeight:1}}>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Frame Colour */}
            <div>
              <div style={optLabel}>
                Frame Colour: <span style={{color:'var(--text)',fontWeight:500,textTransform:'none',letterSpacing:0}}>{selectedColour}</span>
              </div>
              <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap'}}>
                {availableColours.map(c => (
                  <button key={c} onClick={()=>setSelectedColour(c)} style={optBtn(selectedColour===c)}>{c}</button>
                ))}
              </div>
            </div>

            {/* Qty + Add to Cart */}
            <div style={{display:'flex',gap:'.6rem',alignItems:'center',flexWrap:'wrap'}}>
              <div className="qty" style={{display:'flex',alignItems:'center',gap:'.4rem'}}>
                <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:'32px',height:'32px',border:'1.5px solid var(--cream)',borderRadius:'.4rem',background:'#fff',cursor:'pointer',fontSize:'1rem'}}>−</button>
                <span style={{minWidth:'24px',textAlign:'center',fontWeight:600}}>{qty}</span>
                <button onClick={()=>setQty(q=>q+1)} style={{width:'32px',height:'32px',border:'1.5px solid var(--cream)',borderRadius:'.4rem',background:'#fff',cursor:'pointer',fontSize:'1rem'}}>+</button>
              </div>
              <button className="btn btn-gold btn-lg" style={{flex:1}} onClick={handleAddToCart}>
                Add to Cart · ₹{(price * qty).toLocaleString('en-IN')}
              </button>
            </div>

            {/* WhatsApp order + Share */}
            <div style={{display:'flex',gap:'.5rem',alignItems:'center',position:'relative'}}>
              <button className="btn btn-outline" style={{flex:1}} onClick={()=>{
                window.open(`https://wa.me/917070728989?text=${encodeURIComponent(waMsg)}`, '_blank');
              }}>🟢 Order on WhatsApp</button>

              <button
                className="btn btn-outline"
                style={{flexShrink:0,padding:'.85rem 1rem'}}
                aria-label="Share this product"
                onClick={() => setShareOpen(o => !o)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share
              </button>

              {shareOpen && (
                <>
                  <div className="share-backdrop" onClick={() => setShareOpen(false)} />
                  <div className="share-menu" style={{position:'absolute',bottom:'calc(100% + .5rem)',right:0}}>
                    <div className="share-menu-title">Share this product</div>

                    <button className="share-option share-opt-wa" onClick={() => {
                      setShareOpen(false);
                      const text = encodeURIComponent(waShareMsg);
                      if (/iPhone|iPad|Android/i.test(navigator.userAgent)) {
                        window.location.href = `whatsapp://send?text=${text}`;
                      } else {
                        window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener');
                      }
                    }}>
                      <span className="share-option-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      </span>
                      WhatsApp
                    </button>

                    <button className="share-option share-opt-ig" onClick={handleNativeShare}>
                      <span className="share-option-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="5"/>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                        </svg>
                      </span>
                      Instagram / Share
                    </button>

                    <button className="share-option share-opt-copy" onClick={handleCopyLink}>
                      <span className="share-option-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                      </span>
                      Copy Link
                    </button>

                    {copied && (
                      <div className="share-copied">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        Link copied!
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {copied && !shareOpen && (
              <div style={{fontSize:'.78rem',color:'var(--ok)',display:'flex',alignItems:'center',gap:'.3rem'}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Link copied to clipboard!
              </div>
            )}

            {/* Delivery info */}
            <div style={{display:'flex',flexDirection:'column',gap:'.5rem',fontSize:'.8rem',color:'var(--muted)',background:'var(--bg)',borderRadius:'.75rem',padding:'.85rem'}}>
              <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><path d="m16 8 5 1v5h-5z"/></svg>
                Free Delivery Across India — On All Orders
              </div>
              <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Delivered in 5–7 business days
              </div>
              <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                Handcrafted to order · PS Moulding
              </div>
            </div>

          </div>
          {/* end .product-info */}

        </div>
      </div>
    </div>
  );
}
