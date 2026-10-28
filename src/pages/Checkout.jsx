import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Icon, { WhatsAppGlyph } from '../components/Icon';
import Frame from '../components/Frame';
import Particles from '../components/Particles';
import { CartThumb } from '../components/Layout';
import { CouponBox, orderText } from './Cart';
import { Seo } from '../lib/seo';
import { supabase } from '../lib/supabase';
import { useCart } from '../state/cart';
import { useToast, saveLocalOrder } from '../state/store';
import { useFestival } from '../state/festival';
import { money, waLink, deliveryWindow, SITE } from '../lib/site';
import { BRAND } from '../lib/brand';

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

const SAVED = 'jhayra_checkout_details';
const EMPTY = { name: '', mobile: '', email: '', address: '', city: '', state: '', pin: '' };

export const JOURNEY = [
  ['Order placed', 'check'],
  ['Crafting', 'brush'],
  ['Quality check', 'shield'],
  ['Packed', 'box'],
  ['Shipped', 'truck'],
  ['Delivered', 'home'],
];

/* ── Success: the unboxing ────────────────────────────────────────────── */
function Unboxing({ order }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, []);
  const hero = order.items[0];
  const win = deliveryWindow(new Date(order.date));
  const share = waLink(`I just ordered a handcrafted frame from JHAYRA ✨ ${SITE.url}`);
  return (
    <section className="unbox">
      <Particles kind="sparkle" density={0.8} />
      <div className="wrap unbox-grid">
        <div className={`box-stage ${open ? 'open' : ''}`} aria-hidden="true">
          <div className="box-glow" />
          <div className="box-frame">
            <Frame src={hero?.preview || hero?.image} colour={hero?.colourHex || '#1C1C1C'} ratio={{ w: 12, h: 16 }} tilt />
          </div>
          <div className="box">
            <div className="box-lid" />
            <div className="box-body">
              <span>
                <img src="/logo-mark.webp" alt="" width="22" height="20" /> JHAYRA
              </span>
            </div>
          </div>
        </div>
        <div className="unbox-copy">
          <span className="eyebrow">Order confirmed</span>
          <h1 className="display" style={{ marginTop: 14 }}>
            Thank you, <em>{order.customerName.split(' ')[0]}.</em>
          </h1>
          <p className="lead" style={{ marginTop: 16 }}>
            Your order <b>{order.orderNumber}</b> is with our workshop. We'll message you on WhatsApp when it ships — expected <b>{win.early} – {win.late}</b>.
          </p>
          <ol className="journey">
            {JOURNEY.map(([label, ic], i) => (
              <li key={label} className={i === 0 ? 'done' : i === 1 ? 'next' : ''}>
                <span>
                  <Icon name={ic} size={16} />
                </span>
                {label}
              </li>
            ))}
          </ol>
          <div className="row" style={{ flexWrap: 'wrap', marginTop: 26 }}>
            <a className="btn btn-wa" href={share} target="_blank" rel="noopener noreferrer">
              <WhatsAppGlyph size={18} /> Share the excitement
            </a>
            <Link to="/orders" className="btn btn-ghost">
              Track my order
            </Link>
            <Link to="/shop" className="link">
              Keep shopping
            </Link>
          </div>
          <p className="small muted" style={{ marginTop: 18 }}>
            Paid {money(order.amount)} · Payment ID {order.paymentId}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── Gift card preview ────────────────────────────────────────────────── */
function GiftCard({ gift }) {
  return (
    <div className="giftcard" aria-label="Gift card preview">
      <div className="giftcard-inner">
        <span className="giftcard-to">{gift.to ? `Dear ${gift.to},` : 'Dear …,'}</span>
        <p>{gift.note || 'Write something from the heart — we’ll print it on a card inside the box.'}</p>
        <span className="giftcard-from">— {gift.from || 'with love'}</span>
        <span className="giftcard-brand">JHAYRA</span>
      </div>
    </div>
  );
}

export default function Checkout() {
  const cart = useCart();
  const toast = useToast();
  const festival = useFestival();
  const navigate = useNavigate();
  const [d, setD] = useState(() => {
    try {
      return { ...EMPTY, ...JSON.parse(localStorage.getItem(SAVED) || '{}') };
    } catch {
      return EMPTY;
    }
  });
  const [pinState, setPinState] = useState('');
  const [errors, setErrors] = useState({});
  const [params] = useSearchParams();
  // ?gift=1 (from the Signature Experience) opens the free gift card section.
  const [gift, setGift] = useState({ on: params.get('gift') === '1', to: '', from: '', note: '', hidePrice: true });
  const [status, setStatus] = useState('idle');
  const [failure, setFailure] = useState('');
  const [order, setOrder] = useState(null);
  const lock = useRef(false);
  const tried = useRef(false);

  useEffect(() => {
    if (cart.items.length === 0 && !order) navigate('/cart', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Festival offer applies itself.
  useEffect(() => {
    if (festival?.coupon && !cart.coupon && !tried.current && cart.items.length) {
      tried.current = true;
      cart.applyCoupon(festival.coupon).then((r) => r.ok && toast(`${festival.name} offer applied: ${festival.coupon}`, 'ok'));
    }
  }, [festival, cart]);

  useEffect(() => {
    if (!/^\d{6}$/.test(d.pin)) return setPinState('');
    setPinState('loading');
    const ac = new AbortController();
    fetch(`https://api.postalpincode.in/pincode/${d.pin}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((res) => {
        const po = res?.[0]?.PostOffice?.[0];
        if (res?.[0]?.Status === 'Success' && po) {
          setD((x) => ({ ...x, city: po.District || po.Name || x.city, state: po.State || x.state }));
          setPinState('ok');
        } else setPinState('bad');
      })
      .catch(() => setPinState(''));
    return () => ac.abort();
  }, [d.pin]);

  const f = (k) => ({
    value: d[k],
    onChange: (e) => {
      setD((x) => ({ ...x, [k]: e.target.value }));
      setErrors((x) => ({ ...x, [k]: '' }));
    },
    'aria-invalid': !!errors[k],
  });

  const validate = () => {
    const e = {};
    if (!d.name.trim()) e.name = 'Please enter your full name';
    if (d.mobile.replace(/\D/g, '').length !== 10) e.mobile = 'Mobile number must be 10 digits';
    if (d.email && !/^\S+@\S+\.\S+$/.test(d.email)) e.email = 'Please check this email';
    if (!/^\d{6}$/.test(d.pin)) e.pin = 'Enter a valid 6-digit pincode';
    if (!d.address.trim()) e.address = 'Please enter your address';
    if (!d.city.trim()) e.city = 'Please enter your city';
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) document.getElementById(`ck-${first}`)?.focus();
    return !first;
  };

  const giftInfo = gift.on ? { to: gift.to.trim() || null, from: gift.from.trim() || null, note: gift.note.trim() || null, hidePrice: gift.hidePrice } : null;

  const pay = async () => {
    if (lock.current || !validate()) return;
    try {
      localStorage.setItem(SAVED, JSON.stringify(d));
    } catch {}
    lock.current = true;
    setStatus('creating');
    setFailure('');
    let opened = false;
    try {
      if (!(await loadRazorpay())) {
        toast('Could not load the payment gateway. Please check your internet connection.', 'warn');
        return;
      }
      const items = cart.items.map((i) => ({
        legacyId: i.productId,
        name: i.name,
        qty: i.qty,
        price: i.price,
        size: i.option.size || null,
        colour: i.option.colour || null,
        orientation: i.orientation || null,
        category: i.category || null,
        artworkPaths: i.artworkPaths?.length ? i.artworkPaths : null,
        customization: giftInfo ? { ...(i.customization || {}), gift: giftInfo } : i.customization || null,
      }));
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          items,
          customer: {
            name: d.name.trim(),
            mobile: d.mobile.trim(),
            email: d.email.trim() || null,
            address: d.address.trim(),
            city: d.city.trim(),
            state: d.state.trim() || null,
            pin: d.pin.trim(),
            coupon: cart.coupon?.code || null,
          },
        },
      });
      if (error || data?.error) {
        toast(data?.error || 'Could not create your order. Please try again.', 'warn');
        return;
      }
      const { razorpay_order_id, amount, currency, key_id, order_id, order_number } = data;
      const snapshot = cart.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price, option: i.option, image: i.image, preview: i.artworkPaths?.length ? '' : i.preview, colourHex: i.colourHex }));
      const previewItem = cart.items[0];
      const rzp = new window.Razorpay({
        key: key_id,
        amount,
        currency,
        order_id: razorpay_order_id,
        name: 'JHAYRA',
        description: 'Handcrafted frames & wall art',
        image: SITE.ogImage,
        prefill: { name: d.name.trim(), email: d.email.trim(), contact: d.mobile.trim() },
        notes: giftInfo ? { gift: 'yes' } : undefined,
        theme: { color: '#B68D40' },
        modal: {
          ondismiss: () => {
            setStatus('idle');
            lock.current = false;
          },
        },
        handler: async (resp) => {
          setStatus('verifying');
          try {
            const { data: v, error: ve } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: { razorpay_order_id: resp.razorpay_order_id, razorpay_payment_id: resp.razorpay_payment_id, razorpay_signature: resp.razorpay_signature, order_id },
            });
            if (ve || !v?.success) {
              setFailure('We couldn’t verify the payment. If money was deducted, please WhatsApp us — your order is safe.');
              setStatus('failed');
              return;
            }
            const done = {
              orderId: order_id,
              orderNumber: order_number || `ORD-${String(order_id).slice(0, 8).toUpperCase()}`,
              amount: amount / 100,
              paymentId: resp.razorpay_payment_id,
              customerName: d.name.trim(),
              date: new Date().toISOString(),
              items: snapshot.map((s, k) => (k === 0 ? { ...s, preview: previewItem.preview || previewItem.image } : s)),
              gift: !!giftInfo,
            };
            saveLocalOrder({ ...done, items: snapshot });
            setOrder(done);
            cart.clear();
            setStatus('success');
            window.scrollTo(0, 0);
          } catch {
            setFailure('Network problem while confirming the payment. If money was deducted, please WhatsApp us.');
            setStatus('failed');
          } finally {
            lock.current = false;
          }
        },
      });
      rzp.on('payment.failed', (r) => {
        setFailure(r?.error?.description || 'Payment failed. Please try again.');
        setStatus('failed');
        lock.current = false;
      });
      rzp.open();
      opened = true;
    } catch (e) {
      console.error(e);
      toast('Something went wrong. Please try again.', 'warn');
    } finally {
      if (!opened) {
        lock.current = false;
        setStatus('idle');
      } else setStatus((st) => (st === 'creating' ? 'idle' : st));
    }
  };

  if (order) return (
    <>
      <Seo title="Order Confirmed" path="/checkout" noindex />
      <Unboxing order={order} />
    </>
  );

  const win = deliveryWindow();
  const busy = status === 'creating' || status === 'verifying';

  return (
    <>
      <Seo title="Secure Checkout" path="/checkout" noindex />
      <section className="wrap checkout">
        <div className="ck-main">
          <Link to="/cart" className="crumbs" style={{ display: 'inline-flex' }}>
            <Icon name="arrowL" size={16} /> Back to cart
          </Link>
          <h1 className="h1" style={{ marginBottom: 6 }}>
            Checkout
          </h1>
          <p className="muted">
            <Icon name="lock" size={14} /> Secure · No account needed · Takes about a minute
          </p>

          <fieldset className="ck-sec">
            <legend>
              <span>1</span> Contact
            </legend>
            <div className="ck-grid">
              <div className="field span2">
                <label htmlFor="ck-name">Full name</label>
                <input id="ck-name" className="input" autoComplete="name" {...f('name')} />
                {errors.name && <small className="err">{errors.name}</small>}
              </div>
              <div className="field">
                <label htmlFor="ck-mobile">Mobile (for WhatsApp updates)</label>
                <input id="ck-mobile" className="input" inputMode="tel" autoComplete="tel-national" maxLength={14} {...f('mobile')} />
                {errors.mobile && <small className="err">{errors.mobile}</small>}
              </div>
              <div className="field">
                <label htmlFor="ck-email">
                  Email <span className="muted">(optional)</span>
                </label>
                <input id="ck-email" className="input" type="email" autoComplete="email" {...f('email')} />
                {errors.email && <small className="err">{errors.email}</small>}
              </div>
            </div>
          </fieldset>

          <fieldset className="ck-sec">
            <legend>
              <span>2</span> Delivery address
            </legend>
            <div className="ck-grid">
              <div className="field">
                <label htmlFor="ck-pin">Pincode</label>
                <input id="ck-pin" className="input" inputMode="numeric" autoComplete="postal-code" maxLength={6} {...f('pin')} onChange={(e) => (setD((x) => ({ ...x, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })), setErrors((x) => ({ ...x, pin: '' })))} />
                {pinState === 'ok' && <small className="ok">✓ We deliver here — free</small>}
                {pinState === 'bad' && <small className="err">Pincode not found — please check</small>}
                {errors.pin && <small className="err">{errors.pin}</small>}
              </div>
              <div className="field">
                <label htmlFor="ck-city">City</label>
                <input id="ck-city" className="input" autoComplete="address-level2" {...f('city')} />
                {errors.city && <small className="err">{errors.city}</small>}
              </div>
              <div className="field span2">
                <label htmlFor="ck-address">House, street, area, landmark</label>
                <textarea id="ck-address" className="textarea" rows={2} autoComplete="street-address" {...f('address')} />
                {errors.address && <small className="err">{errors.address}</small>}
              </div>
              <div className="field span2">
                <label htmlFor="ck-state">State</label>
                <input id="ck-state" className="input" autoComplete="address-level1" {...f('state')} />
              </div>
            </div>
            <div className="ck-eta">
              <Icon name="truck" size={18} /> Free delivery · arrives <b>{win.early} – {win.late}</b>
            </div>
          </fieldset>

          <fieldset className="ck-sec">
            <legend>
              <span>3</span> Is it a gift?
            </legend>
            <label className="toggle" style={{ marginBottom: gift.on ? 18 : 0 }}>
              <input type="checkbox" checked={gift.on} onChange={(e) => setGift((g) => ({ ...g, on: e.target.checked }))} />
              <span />
              Yes — add a free gift card {gift.on ? '' : '& hide the price'}
            </label>
            {gift.on && (
              <div className="gift-grid">
                <div className="ck-grid">
                  <div className="field">
                    <label htmlFor="g-to">To</label>
                    <input id="g-to" className="input" maxLength={30} value={gift.to} onChange={(e) => setGift((g) => ({ ...g, to: e.target.value }))} placeholder="Ananya" />
                  </div>
                  <div className="field">
                    <label htmlFor="g-from">From</label>
                    <input id="g-from" className="input" maxLength={30} value={gift.from} onChange={(e) => setGift((g) => ({ ...g, from: e.target.value }))} placeholder="Aarav" />
                  </div>
                  <div className="field span2">
                    <label htmlFor="g-note">
                      Your message <span className="muted" style={{ float: 'right' }}>{gift.note.length}/200</span>
                    </label>
                    <textarea id="g-note" className="textarea" maxLength={200} rows={3} value={gift.note} onChange={(e) => setGift((g) => ({ ...g, note: e.target.value }))} placeholder="Happy anniversary! Every year with you is my favourite photo." />
                  </div>
                  <label className="check span2">
                    <input type="checkbox" checked={gift.hidePrice} onChange={(e) => setGift((g) => ({ ...g, hidePrice: e.target.checked }))} /> Don’t put prices in the box
                  </label>
                </div>
                <GiftCard gift={gift} />
              </div>
            )}
          </fieldset>
        </div>

        <aside className="ck-side">
          <div className="summary card">
            <h2 className="h3">Your order</h2>
            <div className="ck-items">
              {cart.items.map((i) => (
                <div className="ck-item" key={i.key}>
                  <div className="ck-thumb">
                    <CartThumb item={i} />
                    <span className="ck-qty">{i.qty}</span>
                  </div>
                  <div className="grow">
                    <b>{i.name}</b>
                    <small>
                      {i.option.size} · {i.option.colour}
                    </small>
                  </div>
                  <span>{money(i.price * i.qty)}</span>
                </div>
              ))}
            </div>
            <CouponBox />
            <div className="sum-row">
              <span>Subtotal</span>
              <span>{money(cart.subtotal)}</span>
            </div>
            {cart.discount > 0 && (
              <div className="sum-row" style={{ color: 'var(--ok)' }}>
                <span>Discount ({cart.coupon.code})</span>
                <span>−{money(cart.discount)}</span>
              </div>
            )}
            <div className="sum-row">
              <span>Delivery</span>
              <span>Free</span>
            </div>
            {gift.on && (
              <div className="sum-row">
                <span>Gift card</span>
                <span>Free</span>
              </div>
            )}
            <div className="sum-row total">
              <span>Total</span>
              <span>{money(cart.total)}</span>
            </div>
            {failure && (
              <div className="ck-fail" role="alert">
                {failure}{' '}
                <a href={waLink(`Hi JHAYRA, my payment had a problem. Name: ${d.name}, Mobile: ${d.mobile}`)} target="_blank" rel="noopener noreferrer">
                  WhatsApp us
                </a>
              </div>
            )}
            <button className="btn btn-gold btn-lg btn-block ck-pay" disabled={busy || !cart.items.length} onClick={pay}>
              <Icon name="lock" size={18} /> {status === 'creating' ? 'Preparing secure payment…' : status === 'verifying' ? 'Confirming payment…' : `Pay ${money(cart.total)}`}
            </button>
            <div className="ck-methods" aria-label="Payment methods">
              <span>UPI</span>
              <span>GPay</span>
              <span>PhonePe</span>
              <span>Cards</span>
              <span>Netbanking</span>
            </div>
            <div className="ck-or">
              <span>or</span>
            </div>
            <a
              className="btn btn-ghost btn-block"
              href={waLink(orderText(cart.items, cart, d.name ? d : null) + (giftInfo ? `\n\nGift card — To: ${giftInfo.to || ''} From: ${giftInfo.from || ''}\n"${giftInfo.note || ''}"` : ''))}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppGlyph size={18} /> Order on WhatsApp
            </a>
            <ul className="ck-trust">
              <li>
                <Icon name="sparkle" size={16} /> Trusted by {BRAND.homes} homes since {BRAND.since}
              </li>
            </ul>
          </div>
        </aside>
      </section>
    </>
  );
}
