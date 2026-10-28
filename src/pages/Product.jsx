import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Frame from '../components/Frame';
import Img from '../components/Img';
import Icon from '../components/Icon';
import PanZoom, { IDENTITY, ZoomControls } from '../components/PanZoom';
import WallStudio from '../components/WallStudio';
import ProductCard, { Stars, categoryLabel } from '../components/ProductCard';
import { Seo } from '../lib/seo';
import { loadFrameConfig, useAsync, useCategories, useProducts } from '../lib/catalog';
import { useCart } from '../state/cart';
import { useShop, useToast } from '../state/store';
import { money, deliveryWindow, SITE, waLink } from '../lib/site';
import { readPhoto, uploadArtwork, QUALITY_LABEL } from '../lib/upload';
import { optimized } from '../lib/img';

export function PincodeCheck() {
  const [pin, setPin] = useState(() => {
    try {
      return localStorage.getItem('jhayra_pin') || '';
    } catch {
      return '';
    }
  });
  const [res, setRes] = useState(null);
  const win = deliveryWindow();
  useEffect(() => {
    if (!/^\d{6}$/.test(pin)) {
      setRes(null);
      return;
    }
    try {
      localStorage.setItem('jhayra_pin', pin);
    } catch {}
    setRes('loading');
    const ac = new AbortController();
    fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((d) => {
        const po = d?.[0]?.PostOffice?.[0];
        setRes(d?.[0]?.Status === 'Success' && po ? { city: po.District || po.Name, state: po.State } : 'bad');
      })
      .catch(() => setRes(null));
    return () => ac.abort();
  }, [pin]);
  return (
    <div className="pin">
      <label className="pin-field">
        <Icon name="pin" size={18} />
        <input inputMode="numeric" maxLength={6} placeholder="Enter pincode for delivery date" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} aria-label="Delivery pincode" />
      </label>
      <div className="pin-out" aria-live="polite">
        {res === 'loading' && <span className="muted">Checking…</span>}
        {res === 'bad' && <span style={{ color: 'var(--danger)' }}>We couldn't find that pincode — please check it.</span>}
        {res && typeof res === 'object' && (
          <span>
            <Icon name="truck" size={16} /> Free delivery to <b>{res.city}</b>, {res.state} · arrives <b>{win.early} – {win.late}</b>
          </span>
        )}
        {!res && (
          <span className="muted">
            <Icon name="truck" size={16} /> Free delivery · usually arrives {win.early} – {win.late}
          </span>
        )}
      </div>
    </div>
  );
}

function SizeIcon({ w, h, max }) {
  const s = 26 / max;
  return <span className="size-icon" style={{ width: w * s, height: h * s }} aria-hidden="true" />;
}

export default function Product() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const cart = useCart();
  const toast = useToast();
  const { wish, toggleWish, pushRecent, recent } = useShop();
  const { data: products, loading } = useProducts();
  const { data: categories } = useCategories();
  const product = products?.find((p) => p.id === id || p.slug === id);
  const { data: cfg } = useAsync(() => (product ? loadFrameConfig(product.dbId) : Promise.resolve(null)), [product?.dbId]);

  const [view, setView] = useState(params.get('view') === 'room' ? 'room' : 'frame');
  const [img, setImg] = useState(0);
  const [sizeSlug, setSizeSlug] = useState(() => params.get('size'));
  const [colourName, setColourName] = useState(null);
  const [material, setMaterial] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [tf, setTf] = useState(IDENTITY);
  const [orientation, setOrientation] = useState('Vertical');
  const [busy, setBusy] = useState(false);
  const [building, setBuilding] = useState(false);
  const fileRef = useRef(null);
  const atcRef = useRef(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    if (product) pushRecent(product.id);
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!cfg) return;
    setSizeSlug((s) => (cfg.sizes.some((x) => x.slug === s) ? s : (cfg.sizes.find((x) => x.isDefault) || cfg.sizes[0]).slug));
    setColourName((c) => (cfg.colours.some((x) => x.name === c) ? c : (cfg.colours.find((x) => x.isDefault) || cfg.colours[0]).name));
    setMaterial((m) => (cfg.materials.some((x) => x.name === m) ? m : (cfg.materials.find((x) => x.isDefault) || cfg.materials[0]).name));
  }, [cfg]);

  useEffect(() => {
    const el = atcRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [product?.id, cfg]);

  const size = cfg?.sizes.find((s) => s.slug === sizeSlug) || cfg?.sizes[0];
  const colour = cfg?.colours.find((c) => c.name === colourName) || cfg?.colours[0];
  const mat = cfg?.materials.find((m) => m.name === material) || cfg?.materials[0];
  const price = size?.price ?? product?.price ?? 499;
  const maxW = Math.max(...(cfg?.sizes || [{ ratioW: 24, ratioH: 36 }]).map((s) => s.ratioH || 36));

  const related = useMemo(() => (products || []).filter((p) => p.id !== product?.id && p.category === product?.category).slice(0, 4), [products, product]);
  const recentList = useMemo(() => recent.filter((r) => r !== product?.id).map((r) => products?.find((p) => p.id === r)).filter(Boolean).slice(0, 4), [recent, products, product]);

  if (loading) return <div className="page-loading"><span /></div>;
  if (!product)
    return (
      <div className="wrap section center">
        <h1 className="h2">This design has moved</h1>
        <p className="lead" style={{ margin: '14px auto 24px' }}>
          It may have sold out or been renamed.
        </p>
        <Link to="/shop" className="btn">
          Browse all frames
        </Link>
      </div>
    );

  const artSrc = product.images[img]?.url || product.thumbnail;
  const ratio = { w: size?.ratioW || 9.5, h: size?.ratioH || 13 };
  const option = size && colour && mat ? { id: `${size.slug}_${colour.slug}_${mat.slug}`, size: size.name, dimensions: size.dimensions, colour: colour.name, material: mat.name } : null;

  const pickSize = (s) => {
    setSizeSlug(s);
    setBuilding(true);
    setTimeout(() => setBuilding(false), 700);
  };

  const onPhoto = async (f) => {
    try {
      const p = await readPhoto(f);
      setPhoto(p);
      setTf(IDENTITY);
      setView('frame');
      if (p.width && p.width > p.height * 1.15) setOrientation('Horizontal');
      toast('Your photo is in the frame — drag to adjust', 'ok');
    } catch (e) {
      toast(e.message, 'warn');
    }
  };

  const addToCart = async (buyNow = false) => {
    if (!option) return;
    if (photo) {
      setBusy(true);
      try {
        const up = await uploadArtwork([{ file: photo.file, name: photo.name, width: photo.width, height: photo.height }]);
        if (up.uploaded < up.requested) {
          toast('Photo upload failed — please check your connection and try again.', 'warn');
          return;
        }
        cart.add(
          {
            productId: 'custom',
            name: `${product.name} — Your Photo`,
            image: product.thumbnail,
            preview: photo.thumb || photo.url,
            price,
            category: 'personalized',
            colourHex: colour.hex,
            option,
            orientation,
            artworkPaths: up.paths,
            customization: { source: 'product-replace', productId: product.id, productName: product.name, material: mat.name, orientation, transform: tf, artworkMeta: up.meta },
          },
          { open: !buyNow },
        );
        setPhoto(null);
      } finally {
        setBusy(false);
      }
    } else {
      cart.add(
        {
          productId: product.id,
          name: product.name,
          image: product.thumbnail,
          price,
          category: product.category,
          colourHex: colour.hex,
          option,
          orientation: 'Vertical',
          customization: { material: mat.name, artworkVariant: product.images[img]?.title || product.images[img]?.id || null },
        },
        { open: !buyNow },
      );
    }
    if (buyNow) navigate('/checkout');
  };

  const onWish = wish.includes(product.id);
  const catName = categoryLabel(product.category, categories);

  return (
    <>
      <Seo
        title={`${product.name} — ${catName} Frame`}
        description={`${product.description || product.name} Handcrafted in India, from ${money(product.price)}. Free delivery across India.`}
        path={`/product/${product.id}`}
        image={product.thumbnail ? optimized(product.thumbnail, 1200, 80).replace('output=webp', 'output=jpg') : undefined}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.description,
          image: product.images.map((i) => i.url),
          sku: product.id,
          brand: { '@type': 'Brand', name: 'JHAYRA' },
          category: catName,
          ...(product.rating && product.review_count ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.review_count } } : {}),
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'INR',
            lowPrice: Math.min(...(cfg?.sizes || [{ price: product.price }]).map((s) => s.price)),
            highPrice: Math.max(...(cfg?.sizes || [{ price: product.price }]).map((s) => s.price)),
            availability: 'https://schema.org/InStock',
            url: `${SITE.url}/product/${product.id}`,
          },
        }}
      />
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden>/</span>
          <Link to="/shop">Shop</Link>
          {product.category && (
            <>
              <span aria-hidden>/</span>
              <Link to={`/shop?category=${product.category}`}>{catName}</Link>
            </>
          )}
        </nav>
      </div>
      <section className="wrap pdp">
        <div className="pdp-media">
          <div className="pdp-views" role="tablist" aria-label="Preview mode">
            <button role="tab" aria-selected={view === 'frame'} onClick={() => setView('frame')}>
              <Icon name="image" size={17} /> Frame
            </button>
            <button role="tab" aria-selected={view === 'room'} onClick={() => setView('room')}>
              <Icon name="sofa" size={17} /> On a wall
            </button>
            {product.images.length > 1 && !photo && (
              <button role="tab" aria-selected={view === 'photos'} onClick={() => setView('photos')}>
                <Icon name="grid" size={17} /> Photos
              </button>
            )}
          </div>
          {view === 'frame' && (
            <div className={`pdp-stage ${building ? 'building' : ''}`}>
              <div className="pdp-spot" />
              <div className="pdp-frame" style={{ width: `${34 + ((ratio.h / maxW) * 46)}%` }}>
                {photo ? (
                  <Frame ratio={ratio} orientation={orientation} colour={colour?.hex || '#1C1C1C'}>
                    <PanZoom src={photo.url} value={tf} onChange={setTf} alt="Your photo" />
                  </Frame>
                ) : (
                  <Frame src={artSrc} alt={product.name} ratio={ratio} colour={colour?.hex || '#1C1C1C'} tilt priority sizes="(max-width: 900px) 70vw, 34vw" />
                )}
                <div className="pdp-dim pdp-dim-w">
                  <span>{orientation === 'Horizontal' && photo ? ratio.h : ratio.w}″</span>
                </div>
                <div className="pdp-dim pdp-dim-h">
                  <span>{orientation === 'Horizontal' && photo ? ratio.w : ratio.h}″</span>
                </div>
              </div>
              {photo && (
                <div className="pdp-photo-tools">
                  <ZoomControls value={tf} onChange={setTf} />
                  <button className="chip" onClick={() => setOrientation((o) => (o === 'Vertical' ? 'Horizontal' : 'Vertical'))}>
                    <Icon name="rotate" size={15} /> {orientation === 'Vertical' ? 'Portrait' : 'Landscape'}
                  </button>
                  {photo.quality && <span className={`q-badge q-${QUALITY_LABEL[photo.quality].tone}`}>{QUALITY_LABEL[photo.quality].text}</span>}
                </div>
              )}
            </div>
          )}
          {view === 'room' && <WallStudio src={photo ? photo.url : artSrc} wIn={ratio.w} hIn={ratio.h} colour={colour?.hex || '#1C1C1C'} />}
          {view === 'photos' && (
            <div className="pdp-gallery">
              <Img src={product.images[img]?.url} alt={product.images[img]?.alt_text || product.name} sizes="(max-width: 900px) 100vw, 55vw" width={1200} priority />
            </div>
          )}
          {product.images.length > 1 && !photo && (
            <div className="pdp-thumbs">
              {product.images.map((im, i) => (
                <button key={im.id} className={i === img ? 'on' : ''} onClick={() => setImg(i)} aria-label={`Image ${i + 1}`}>
                  <Img src={im.url} alt="" sizes="72px" width={160} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pdp-info">
          <span className="eyebrow">{catName}</span>
          <h1 className="h1 pdp-title">{product.name}</h1>
          <div className="pdp-meta">
            <Stars rating={product.rating} count={product.review_count} />
            {product.is_bestseller && <span className="pill pill-gold">Bestseller</span>}
          </div>
          <div className="pdp-price">
            <b key={price}>{money(price)}</b>
            {product.compare_price ? <s>{money(product.compare_price)}</s> : null}
            <span>incl. taxes · free delivery</span>
          </div>
          {product.description && <p className="pdp-desc">{product.description}</p>}

          {cfg && (
            <>
              <fieldset className="opt">
                <legend>
                  Size <span>{size?.dimensions}</span>
                </legend>
                <div className="size-grid">
                  {cfg.sizes.map((s) => (
                    <button key={s.slug} className={`size-card ${s.slug === size?.slug ? 'on' : ''}`} onClick={() => pickSize(s.slug)} aria-pressed={s.slug === size?.slug}>
                      <SizeIcon w={s.ratioW} h={s.ratioH} max={maxW} />
                      <b>{s.name}</b>
                      <small>{money(s.price)}</small>
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="opt">
                <legend>
                  Frame <span>{colour?.name}</span>
                </legend>
                <div className="swatches">
                  {cfg.colours.map((c) => (
                    <button key={c.slug} className={`swatch swatch-frame ${c.name === colour?.name ? 'on' : ''}`} style={{ '--sw': c.hex }} aria-label={`${c.name} frame`} aria-pressed={c.name === colour?.name} onClick={() => setColourName(c.name)} />
                  ))}
                </div>
              </fieldset>
              {cfg.materials.length > 1 && (
                <fieldset className="opt">
                  <legend>
                    Finish <span>{mat?.name}</span>
                  </legend>
                  <div className="chips">
                    {cfg.materials.map((m) => (
                      <button key={m.slug} className="chip" aria-pressed={m.name === mat?.name} onClick={() => setMaterial(m.name)}>
                        {m.name}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
            </>
          )}

          {product.customer_photo_eligible && (
            <div className={`own-photo ${photo ? 'has' : ''}`}>
              <div>
                <b>{photo ? 'Your photo is in the frame' : 'Put your own photo in this frame'}</b>
                <small>{photo ? 'Drag to reposition · pinch or use the slider to zoom' : 'Same frame and finish — with your memory inside.'}</small>
              </div>
              {photo ? (
                <button className="chip" onClick={() => setPhoto(null)}>
                  Use the design instead
                </button>
              ) : (
                <button className="btn btn-sm" onClick={() => fileRef.current?.click()}>
                  <Icon name="upload" size={16} /> Upload
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onPhoto(e.target.files[0])} />
            </div>
          )}

          <div className="pdp-actions" ref={atcRef}>
            <button className="btn btn-gold btn-lg grow" disabled={!option || busy} onClick={() => addToCart(false)}>
              {busy ? 'Uploading your photo…' : `Add to cart · ${money(price)}`}
            </button>
            <button className={`icon-btn pdp-wish ${onWish ? 'on' : ''}`} onClick={() => toggleWish(product.id)} aria-pressed={onWish} aria-label="Save to wishlist">
              <Icon name="heart" />
            </button>
          </div>
          <button className="btn btn-ghost btn-block" disabled={!option || busy} onClick={() => addToCart(true)}>
            Buy now
          </button>

          <PincodeCheck />

          <ul className="pdp-promise">
            <li>
              <Icon name="brush" size={18} /> <span><b>Handcrafted to order</b> — dispatched in 1–2 days</span>
            </li>
            <li>
              <Icon name="lock" size={18} /> <span><b>Secure payment</b> — UPI, cards, netbanking</span>
            </li>
          </ul>

          <div className="acc" style={{ marginTop: 26 }}>
            <details open>
              <summary>
                What you get
                <span className="ic">
                  <Icon name="plus" size={16} />
                </span>
              </summary>
              <div className="acc-body">
                A ready-to-hang {mat?.name || 'PS moulding'} frame in {colour?.name?.toLowerCase() || 'black'}, {size?.dimensions || '9.5 × 13 inches'}, with a high-definition print and protective front sheet. Wall hook included.
              </div>
            </details>
            <details>
              <summary>
                Delivery & replacement
                <span className="ic">
                  <Icon name="plus" size={16} />
                </span>
              </summary>
              <div className="acc-body">
                Free delivery anywhere in India in 5–7 business days after dispatch. Damaged or incorrect order? Message us on WhatsApp within 48 hours — see our <Link to="/replacement-policy" className="link">replacement policy</Link>.
              </div>
            </details>
            <details>
              <summary>
                Care
                <span className="ic">
                  <Icon name="plus" size={16} />
                </span>
              </summary>
              <div className="acc-body">Keep away from direct sunlight and damp walls. Wipe with a dry, soft cloth.</div>
            </details>
          </div>
          <a className="pdp-help" href={waLink(`Hi JHAYRA! I have a question about "${product.name}" (${SITE.url}/product/${product.id})`)} target="_blank" rel="noopener noreferrer">
            Questions about this design? <b>Ask us on WhatsApp →</b>
          </a>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <h2 className="h2">
                More in <em>{catName}</em>
              </h2>
              <Link to={`/shop?category=${product.category}`} className="link">
                View all <Icon name="arrow" size={16} />
              </Link>
            </div>
            <div className="grid-products">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} categories={categories} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
      {recentList.length > 0 && (
        <section className="section-sm">
          <div className="wrap">
            <h2 className="h3" style={{ marginBottom: 22 }}>
              Recently viewed
            </h2>
            <div className="grid-products">
              {recentList.map((p, i) => (
                <ProductCard key={p.id} product={p} categories={categories} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      <div className={`sticky-atc ${showSticky ? 'show' : ''}`} aria-hidden={!showSticky}>
        <div className="sticky-atc-thumb">
          <Img src={product.thumbnail} alt="" sizes="48px" width={120} />
        </div>
        <div className="grow">
          <b>{product.name}</b>
          <small>
            {size?.name} · {colour?.name} · {money(price)}
          </small>
        </div>
        <button className="btn btn-gold btn-sm" disabled={!option || busy} onClick={() => addToCart(false)} tabIndex={showSticky ? 0 : -1}>
          Add to cart
        </button>
      </div>
    </>
  );
}
