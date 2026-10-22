import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import ProductCard from '../components/ProductCard';
import { CartThumb } from '../components/Layout';
import { Seo } from '../lib/seo';
import { useCart } from '../state/cart';
import { useProducts } from '../lib/catalog';
import { money, waLink } from '../lib/site';

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

export default function Cart() {
  const cart = useCart();
  const navigate = useNavigate();
  const { data: products } = useProducts();
  const inCart = new Set(cart.items.map((i) => i.productId));
  const upsell = (products || []).filter((p) => p.is_bestseller && !inCart.has(p.id)).slice(0, 4);

  return (
    <>
      <Seo title="Your Cart" path="/cart" noindex />
      <section className="wrap page-hero" style={{ paddingBottom: 10 }}>
        <span className="eyebrow">Cart</span>
        <h1 className="h1">{cart.items.length ? 'Almost on your wall.' : 'Your cart is empty.'}</h1>
      </section>
      {cart.items.length === 0 ? (
        <section className="wrap section-sm center">
          <p className="lead" style={{ margin: '0 auto 26px' }}>
            Find a design you love, or turn your own photo into a frame.
          </p>
          <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/shop" className="btn">
              Shop frames
            </Link>
            <Link to="/customize" className="btn btn-ghost">
              Personalise
            </Link>
          </div>
        </section>
      ) : (
        <section className="wrap cart-page">
          <div>
            {cart.items.map((i) => (
              <div className="cart-line cart-line-lg" key={i.key}>
                <CartThumb item={i} />
                <div>
                  <h4>{i.name}</h4>
                  <div className="opts">
                    {i.option.size} ({i.option.dimensions}) · {i.option.colour} frame · {i.option.material}
                    {i.orientation === 'Horizontal' ? ' · Landscape' : ''}
                  </div>
                  {i.artworkPaths?.length > 0 && (
                    <div className="opts" style={{ color: 'var(--ok)' }}>
                      <Icon name="check" size={13} /> {i.artworkPaths.length} photo{i.artworkPaths.length > 1 ? 's' : ''} uploaded
                    </div>
                  )}
                  <div className="qty">
                    <button onClick={() => cart.setQty(i.key, i.qty - 1)} aria-label="Decrease quantity">
                      <Icon name="minus" size={15} />
                    </button>
                    <span>{i.qty}</span>
                    <button onClick={() => cart.setQty(i.key, i.qty + 1)} aria-label="Increase quantity">
                      <Icon name="plus" size={15} />
                    </button>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <b>{money(i.price * i.qty)}</b>
                  <div>
                    <button className="small muted" style={{ marginTop: 10, textDecoration: 'underline' }} onClick={() => cart.remove(i.key)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <aside className="summary card">
            <h2 className="h3">Summary</h2>
            <CouponBox />
            <div className="sum-row">
              <span>Subtotal</span>
              <span>{money(cart.subtotal)}</span>
            </div>
            {cart.discount > 0 && (
              <div className="sum-row" style={{ color: 'var(--ok)' }}>
                <span>Discount</span>
                <span>−{money(cart.discount)}</span>
              </div>
            )}
            <div className="sum-row">
              <span>Delivery</span>
              <span>Free</span>
            </div>
            <div className="sum-row total">
              <span>Total</span>
              <span>{money(cart.total)}</span>
            </div>
            <button className="btn btn-gold btn-lg btn-block" style={{ marginTop: 16 }} onClick={() => navigate('/checkout')}>
              <Icon name="lock" size={18} /> Secure checkout
            </button>
            <a className="btn btn-ghost btn-block" style={{ marginTop: 10 }} href={waLink(orderText(cart.items, cart))} target="_blank" rel="noopener noreferrer">
              Order on WhatsApp instead
            </a>
            <p className="small muted center" style={{ marginTop: 14 }}>
              UPI · Cards · Netbanking · Wallets — powered by Razorpay
            </p>
          </aside>
        </section>
      )}
      {upsell.length > 0 && (
        <section className="section">
          <div className="wrap">
            <h2 className="h2" style={{ marginBottom: 28 }}>
              Complete <em>the wall</em>
            </h2>
            <div className="grid-products">
              {upsell.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
