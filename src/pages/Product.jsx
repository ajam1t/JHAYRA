import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useScrollReveal } from '../components/ScrollReveal';
import { useProduct } from '../hooks/useProducts';
import { useProductConfig } from '../hooks/useProductConfig';
import { PRODUCT_ART } from '../data/artwork';
import { frameGeometry } from '../data/frameOptions';
import { uploadCustomerArtwork } from '../lib/artwork';
import FramedArt from '../components/FramedArt';
import PhotoEditModal from '../components/PhotoEditModal';
import SEO from '../components/SEO';

/* Show "Read more" when description exceeds this many characters */
const DESC_THRESHOLD = 160;

export default function Product() {
  useScrollReveal();
  const { addToCartWithFrame } = useCart();
  const { toast } = useToast();
  const galleryRef = useRef(null);
  const { id } = useParams();
  const { product, loading } = useProduct(id || 'p001');
  const { config } = useProductConfig(product?.dbId);
  const art = PRODUCT_ART[product?.id];

  const [selectedSize,        setSelectedSize]        = useState('');
  const [selectedColour,      setSelectedColour]      = useState('');
  const [selectedMaterial,    setSelectedMaterial]    = useState('');
  const [selectedOrientation, setSelectedOrientation] = useState('Vertical');
  const [artIdx,      setArtIdx]      = useState(0);
  const [qty,         setQty]         = useState(1);
  const [shareOpen,   setShareOpen]   = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [descExpanded,setDescExpanded]= useState(false);

  /* Replace-image (#7) — customer uploads their own photo into this frame config */
  const [rpPhoto,     setRpPhoto]     = useState(null);
  const [rpMeta,      setRpMeta]      = useState(null);
  const [rpTransform, setRpTransform] = useState({ zoom: 1, panX: 0, panY: 0 });
  const [rpEditing,   setRpEditing]   = useState(false);
  const [rpAdding,    setRpAdding]    = useState(false);

  /* Keep selections valid as the per-product config loads */
  useEffect(() => {
    if (!config) return;
    const dSize = config.sizes.find(s => s.isDefault)?.name || config.sizes[0]?.name || '';
    const dCol  = config.colours.find(c => c.isDefault)?.name || config.colours[0]?.name || '';
    const dMat  = config.materials.find(m => m.isDefault)?.name || config.materials[0]?.name || '';
    setSelectedSize(prev => config.sizes.some(s => s.name === prev) ? prev : dSize);
    setSelectedColour(prev => config.colours.some(c => c.name === prev) ? prev : dCol);
    setSelectedMaterial(prev => config.materials.some(m => m.name === prev) ? prev : dMat);
  }, [config]);

  /* Resolve the current selection against the config */
  const sizeCfg = config.sizes.find(s => s.name === selectedSize)     || config.sizes[0];
  const colCfg  = config.colours.find(c => c.name === selectedColour) || config.colours[0];
  const matCfg  = config.materials.find(m => m.name === selectedMaterial) || config.materials[0];
  const price   = sizeCfg?.price ?? product?.price ?? 499;

  /* Frame geometry — driven by the selected size's aspect ratio */
  const { frameH, frameW, actualSize } = frameGeometry(
    sizeCfg?.name || 'A4', selectedOrientation, undefined,
    sizeCfg?.ratioW && sizeCfg?.ratioH ? { w: sizeCfg.ratioW, h: sizeCfg.ratioH } : undefined,
  );

  /* Artwork variants (#6) — a product can have multiple swipeable artworks.
     Falls back to a single studio SVG when no photos are uploaded. */
  const artworks   = product?.imageRows || [];
  const currentArt = artworks.length ? artworks[Math.min(artIdx, artworks.length - 1)] : null;
  const realImg    = currentArt?.url || product?.thumbnail || '';
  const useSvgArt  = !realImg && !!art;
  const photoEligible = !!product?.customer_photo_eligible;

  /* Preview shows the customer's replacement photo when present, else the artwork */
  const previewSrc       = rpPhoto || realImg || undefined;
  const previewTransform = rpPhoto ? rpTransform : null;

  const handleSizeChange = (size) => setSelectedSize(size);

  const handleReplaceUpload = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target.result;
      const img = new Image();
      const done = (w, h) => { setRpPhoto(dataUrl); setRpMeta({ name: f.name || null, size: f.size || null, type: f.type || null, width: w, height: h }); setRpTransform({ zoom: 1, panX: 0, panY: 0 }); toast('Your photo is in the frame — adjust & add to cart'); };
      img.onload  = () => done(img.naturalWidth, img.naturalHeight);
      img.onerror = () => done(null, null);
      img.src = dataUrl;
    };
    reader.readAsDataURL(f);
    e.target.value = '';
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

  /* Synthetic frame option built from the per-product config selection */
  const buildFrameOption = () => ({
    id: `${sizeCfg?.slug || 'a4'}_${colCfg?.slug || 'black'}_${matCfg?.slug || 'ps-moulding'}`,
    size: selectedSize, dimensions: sizeCfg?.dimensions || actualSize,
    material: selectedMaterial, colour: selectedColour, price,
  });

  const handleAddToCart = () => {
    if (!sizeCfg || !colCfg) return;
    addToCartWithFrame(product.id, buildFrameOption(), product.name, qty, selectedOrientation, price, {
      customization: { material: selectedMaterial, artworkVariant: currentArt?.title || currentArt?.id || null },
    });
    toast('Added to cart ✓');
  };

  /* #7 — add the customer's own photo in this exact frame configuration */
  const handleAddReplacement = async () => {
    if (!rpPhoto || rpAdding) return;
    setRpAdding(true);
    try {
      const up = await uploadCustomerArtwork([{ dataUrl: rpPhoto, name: rpMeta?.name, width: rpMeta?.width, height: rpMeta?.height }]);
      if (up.supabaseEnabled && up.uploaded < up.requested) { toast('Photo upload failed — please try again.'); return; }
      addToCartWithFrame('custom', buildFrameOption(), `${product.name} — Your Photo`, qty, selectedOrientation, price, {
        artworkPaths: up.paths,
        customization: {
          source: 'product-replace', productId: product.id, productName: product.name,
          material: selectedMaterial, orientation: selectedOrientation,
          transform: rpTransform, artworkMeta: up.meta,
        },
      });
      toast('Your custom photo frame was added to cart ✓');
      setRpPhoto(null); setRpMeta(null);
    } finally { setRpAdding(false); }
  };

  const waMsg = `Hello JHAYRA! I'd like to order:\n• ${product.name}\n  Frame: ${selectedSize} · ${selectedOrientation} · ${actualSize} · ${selectedColour} ${selectedMaterial}\n  Qty: ${qty} — ₹${(price * qty).toLocaleString('en-IN')}\n\nPlease confirm.`;

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
                height:'100%',
                background:'var(--bg)',
                display:'flex', alignItems:'center', justifyContent:'center',
                borderRadius:'1rem', overflow:'hidden', padding:'1.75rem',
                position:'relative',
              }}>
                {/* JHAYRA renders the frame — clean artwork is fitted into the
                    opening and the frame responds live to size, orientation and
                    colour. fitContainer makes the frame scale to fit this box for
                    EVERY size (incl. 24×36) instead of overflowing at fixed px. */}
                <FramedArt
                  size={selectedSize || 'A4'}
                  orientation={selectedOrientation}
                  colour={selectedColour}
                  hex={colCfg?.hex}
                  ratioW={sizeCfg?.ratioW}
                  ratioH={sizeCfg?.ratioH}
                  fitContainer
                  fit="cover"
                  src={previewSrc}
                  transform={previewTransform}
                  svg={!previewSrc && useSvgArt ? art.art : undefined}
                  background={useSvgArt ? `${art.fc}cc` : 'linear-gradient(150deg,#F7F3EC,#EDE7D9)'}
                  alt={product.name}
                  placeholder={
                    <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',padding:'1.2rem',textAlign:'center'}}>
                      <div style={{fontFamily:'var(--fd)',fontSize:'1rem',color:'var(--text)',lineHeight:1.4}}>{product.name}</div>
                      <div style={{fontSize:'.72rem',color:'var(--muted)',marginTop:'.5rem'}}>{selectedSize} · {selectedColour}</div>
                    </div>
                  }
                />
                {rpPhoto && (
                  <button onClick={()=>setRpEditing(true)} style={{position:'absolute',bottom:'.8rem',left:'50%',transform:'translateX(-50%)',display:'inline-flex',alignItems:'center',gap:'.35rem',background:'rgba(255,255,255,.92)',border:'1.5px solid var(--cream)',color:'var(--text)',fontSize:'.72rem',fontWeight:700,padding:'.4rem .9rem',borderRadius:'var(--pill)',cursor:'pointer',boxShadow:'0 2px 8px rgba(0,0,0,.12)'}}>
                    <svg viewBox="0 0 24 24" style={{width:'13px',height:'13px',stroke:'currentColor',fill:'none',strokeWidth:2}}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    Crop · Zoom · Reposition
                  </button>
                )}
              </div>
            </div>

            {/* Artwork variants (#6) — swipe/click through multiple product artworks */}
            {artworks.length > 1 && !rpPhoto && (
              <div style={{display:'flex',gap:'.5rem',marginTop:'.75rem',flexWrap:'wrap',justifyContent:'center'}}>
                {artworks.map((a, i) => (
                  <button key={a.id || i} onClick={()=>setArtIdx(i)} aria-label={`Artwork ${i+1}`}
                    style={{width:'56px',height:'56px',borderRadius:'.5rem',overflow:'hidden',cursor:'pointer',padding:0,background:'#fff',
                      border:`2px solid ${i===artIdx?'var(--gold)':'var(--cream)'}`,flexShrink:0}}>
                    <img src={a.url} alt={a.alt_text||a.title||`Artwork ${i+1}`} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
                  </button>
                ))}
              </div>
            )}

            {/* Colour swatches — live frame-colour preview of THIS artwork.
                Works for real photos and studio SVG alike (hidden on mobile via
                CSS .gallery-thumbs{display:none}). */}
            <div className="gallery-thumbs" style={{display:'flex',gap:'.5rem',marginTop:'.75rem',flexWrap:'wrap'}}>
              {config.colours.map(col => {
                const isActive = col.name === selectedColour;
                return (
                  <div key={col.slug} onClick={()=>setSelectedColour(col.name)} style={{
                    width:'64px',height:'64px',borderRadius:'.5rem',cursor:'pointer',
                    background:'var(--bg)',
                    border:`2px solid ${isActive?'var(--gold)':'var(--cream)'}`,
                    overflow:'hidden',position:'relative',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    transition:'border-color .2s',flexShrink:0,
                  }}>
                    <FramedArt
                      size="A4"
                      orientation="Vertical"
                      colour={col.name}
                      hex={col.hex}
                      fit="cover"
                      baseH={46}
                      gloss={false}
                      src={realImg || undefined}
                      svg={useSvgArt ? art.art : undefined}
                      background={useSvgArt ? `${art.fc}cc` : '#EDE7D9'}
                      style={{boxShadow:'0 3px 10px rgba(0,0,0,.18)'}}
                    />
                    <div style={{position:'absolute',bottom:'2px',left:0,right:0,textAlign:'center',fontSize:'.42rem',color:isActive?'var(--gold)':'var(--muted)',letterSpacing:'.06em',fontWeight:700,textTransform:'uppercase'}}>{col.name}</div>
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
              <span style={{fontSize:'.8rem',color:'var(--muted)'}}>{selectedMaterial || 'PS Moulding'} · Free Delivery</span>
            </div>

            {/* Frame Size — per-product options with per-size pricing */}
            <div>
              <div style={optLabel}>
                Frame Size: <span style={{color:'var(--text)',fontWeight:500,textTransform:'none',letterSpacing:0}}>{selectedSize}</span>
              </div>
              <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap'}}>
                {config.sizes.map(s => (
                  <button key={s.slug} onClick={()=>handleSizeChange(s.name)} style={optBtn(selectedSize===s.name)}>
                    {s.name} <span style={{opacity:.7,fontSize:'.72rem'}}>· ₹{s.price.toLocaleString('en-IN')}</span>
                  </button>
                ))}
              </div>
              <div style={{fontSize:'.72rem',color:'var(--muted)',marginTop:'.3rem'}}>
                Actual size: {actualSize}
              </div>
            </div>

            {/* Frame Material — per-product options (#5) */}
            {config.materials.length > 0 && (
              <div>
                <div style={optLabel}>
                  Material: <span style={{color:'var(--text)',fontWeight:500,textTransform:'none',letterSpacing:0}}>{selectedMaterial}</span>
                </div>
                <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap'}}>
                  {config.materials.map(m => (
                    <button key={m.slug} onClick={()=>setSelectedMaterial(m.name)} style={optBtn(selectedMaterial===m.name)}>{m.name}</button>
                  ))}
                </div>
              </div>
            )}

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

            {/* Frame Colour — per-product options with real colour swatch */}
            <div>
              <div style={optLabel}>
                Frame Colour: <span style={{color:'var(--text)',fontWeight:500,textTransform:'none',letterSpacing:0}}>{selectedColour}</span>
              </div>
              <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap'}}>
                {config.colours.map(c => (
                  <button key={c.slug} onClick={()=>setSelectedColour(c.name)}
                    style={{...optBtn(selectedColour===c.name),display:'flex',alignItems:'center',gap:'.4rem'}}>
                    <span style={{width:'12px',height:'12px',borderRadius:'50%',background:c.hex,border:'1px solid rgba(0,0,0,.15)',flexShrink:0}} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Replace Image (#7) — customer's own photo, keeping this frame config */}
            {photoEligible && (
              <div style={{border:'1.5px dashed var(--cream)',borderRadius:'.6rem',padding:'.75rem .9rem',background:'var(--bg)'}}>
                {!rpPhoto ? (
                  <label style={{display:'flex',alignItems:'center',gap:'.6rem',cursor:'pointer'}}>
                    <input type="file" accept="image/*" style={{display:'none'}} onChange={handleReplaceUpload} />
                    <span style={{width:'34px',height:'34px',borderRadius:'50%',background:'var(--gold)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <svg viewBox="0 0 24 24" style={{width:'17px',height:'17px',stroke:'#fff',fill:'none',strokeWidth:2}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </span>
                    <span>
                      <span style={{display:'block',fontWeight:700,fontSize:'.85rem',color:'var(--text)'}}>Replace with your photo</span>
                      <span style={{fontSize:'.72rem',color:'var(--muted)'}}>Same frame · size · colour — we fit your photo in.</span>
                    </span>
                  </label>
                ) : (
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'.6rem',flexWrap:'wrap'}}>
                    <span style={{fontSize:'.82rem',color:'#22873A',fontWeight:600,display:'inline-flex',alignItems:'center',gap:'.35rem'}}>
                      ✓ Your photo is in the frame
                    </span>
                    <div style={{display:'flex',gap:'.4rem'}}>
                      <button onClick={()=>setRpEditing(true)} style={{...optBtn(false),fontSize:'.75rem'}}>Adjust</button>
                      <button onClick={()=>{setRpPhoto(null);setRpMeta(null);}} style={{...optBtn(false),fontSize:'.75rem'}}>Use original</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Qty + Add to Cart */}
            <div style={{display:'flex',gap:'.6rem',alignItems:'center',flexWrap:'wrap'}}>
              <div className="qty" style={{display:'flex',alignItems:'center',gap:'.4rem'}}>
                <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:'32px',height:'32px',border:'1.5px solid var(--cream)',borderRadius:'.4rem',background:'#fff',cursor:'pointer',fontSize:'1rem'}}>−</button>
                <span style={{minWidth:'24px',textAlign:'center',fontWeight:600}}>{qty}</span>
                <button onClick={()=>setQty(q=>q+1)} style={{width:'32px',height:'32px',border:'1.5px solid var(--cream)',borderRadius:'.4rem',background:'#fff',cursor:'pointer',fontSize:'1rem'}}>+</button>
              </div>
              {rpPhoto ? (
                <button className="btn btn-gold btn-lg" style={{flex:1,opacity:rpAdding?0.7:1}} disabled={rpAdding} onClick={handleAddReplacement}>
                  {rpAdding ? 'Adding…' : `Add My Photo Frame · ₹${(price * qty).toLocaleString('en-IN')}`}
                </button>
              ) : (
                <button className="btn btn-gold btn-lg" style={{flex:1}} onClick={handleAddToCart}>
                  Add to Cart · ₹{(price * qty).toLocaleString('en-IN')}
                </button>
              )}
            </div>

            {/* Replacement reassurance */}
            <div style={{display:'flex',alignItems:'center',gap:'.4rem',fontSize:'.76rem',color:'var(--muted)'}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Personalized with care.{' '}
              <Link to="/replacement-policy" style={{color:'var(--gold)',fontWeight:600}}>
                Replacement support
              </Link>{' '}
              available for eligible issues.
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
                Handcrafted to order · {selectedMaterial || 'PS Moulding'}
              </div>
            </div>

          </div>
          {/* end .product-info */}

        </div>
      </div>

      {rpEditing && rpPhoto && (
        <PhotoEditModal
          photo={rpPhoto}
          slotLabel="Your Photo"
          initial={rpTransform}
          onConfirm={(t)=>setRpTransform(t)}
          onClose={()=>setRpEditing(false)}
        />
      )}
    </div>
  );
}
