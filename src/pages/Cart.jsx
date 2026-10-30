import { useEffect, useRef, useState } from 'react';
import '../styles/bag.css';
import { Link, useNavigate } from 'react-router-dom';
import Icon, { WhatsAppGlyph } from '../components/Icon';
import Frame from '../components/Frame';
import ProductCard from '../components/ProductCard';
import DeliveryTimeline from '../components/DeliveryTimeline';
import { Motion, ripple } from '../components/Motion';
import { Seo } from '../lib/seo';
import { useCart } from '../state/cart';
import { useShop, useToast } from '../state/store';
import { useFestival } from '../state/festival';
import { useActiveCampaign } from '../lib/campaigns';
import { useCategories, useOptionSummary, useProducts } from '../lib/catalog';
import { money, waLink, deliveryWindow } from '../lib/site';

export function CouponBox() {
  const { coupon, applyCoupon, clearCoupon, discount } = useCart();
  const [code, setCode] = useState('');
  const [state, setState] = useState('');
  if (coupon)
    return (
      <div className="coupon-on">
        <Icon name="check" size={18} />
        <span>
          <b>{coupon.code}</b> applied — you save {money(discount)}
        </span>
        <button className="small" onClick={clearCoupon} style={{ textDecoration: 'underline' }}>
          Remove
        </button>
      </div>
    );
  return (
    <form
      className="coupon"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!code.trim()) return;
        setState('loading');
        const r = await applyCoupon(code);
        setState(r.ok ? '' : 'bad');
      }}
    >
      <input className="input" value={code} onChange={(e) => (setCode(e.target.value.toUpperCase()), setState(''))} placeholder="Coupon code" aria-label="Coupon code" aria-invalid={state === 'bad'} />
      <button className="btn btn-sm" disabled={state === 'loading'}>
        {state === 'loading' ? '…' : 'Apply'}
      </button>
      {state === 'bad' && <small className="coupon-err">That code isn't valid right now.</small>}
    </form>
  );
}

export function orderText(items, { subtotal, discount, total, coupon }, customer) {
  const lines = items.map((i) => `• ${i.name} (${i.option.size}, ${i.option.colour}) × ${i.qty} — ${money(i.price * i.qty)}`);
  const out = ['Hello JHAYRA! I’d like to order:', '', ...lines, '', `Subtotal: ${money(subtotal)}`];
  if (discount) out.push(`Discount (${coupon?.code}): −${money(discount)}`);
  out.push('Delivery: FREE', `Total: ${money(total)}`);
  if (customer) out.push('', 'Delivery details:', `Name: ${customer.name}`, `Mobile: ${customer.mobile}`, `Address: ${customer.address}, ${customer.city}${customer.state ? ', ' + customer.state : ''} − ${customer.pin}`);
  if (items.some((i) => i.artworkPaths?.length)) out.push('', '(My photos are uploaded through the website.)');
  return out.join('\n');
}

/* ── Your wall, to scale ─────────────────────────────────────────────────
   The pieces in the bag hung side by side above a 7 ft sofa, using each
   line's real print size, so customers can sense how they'll look. */
const SOFA_IN = 84;
function inches(item) {
  const m = String(item.option?.dimensions || '').match(/([\d.]+)\s*[×x]\s*([\d.]+)/);
  let [w, h] = m ? [parseFloat(m[1]), parseFloat(m[2])] : [12, 16];
  if (item.orientation === 'Horizontal') [w, h] = [h, w];
  return { w, h };
}
function WallPreview({ items }) {
  const pieces = items.slice(0, 6).map((i) => ({ ...inches(i), item: i }));
  const gap = 5;
  const total = pieces.reduce((s, p) => s + p.w, 0) + gap * (pieces.length - 1);
  const R = Math.max(118, total + 28);
  const tallest = Math.max(...pieces.map((p) => p.h));
  const sofaTop = 34;
  const H = Math.max(R * 0.46, sofaTop + 9 + tallest + 9);
  const line = H - sofaTop - 9 - tallest / 2; // shared centre line
  let x = (R - total) / 2;
  const sx = (R - SOFA_IN) / 2;
  return (
    <figure className="bag-wall">
      <svg viewBox={`0 0 ${R} ${H}`} role="img" aria-label={`Your ${pieces.length > 1 ? `${pieces.length} pieces` : 'piece'} shown to scale above a 7 ft sofa`}>
        <defs>
          <filter id="bagShadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="1.4" stdDeviation="1.3" floodOpacity=".28" />
          </filter>
        </defs>
        <rect width={R} height={H} fill="#ece5d8" />
        {pieces.map((p, n) => {
          const px = x;
          x += p.w + gap;
          const t = Math.max(0.9, Math.min(p.w, p.h) * 0.07);
          const y = line - p.h / 2;
          const src = p.item.preview || p.item.image;
          return (
            <g key={p.item.key} className="bag-wall-piece" style={{ '--i': n }} filter="url(#bagShadow)">
              <rect x={px} y={y} width={p.w} height={p.h} fill={p.item.colourHex || '#1C1C1C'} />
              {src && <image href={src} x={px + t} y={y + t} width={p.w - 2 * t} height={p.h - 2 * t} preserveAspectRatio="xMidYMid slice" />}
              {p.item.qty > 1 && (
                <g>
                  <circle cx={px + p.w} cy={y} r="2.6" fill="#1C1C1C" />
                  <text x={px + p.w} y={y + 1} textAnchor="middle" fontSize="2.6" fill="#fff" fontWeight="700">
                    ×{p.item.qty}
                  </text>
                </g>
              )}
            </g>
          );
        })}
        {/* sofa */}
        <g fill="#b9ab95">
          <rect x={sx} y={H - sofaTop} width={SOFA_IN} height="15" rx="4" />
          <rect x={sx - 4} y={H - sofaTop + 9} width="10" height="18" rx="3.5" />
          <rect x={sx + SOFA_IN - 6} y={H - sofaTop + 9} width="10" height="18" rx="3.5" />
          <rect x={sx + 3} y={H - sofaTop + 13} width={SOFA_IN - 6} height="12" rx="2.5" fill="#a89a83" />
          <rect x={sx + 4} y={H - 7} width="2" height="7" fill="#6b5a44" />
          <rect x={sx + SOFA_IN - 6} y={H - 7} width="2" height="7" fill="#6b5a44" />
        </g>
        <rect x="0" y={H - 1.2} width={R} height="1.2" fill="#cbbfac" />
      </svg>
      <figcaption>
        <Icon name="ruler" size={14} /> Shown to scale above a 7 ft sofa{items.length > 6 ? ` · first 6 of ${items.length} pieces` : ''}
      </figcaption>
    </figure>
  );
}

function BagLine({ item, index, onRemove, onSave, products }) {
  const cart = useCart();
  const product = item.productId !== 'custom' ? products?.find((p) => p.id === item.productId) : null;
  const href = product ? `/product/${product.id}` : null;
  const Title = href ? Link : 'span';
  const chips = [item.option.size, item.option.dimensions, `${item.option.colour} frame`, item.option.material, item.orientation === 'Horizontal' ? 'Landscape' : null].filter(Boolean);
  return (
    <article className="bag-line" style={{ '--i': index }}>
      <div className="bag-line-art">
        {item.preview || item.image ? <Frame src={item.preview || item.image} colour={item.colourHex || '#1C1C1C'} orientation={item.orientation} glare={false} thickness={5} sizes="140px" /> : <Icon name="image" />}
      </div>
      <div className="bag-line-body">
        <div className="bag-line-top">
          <div>
            {item.signature && <span className="bag-sig">✦ Signature</span>}
            <Title {...(href ? { to: href } : {})} className="bag-line-name">
              {item.name}
            </Title>
          </div>
          <b className="bag-line-price" key={item.qty}>
            {money(item.price * item.qty)}
          </b>
        </div>
        <ul className="bag-chips">
          {chips.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        {item.artworkPaths?.length > 0 && (
          <p className="bag-ok">
            <Icon name="check" size={13} /> {item.artworkPaths.length} photo{item.artworkPaths.length > 1 ? 's' : ''} uploaded
          </p>
        )}
        {item.signature && <p className="bag-note">Premium packaging included</p>}
        <div className="bag-line-foot">
          <div className="bag-qty" role="group" aria-label={`Quantity of ${item.name}`}>
            <button type="button" onClick={() => (item.qty > 1 ? cart.setQty(item.key, item.qty - 1) : onRemove(item))} aria-label="Decrease quantity">
              <Icon name={item.qty > 1 ? 'minus' : 'close'} size={14} />
            </button>
            <span key={item.qty}>{item.qty}</span>
            <button type="button" onClick={() => cart.setQty(item.key, item.qty + 1)} aria-label="Increase quantity">
              <Icon name="plus" size={14} />
            </button>
          </div>
          {item.qty > 1 && <small className="muted">{money(item.price)} each</small>}
          <span className="bag-actions">
            {product && (
              <button type="button" onClick={() => onSave(item)}>
                <Icon name="heart" size={14} /> Save for later
              </button>
            )}
            <button type="button" onClick={() => onRemove(item)}>
              <Icon name="trash" size={14} /> Remove
            </button>
          </span>
        </div>
      </div>
    </article>
  );
}

function Rail({ title, eyebrow, items, categories, opts }) {
  if (!items.length) return null;
  return (
    <section className="hs bag-rail">
      <div className="wrap">
        <div className="hs-head">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2 className="hs-title">{title}</h2>
          </div>
        </div>
        <div className="hs-scroll sh-rail">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} categories={categories} index={i} options={opts?.[p.dbId]} />
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = ['Bag', 'Details', 'Payment'];

export default function Cart() {
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const { wish, toggleWish, recent } = useShop();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const { data: opts } = useOptionSummary();
  const fest = useFestival();
  const campaign = useActiveCampaign();
  const offer = fest?.coupon ? { name: fest.name, coupon: fest.coupon } : campaign?.coupon && !campaign.preview ? { name: campaign.title, coupon: campaign.coupon } : null;
  const [removed, setRemoved] = useState(null);
  const [leaving, setLeaving] = useState(() => new Set());
  const [barHidden, setBarHidden] = useState(false);
  const ctaRef = useRef(null);
  const undoTimer = useRef(0);
  const win = deliveryWindow();
  const has = cart.items.length > 0;

  // Mobile checkout bar: hidden while the summary's own button is on screen.
  useEffect(() => {
    if (!has || !ctaRef.current || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setBarHidden(e.isIntersecting), { threshold: 0.2 });
    io.observe(ctaRef.current);
    document.body.classList.add('bag-has-bar');
    return () => (io.disconnect(), document.body.classList.remove('bag-has-bar'));
  }, [has]);
  useEffect(() => () => clearTimeout(undoTimer.current), []);

  const remove = (item, saved = false) => {
    setLeaving((s) => new Set(s).add(item.key));
    setTimeout(() => {
      cart.remove(item.key);
      setLeaving((s) => {
        const n = new Set(s);
        n.delete(item.key);
        return n;
      });
      setRemoved({ item, saved });
      clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => setRemoved(null), 7000);
    }, 260);
  };
  const save = (item) => {
    if (!wish.includes(item.productId)) toggleWish(item.productId);
    remove(item, true);
  };
  const undo = () => {
    const { item, saved } = removed;
    const { key, qty, ...rest } = item;
    cart.add({ ...rest, qty }, { open: false });
    if (saved && wish.includes(item.productId)) toggleWish(item.productId);
    setRemoved(null);
    toast(`${item.name} is back in your bag`, 'ok');
  };

  const all = products || [];
  const inBag = new Set(cart.items.map((i) => i.productId));
  const bagCats = new Set(cart.items.map((i) => all.find((p) => p.id === i.productId)?.category).filter(Boolean));
  const pick = (list) => list.filter((p) => p.thumbnail && !inBag.has(p.id));
  const pairs = [...pick(all.filter((p) => bagCats.has(p.category) && p.is_bestseller)), ...pick(all.filter((p) => bagCats.has(p.category))), ...pick(all.filter((p) => p.is_bestseller))].filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i).slice(0, 8);
  const saved = pick(wish.map((id) => all.find((p) => p.id === id)).filter(Boolean)).slice(0, 8);
  const recently = pick(recent.map((id) => all.find((p) => p.id === id)).filter(Boolean).filter((p) => !wish.includes(p.id))).slice(0, 8);
  const pieces = cart.count;

  return (
    <>
      <Seo title="Your Bag" path="/cart" noindex />
      <section className="bag-hero">
        <div className="wrap">
          <ol className="bag-steps" aria-label="Checkout progress">
            {STEPS.map((s, i) => (
              <li key={s} className={i === 0 ? 'on' : ''} aria-current={i === 0 ? 'step' : undefined}>
                <span>{i + 1}</span> {s}
              </li>
            ))}
          </ol>
          <Motion type="up">
            <span className="eyebrow">Your bag</span>
            <h1 className="h1">{has ? 'Almost on your wall.' : 'Your wall is waiting.'}</h1>
            {has ? (
              <p className="bag-hero-sub">
                {pieces} piece{pieces > 1 ? 's' : ''}, handcrafted to order · arrives{' '}
                <b>
                  {win.early} – {win.late}
                </b>
              </p>
            ) : (
              <p className="bag-hero-sub">Find a design you love, turn your own photo into a frame, or let us help you choose a gift.</p>
            )}
          </Motion>
        </div>
      </section>

      {removed && (
        <div className="bag-undo" role="status">
          <span>
            {removed.saved ? (
              <>
                <b>{removed.item.name}</b> saved for later
              </>
            ) : (
              <>
                Removed <b>{removed.item.name}</b>
              </>
            )}
          </span>
          <button type="button" onClick={undo}>
            Undo
          </button>
        </div>
      )}

      {!has ? (
        <section className="wrap bag-empty">
          <div className="bag-empty-wall" aria-hidden="true">
            <span className="bag-empty-nail" />
            <span className="bag-empty-frame" />
          </div>
          <div className="bag-empty-ctas">
            <Link to="/shop" className="bag-empty-card" onPointerDown={ripple}>
              <Icon name="grid" size={22} />
              <b>Shop wall art</b>
              <small>Devotional, nature, modern & more</small>
            </Link>
            <Link to="/customize" className="bag-empty-card" onPointerDown={ripple}>
              <Icon name="image" size={22} />
              <b>Frame your photo</b>
              <small>Upload a memory, see it framed</small>
            </Link>
            <Link to="/gift-finder" className="bag-empty-card" onPointerDown={ripple}>
              <Icon name="gift" size={22} />
              <b>Find a gift</b>
              <small>Five quick questions</small>
            </Link>
          </div>
        </section>
      ) : (
        <section className="wrap bag-page">
          <div className="bag-main">
            <WallPreview items={cart.items} />
            <div className="bag-lines">
              {cart.items.map((i, n) => (
                <div key={i.key} className={`bag-line-wrap${leaving.has(i.key) ? ' out' : ''}`}>
                  <BagLine item={i} index={n} products={products} onRemove={remove} onSave={save} />
                </div>
              ))}
            </div>
            <div className="bag-delivery">
              <h2 className="h3">When it arrives</h2>
              <DeliveryTimeline />
            </div>
          </div>

          <aside className="bag-summary">
            <h2 className="h3">Order summary</h2>
            {offer && !cart.coupon && (
              <p className="bag-offer">
                <span>✦</span> {offer.name}: code <b>{offer.coupon}</b> applies automatically at checkout.
              </p>
            )}
            <CouponBox />
            <div className="sum-row">
              <span>
                Subtotal · {pieces} piece{pieces > 1 ? 's' : ''}
              </span>
              <span>{money(cart.subtotal)}</span>
            </div>
            {cart.discount > 0 && (
              <div className="sum-row bag-save">
                <span>Discount ({cart.coupon.code})</span>
                <span>−{money(cart.discount)}</span>
              </div>
            )}
            <div className="sum-row">
              <span>Delivery</span>
              <span className="bag-free">Free</span>
            </div>
            <div className="sum-row total">
              <span>Total</span>
              <span key={cart.total} className="bag-total">
                {money(cart.total)}
              </span>
            </div>
            {cart.discount > 0 && <p className="bag-saving">You save {money(cart.discount)} on this order</p>}
            <button ref={ctaRef} className="btn btn-gold btn-lg btn-block bag-cta" onPointerDown={ripple} onClick={() => navigate('/checkout')}>
              <Icon name="lock" size={18} /> Secure checkout
            </button>
            <a className="btn btn-ghost btn-block bag-wa" href={waLink(orderText(cart.items, cart))} target="_blank" rel="noopener noreferrer">
              <WhatsAppGlyph size={18} /> Order on WhatsApp instead
            </a>
            <ul className="bag-trust">
              <li>
                <Icon name="brush" size={16} /> Handcrafted to order, dispatched in 1–2 days
              </li>
              <li>
                <Icon name="truck" size={16} /> Free delivery across India
              </li>
              <li>
                <Icon name="lock" size={16} /> UPI, cards, netbanking & wallets via Razorpay
              </li>
              <li>
                <Icon name="gift" size={16} /> Sending a gift? Add a free gift card at checkout
              </li>
              <li>
                <Icon name="check" size={16} /> Damaged in transit?{' '}
                <Link to="/replacement-policy" className="link">
                  We'll replace it
                </Link>
              </li>
            </ul>
          </aside>
        </section>
      )}

      {has && (
        <div className={`bag-bar${barHidden ? ' hide' : ''}`}>
          <div>
            <small>
              Total · {pieces} piece{pieces > 1 ? 's' : ''}
            </small>
            <b>{money(cart.total)}</b>
          </div>
          <button className="btn btn-gold" onClick={() => navigate('/checkout')}>
            <Icon name="lock" size={16} /> Checkout
          </button>
        </div>
      )}

      <Rail eyebrow={has ? 'Pairs well with your bag' : 'Loved by our customers'} title={has ? 'Complete the wall' : 'Bestsellers'} items={pairs} categories={categories} opts={opts} />
      <Rail eyebrow="Your wishlist" title="Saved for later" items={saved} categories={categories} opts={opts} />
      <Rail title="Recently viewed" items={recently} categories={categories} opts={opts} />
    </>
  );
}
