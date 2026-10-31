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
import { useActiveCampaign } from '../lib/campaigns';
import { trackStep } from '../lib/analytics';
import { founderEligible, useSignature } from '../lib/signature';
import { money, waLink, deliveryWindow, SITE, mobile10, GIFT_FEE } from '../lib/site';
import { BRAND } from '../lib/brand';

// Loads Razorpay once (started as soon as checkout opens). Gives up after
// 15 s so a network that silently holds the request never freezes checkout.
let rzpLoading = null;
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  if (!rzpLoading) {
    rzpLoading = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.async = true;
      s.onload = () => resolve(!!window.Razorpay);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    }).then((ok) => {
      if (!ok) rzpLoading = null;
      return ok;
    });
  }
  return Promise.race([rzpLoading, new Promise((r) => setTimeout(() => r(window.Razorpay ? true : false), 15000))]);
}
const TIMEOUT = 'timeout';
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error(TIMEOUT)), ms))]);

const SAVED = 'jhayra_checkout_details';
const EMPTY = { name: '', mobile: '', email: '', address: '', house: '', area: '', landmark: '', city: '', state: '', pin: '' };

export const JOURNEY = [
  ['Order placed', 'check'],
  ['Crafting', 'brush'],
  ['Quality check', 'shield'],
  ['Packed', 'box'],
  ['Shipped', 'truck'],
  ['Delivered', 'home'],
];


const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Pay button: a delivery truck runs while payment is prepared and
   confirmed, then it turns green — "Order placed". ─────────────────────── */
function PayButton({ status, label, onClick, disabled, className = '', compact = false }) {
  const running = status === 'creating' || status === 'verifying';
  const placed = status === 'placed';
  const state = placed ? 'placed' : running ? 'run' : '';
  const text = placed ? 'Order placed' : status === 'creating' ? (compact ? 'Preparing…' : 'Preparing secure payment…') : status === 'verifying' ? (compact ? 'Confirming…' : 'Confirming payment…') : label;
  return (
    <button className={`btn btn-gold ck-paybtn ${state} ${className}`} disabled={disabled} onClick={onClick} aria-live="polite">
      <span className="ck-paybtn-road" aria-hidden="true">
        <i />
        <span className="ck-truck">
          <Icon name="truck" size={compact ? 18 : 22} />
        </span>
      </span>
      <span className="ck-paybtn-txt">
        {placed ? <Icon name="check" size={compact ? 16 : 18} /> : running ? null : <Icon name="lock" size={compact ? 16 : 18} />} {running ? <span className="ck-run-txt">{text}</span> : text}
      </span>
    </button>
  );
}

/* ── Receipt that prints out of a gold slot on the thank-you page ─────── */
function barcode(seed) {
  const bars = [];
  let h = 0;
  for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  for (let i = 0; i < 46; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    bars.push(1 + (h % 3));
  }
  return bars;
}
function Receipt({ order }) {
  const [printed, setPrinted] = useState(reducedMotion());
  useEffect(() => {
    const t = setTimeout(() => setPrinted(true), 2600);
    return () => clearTimeout(t);
  }, []);
  const when = new Date(order.date);
  const win = deliveryWindow(when);
  const lines = order.items || [];
  const share = waLink(
    [`JHAYRA receipt — ${order.orderNumber}`, ...lines.map((i) => `• ${i.name} (${i.option?.size}, ${i.option?.colour}) × ${i.qty} — ${money(i.price * i.qty)}`), order.giftFee ? `Gift packaging & card — ${money(order.giftFee)}` : '', `Total paid: ${money(order.amount)}`, `Arriving ${win.early} – ${win.late}`].filter(Boolean).join('\n'),
  );
  return (
    <section className="rcpt-wrap" aria-label="Your receipt">
      <div className="rcpt-slot" aria-hidden="true">
        <span />
      </div>
      <div className="rcpt-clip">
        <article className={`rcpt ${printed ? 'done' : ''}`}>
          <header className="rcpt-head">
            <img src="/logo-mark.webp" alt="" width="40" height="36" />
            <div>
              <b>JHAYRA</b>
              <small>Crafting Memories Into Art</small>
            </div>
          </header>
          <div className="rcpt-total">
            <small>Amount paid</small>
            <b>{money(order.amount)}</b>
            <span>{when.toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
          </div>
          <dl className="rcpt-meta">
            <div>
              <dt>Order</dt>
              <dd>{order.orderNumber}</dd>
            </div>
            <div>
              <dt>For</dt>
              <dd>{order.customerName}</dd>
            </div>
            {order.city && (
              <div>
                <dt>Deliver to</dt>
                <dd>
                  {order.city}
                  {order.state ? `, ${order.state}` : ''}
                </dd>
              </div>
            )}
          </dl>
          <ul className="rcpt-lines">
            {lines.map((i, k) => (
              <li key={k}>
                <span>
                  {i.qty} × {i.name}
                  <small>
                    {i.option?.size} · {i.option?.colour} frame
                  </small>
                </span>
                <b>{money(i.price * i.qty)}</b>
              </li>
            ))}
          </ul>
          <div className="rcpt-sums">
            {order.subtotal != null && (
              <p>
                <span>Subtotal</span>
                <span>{money(order.subtotal)}</span>
              </p>
            )}
            {order.discount > 0 && (
              <p>
                <span>Discount{order.coupon ? ` (${order.coupon})` : ''}</span>
                <span>−{money(order.discount)}</span>
              </p>
            )}
            {order.giftFee > 0 && (
              <p>
                <span>Gift packaging & card</span>
                <span>{money(order.giftFee)}</span>
              </p>
            )}
            {order.founderFee > 0 && (
              <p>
                <span>Founder delivery</span>
                <span>{money(order.founderFee)}</span>
              </p>
            )}
            <p>
              <span>Delivery</span>
              <span>Free</span>
            </p>
            <p className="rcpt-grand">
              <span>Total</span>
              <span>{money(order.amount)}</span>
            </p>
          </div>
          <p className="rcpt-eta">
            Handcrafted for you · arriving {win.early} – {win.late}
          </p>
          <div className="rcpt-bars" aria-hidden="true">
            {barcode(order.orderNumber).map((w, k) => (
              <i key={k} style={{ width: w }} />
            ))}
          </div>
          <p className="rcpt-id">
            {order.orderNumber}
            {order.paymentId ? ` · ${order.paymentId}` : ''}
          </p>
          <p className="rcpt-thanks">Thank you for choosing JHAYRA</p>
        </article>
      </div>
      <div className={`rcpt-actions ${printed ? 'show' : ''}`}>
        <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
          <Icon name="download" size={17} /> Save receipt
        </button>
        <a className="btn btn-ghost" href={share} target="_blank" rel="noopener noreferrer">
          <WhatsAppGlyph size={17} /> Share
        </a>
      </div>
    </section>
  );
}

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
            <Link to={`/track?order=${encodeURIComponent(order.orderNumber || '')}`} className="btn btn-ghost">
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
      <Receipt order={order} />
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

// Our own endpoint first (works on networks that block the India Post
// service), then the India Post service directly.
async function lookupPin(pin, signal) {
  const tries = [
    async () => {
      const r = await fetch(`/api/pincode?pin=${pin}`, { signal });
      const j = await r.json();
      if (j.ok || j.reason === 'not_found') return j;
      throw new Error('unavailable');
    },
    async () => {
      const res = await (await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal })).json();
      const po = res?.[0]?.PostOffice?.[0];
      if (res?.[0]?.Status === 'Success' && po) return { ok: true, city: po.District || po.Name, state: po.State };
      if (res?.[0]?.Status === 'Error') return { ok: false, reason: 'not_found' };
      throw new Error('unavailable');
    },
  ];
  for (const t of tries) {
    try {
      return await Promise.race([t(), new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 7000))]);
    } catch {
      if (signal.aborted) return { ok: false, reason: 'aborted' };
    }
  }
  return { ok: false, reason: 'unavailable' };
}

// India Post's pincode zones → state (used only when the lookup is unreachable).
const PIN3 = { 160: 'Chandigarh', 194: 'Ladakh', 246: 'Uttarakhand', 248: 'Uttarakhand', 249: 'Uttarakhand', 263: 'Uttarakhand', 403: 'Goa', 605: 'Puducherry', 737: 'Sikkim', 744: 'Andaman & Nicobar', 790: 'Arunachal Pradesh', 791: 'Arunachal Pradesh', 792: 'Arunachal Pradesh', 793: 'Meghalaya', 794: 'Meghalaya', 795: 'Manipur', 796: 'Mizoram', 797: 'Nagaland', 798: 'Nagaland', 799: 'Tripura', 814: 'Jharkhand', 815: 'Jharkhand', 816: 'Jharkhand' };
const PIN2 = { 11: 'Delhi', 12: 'Haryana', 13: 'Haryana', 14: 'Punjab', 15: 'Punjab', 16: 'Punjab', 17: 'Himachal Pradesh', 18: 'Jammu & Kashmir', 19: 'Jammu & Kashmir', 20: 'Uttar Pradesh', 21: 'Uttar Pradesh', 22: 'Uttar Pradesh', 23: 'Uttar Pradesh', 24: 'Uttar Pradesh', 25: 'Uttar Pradesh', 26: 'Uttar Pradesh', 27: 'Uttar Pradesh', 28: 'Uttar Pradesh', 30: 'Rajasthan', 31: 'Rajasthan', 32: 'Rajasthan', 33: 'Rajasthan', 34: 'Rajasthan', 36: 'Gujarat', 37: 'Gujarat', 38: 'Gujarat', 39: 'Gujarat', 40: 'Maharashtra', 41: 'Maharashtra', 42: 'Maharashtra', 43: 'Maharashtra', 44: 'Maharashtra', 45: 'Madhya Pradesh', 46: 'Madhya Pradesh', 47: 'Madhya Pradesh', 48: 'Madhya Pradesh', 49: 'Chhattisgarh', 50: 'Telangana', 51: 'Andhra Pradesh', 52: 'Andhra Pradesh', 53: 'Andhra Pradesh', 56: 'Karnataka', 57: 'Karnataka', 58: 'Karnataka', 59: 'Karnataka', 60: 'Tamil Nadu', 61: 'Tamil Nadu', 62: 'Tamil Nadu', 63: 'Tamil Nadu', 64: 'Tamil Nadu', 67: 'Kerala', 68: 'Kerala', 69: 'Kerala', 70: 'West Bengal', 71: 'West Bengal', 72: 'West Bengal', 73: 'West Bengal', 74: 'West Bengal', 75: 'Odisha', 76: 'Odisha', 77: 'Odisha', 78: 'Assam', 80: 'Bihar', 81: 'Bihar', 82: 'Jharkhand', 83: 'Jharkhand', 84: 'Bihar', 85: 'Bihar' };
const stateFromPin = (pin) => PIN3[pin.slice(0, 3)] || PIN2[pin.slice(0, 2)] || '';

export default function Checkout() {
  const cart = useCart();
  const toast = useToast();
  const fest = useFestival();
  const campaign = useActiveCampaign();
  // A live campaign's coupon applies automatically, like a festival offer.
  const festival = fest?.coupon ? fest : campaign?.coupon && !campaign.preview ? { name: campaign.title, coupon: campaign.coupon } : fest;
  const navigate = useNavigate();
  const [d, setD] = useState(() => {
    try {
      const saved = { ...EMPTY, ...JSON.parse(localStorage.getItem(SAVED) || '{}') };
      // Older saved details had one address line.
      if (!saved.house && !saved.area && saved.address) saved.house = saved.address;
      return saved;
    } catch {
      return EMPTY;
    }
  });
  const [pinState, setPinState] = useState('');
  const [editPlace, setEditPlace] = useState(false);
  // The full address as the workshop and courier read it.
  const addr = [d.house.trim(), d.area.trim(), d.landmark.trim() && `Near ${d.landmark.trim()}`].filter(Boolean).join(', ');
  const [errors, setErrors] = useState({});
  const [params] = useSearchParams();
  // ?gift=1 (from the Signature Experience) opens the gift card section.
  const [gift, setGift] = useState({ on: params.get('gift') === '1', to: '', from: '', note: '', hidePrice: true });
  const [status, setStatus] = useState('idle');
  const [failure, setFailure] = useState('');
  const [order, setOrder] = useState(null);
  const lock = useRef(false);
  const tried = useRef(false);
  // Signature items: concierge confirmation (until the payment function prices
  // Signature on the server) and optional founder delivery.
  const sig = useSignature();
  const hasSig = cart.items.some((i) => i.signature);
  const [founder, setFounder] = useState({ on: false, slot: '' });
  const founderOk = hasSig && founderEligible(d.pin, sig);
  const founderFee = founder.on && founderOk ? Number(sig.founder.fee) || 0 : 0;
  const giftFee = gift.on ? GIFT_FEE : 0;
  const grand = cart.total + founderFee + giftFee;
  const concierge = hasSig && !sig.checkout?.online;

  useEffect(() => {
    if (cart.items.length === 0 && !order) navigate('/cart', { replace: true });
    else if (!order) trackStep('checkout_start');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Start loading the payment window early so the Pay button opens it instantly.
  useEffect(() => {
    if (!order) loadRazorpay();
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
    lookupPin(d.pin, ac.signal).then((r) => {
      if (ac.signal.aborted) return;
      if (r.ok) {
        setD((x) => ({ ...x, city: r.city || x.city, state: r.state || x.state }));
        setPinState('ok');
      } else if (r.reason === 'not_found') setPinState('bad');
      else {
        // Lookup service unreachable: fill the state from the pincode's first
        // digits and let the customer type the city.
        const st = stateFromPin(d.pin);
        if (st) setD((x) => ({ ...x, state: x.state || st }));
        setPinState('manual');
      }
    });
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
    if (!/^[6-9]\d{9}$/.test(mobile10(d.mobile))) e.mobile = 'Please enter a valid 10-digit mobile number';
    if (!/^\d{6}$/.test(d.pin)) e.pin = 'Enter a valid 6-digit pincode';
    if (!d.house.trim()) e.house = 'Please enter your house / flat and street';
    if (!d.area.trim()) e.area = 'Please enter your area or locality';
    if (!d.city.trim()) e.city = 'Please enter your city';
    if ((e.city || e.state) && /^\d{6}$/.test(d.pin)) setEditPlace(true);
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) document.getElementById(`ck-${first}`)?.focus();
    return !first;
  };

  const giftInfo = gift.on ? { to: gift.to.trim() || null, from: gift.from.trim() || null, note: gift.note.trim() || null, hidePrice: true, packaging: 'premium' } : null;

  const pay = async () => {
    if (lock.current || !validate()) return;
    if (founder.on && founderOk && !founder.slot) {
      toast('Please choose a founder-delivery slot.', 'warn');
      document.getElementById('ck-slot')?.focus();
      return;
    }
    if (concierge) {
      try {
        localStorage.setItem(SAVED, JSON.stringify(d));
      } catch {}
      const lines = cart.items.map((i) => `• ${i.name} — ${i.option.size}, ${i.option.colour} frame × ${i.qty} = ${money(i.price * i.qty)}`);
      const msg = [
        'Hi JHAYRA! I would like to confirm my Signature order:',
        ...lines,
        cart.discount > 0 ? `Discount (${cart.coupon.code}): −${money(cart.discount)}` : '',
        founderFee ? `Founder delivery: ${money(founderFee)} · preferred slot: ${founder.slot}` : '',
        giftFee ? `Gift packaging & greeting card: ${money(giftFee)}` : '',
        `Total: ${money(grand)}`,
        '',
        `Name: ${d.name}`,
        `Mobile: ${d.mobile}`,
        `Address: ${addr}, ${d.city}${d.state ? `, ${d.state}` : ''} – ${d.pin}`,
        giftInfo ? `Gift card — to: ${giftInfo.to || '—'}, from: ${giftInfo.from || '—'}, message: ${giftInfo.note || '—'}${giftInfo.hidePrice ? ' (hide prices)' : ''}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      window.open(waLink(msg), '_blank', 'noopener');
      toast('Opening WhatsApp — our concierge will confirm your Signature order and send a secure payment link.', 'ok');
      return;
    }
    try {
      localStorage.setItem(SAVED, JSON.stringify({ ...d, address: addr }));
    } catch {}
    lock.current = true;
    setStatus('creating');
    setFailure('');
    let opened = false;
    try {
      if (!(await loadRazorpay())) {
        toast('Payment window couldn’t load on this network.', 'warn');
        setFailure('The secure payment window couldn’t load on this network (some office or public Wi-Fi networks block it). Please try on mobile data, or order on WhatsApp below — we’ll send you a payment link.');
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
        ...(i.signature ? { signature: true } : {}),
      }));
      const { data, error } = await withTimeout(supabase.functions.invoke('create-razorpay-order', {
        body: {
          items,
          customer: {
            name: d.name.trim(),
            mobile: mobile10(d.mobile),
            email: null,
            address: addr,
            city: d.city.trim(),
            state: d.state.trim() || null,
            pin: d.pin.trim(),
            coupon: cart.coupon?.code || null,
          },
          ...(founderFee ? { founderDelivery: { fee: founderFee, slot: founder.slot } } : {}),
          ...(giftInfo ? { gift: true } : {}),
        },
      }), 25000);
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
        image: `${SITE.url}/icon-512.png`,
        prefill: { name: d.name.trim(), contact: mobile10(d.mobile) },
        notes: giftInfo ? { gift: 'yes' } : undefined,
        theme: { color: '#B08A45', backdrop_color: 'rgba(20, 16, 10, 0.72)' },
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
              subtotal: cart.subtotal,
              discount: cart.discount,
              coupon: cart.coupon?.code || null,
              giftFee,
              founderFee,
              city: d.city,
              state: d.state,
            };
            saveLocalOrder({ ...done, items: snapshot });
            // The button turns green ("Order placed") for a moment before the
            // thank-you page and receipt appear.
            setStatus('placed');
            setTimeout(() => {
              setOrder(done);
              cart.clear();
              setStatus('success');
              window.scrollTo(0, 0);
            }, reducedMotion() ? 200 : 1700);
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
      if (e?.message === TIMEOUT) toast('Payment server didn’t respond — please try again.', 'warn');
      if (e?.message === TIMEOUT) setFailure('Our payment server didn’t respond in time — this network may be blocking it. Please try again on mobile data, or order on WhatsApp below.');
      else toast('Something went wrong. Please try again.', 'warn');
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
  const busy = status === 'creating' || status === 'verifying' || status === 'placed';

  return (
    <>
      <Seo title="Secure Checkout" path="/checkout" noindex />
      <section className="wrap checkout">
        <div className="ck-main">
          <Link to="/cart" className="crumbs" style={{ display: 'inline-flex' }}>
            <Icon name="arrowL" size={16} /> Back to bag
          </Link>
          <ol className="ck-steps" aria-label="Checkout progress">
            <li className="done">
              <span>
                <Icon name="check" size={12} />
              </span>{' '}
              Bag
            </li>
            <li className="on" aria-current="step">
              <span>2</span> Details
            </li>
            <li>
              <span>3</span> Payment
            </li>
          </ol>
          <h1 className="h1 ck-title">Almost yours.</h1>
          <p className="muted ck-sub">
            <Icon name="lock" size={14} /> Secure checkout · no account needed · about a minute
          </p>

          <fieldset className="ck-sec ck-anim" style={{ '--i': 0 }}>
            <legend>
              <span>1</span> Your details
            </legend>
            <div className="ck-grid">
              <div className="field span2">
                <label htmlFor="ck-name">Full name</label>
                <input id="ck-name" className="input" autoComplete="name" {...f('name')} />
                {errors.name && <small className="err">{errors.name}</small>}
              </div>
              <div className="field span2">
                <label htmlFor="ck-mobile">Mobile number</label>
                <div className="ck-phone">
                  <span>+91</span>
                  <input id="ck-mobile" className="input" type="tel" inputMode="tel" autoComplete="tel-national" maxLength={16} {...f('mobile')} />
                </div>
                <small className="muted">Order updates and tracking on WhatsApp</small>
                {errors.mobile && <small className="err">{errors.mobile}</small>}
              </div>
            </div>
          </fieldset>

          <fieldset className="ck-sec ck-anim" style={{ '--i': 1 }}>
            <legend>
              <span>2</span> Delivery address
            </legend>
            <div className="field">
              <label htmlFor="ck-pin">Pincode</label>
              <div className={`ck-pin ${pinState}`}>
                <input id="ck-pin" className="input" inputMode="numeric" autoComplete="postal-code" maxLength={6} placeholder="6-digit pincode" {...f('pin')} onChange={(e) => (setD((x) => ({ ...x, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })), setErrors((x) => ({ ...x, pin: '' })), setEditPlace(false))} />
                <span className="ck-pin-ic" aria-hidden="true">
                  {pinState === 'loading' ? <i className="ck-spin" /> : pinState === 'ok' ? <Icon name="check" size={18} /> : <Icon name="pin" size={18} />}
                </span>
              </div>
              {pinState === 'manual' && <small className="muted">Please type your city below{d.state ? ` — we’ve filled in ${d.state}` : ''}.</small>}
              {pinState === 'bad' && <small className="err">We couldn’t find this pincode — please check it, or enter your city and state below.</small>}
              {errors.pin && <small className="err">{errors.pin}</small>}
            </div>

            {pinState === 'ok' && !editPlace && (
              <div className="ck-place" role="status">
                <Icon name="pin" size={18} />
                <div>
                  <b>
                    {d.city}
                    {d.state ? `, ${d.state}` : ''}
                  </b>
                  <small>Free delivery · arrives {win.early} – {win.late}</small>
                </div>
                <button type="button" className="link small" onClick={() => setEditPlace(true)}>
                  Change
                </button>
              </div>
            )}

            <div className={`ck-reveal ${/^\d{6}$/.test(d.pin) && pinState !== 'loading' ? 'open' : ''}`}>
              <div>
                {(editPlace || pinState === 'bad' || (pinState !== 'ok' && /^\d{6}$/.test(d.pin))) && (
                  <div className="ck-grid">
                    <div className="field">
                      <label htmlFor="ck-city">City</label>
                      <input id="ck-city" className="input" autoComplete="address-level2" {...f('city')} />
                      {errors.city && <small className="err">{errors.city}</small>}
                    </div>
                    <div className="field">
                      <label htmlFor="ck-state">State</label>
                      <input id="ck-state" className="input" autoComplete="address-level1" {...f('state')} />
                    </div>
                  </div>
                )}
                <div className="ck-grid">
                  <div className="field span2">
                    <label htmlFor="ck-house">House / flat no., building, street</label>
                    <input id="ck-house" className="input" autoComplete="address-line1" placeholder="e.g. 12B, Shanti Apartments, MG Road" {...f('house')} />
                    {errors.house && <small className="err">{errors.house}</small>}
                  </div>
                  <div className="field span2">
                    <label htmlFor="ck-area">Area / locality</label>
                    <input id="ck-area" className="input" autoComplete="address-line2" placeholder="e.g. Boring Road" {...f('area')} />
                    {errors.area && <small className="err">{errors.area}</small>}
                  </div>
                  <div className="field span2">
                    <label htmlFor="ck-landmark">
                      Landmark <span className="muted">(optional)</span>
                    </label>
                    <input id="ck-landmark" className="input" placeholder="e.g. opposite City Hospital" {...f('landmark')} />
                  </div>
                </div>
              </div>
            </div>
            {!/^\d{6}$/.test(d.pin) && <p className="muted small ck-hint">Enter your pincode — we’ll fill in your city and state.</p>}
          </fieldset>

          {hasSig && sig.founder.enabled && (
            <fieldset className="ck-sec ck-founder">
              <legend>
                <span>✦</span> Signature founder delivery
              </legend>
              {founderOk ? (
                <>
                  <label className="toggle" style={{ marginBottom: founder.on ? 14 : 0 }}>
                    <input type="checkbox" checked={founder.on} onChange={(e) => setFounder((f) => ({ ...f, on: e.target.checked }))} />
                    <span />
                    Delivered personally by the founder — {money(sig.founder.fee)}
                  </label>
                  {founder.on && (
                    <div className="field">
                      <label htmlFor="ck-slot">Preferred slot (confirmed with you on WhatsApp)</label>
                      <select id="ck-slot" className="input" value={founder.slot} onChange={(e) => setFounder((f) => ({ ...f, slot: e.target.value }))}>
                        <option value="">Choose a slot…</option>
                        {sig.founder.slots.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              ) : (
                <p className="muted small" style={{ margin: 0 }}>
                  Available in {sig.founder.areas.join(', ')}. {/^\d{6}$/.test(d.pin) ? 'Not available at this pincode — your order ships with our standard free delivery.' : 'Enter your pincode above to check.'}
                </p>
              )}
            </fieldset>
          )}

          <fieldset className={`ck-sec ck-anim ck-gift ${gift.on ? 'on' : ''}`} style={{ '--i': 2 }}>
            <legend>
              <span>3</span> Sending it as a gift?
            </legend>
            <button type="button" className="ck-gift-card" aria-pressed={gift.on} onClick={() => setGift((g) => ({ ...g, on: !g.on }))}>
              <span className="ck-gift-box" aria-hidden="true">
                <i />
              </span>
              <span className="ck-gift-copy">
                <b>Make it a gift</b>
                <span className="ck-gift-perks">
                  <span>
                    <Icon name="box" size={14} /> Premium gift packaging
                  </span>
                  <span>
                    <Icon name="edit" size={14} /> Greeting card with your message
                  </span>
                  <span>
                    <Icon name="eye" size={14} /> No price anywhere in the box
                  </span>
                </span>
              </span>
              <span className="ck-gift-price">
                +{money(GIFT_FEE)}
                <span className={`ck-switch ${gift.on ? 'on' : ''}`} aria-hidden="true">
                  <i />
                </span>
              </span>
            </button>
            <div className={`ck-reveal ${gift.on ? 'open' : ''}`}>
              <div>
                <div className="gift-grid">
                  <div className="ck-grid">
                    <div className="field">
                      <label htmlFor="g-to">To</label>
                      <input id="g-to" className="input" maxLength={30} value={gift.to} onChange={(e) => setGift((g) => ({ ...g, to: e.target.value }))} placeholder="Ananya" tabIndex={gift.on ? undefined : -1} />
                    </div>
                    <div className="field">
                      <label htmlFor="g-from">From</label>
                      <input id="g-from" className="input" maxLength={30} value={gift.from} onChange={(e) => setGift((g) => ({ ...g, from: e.target.value }))} placeholder="Aarav" tabIndex={gift.on ? undefined : -1} />
                    </div>
                    <div className="field span2">
                      <label htmlFor="g-note">
                        Message for the greeting card <span className="muted" style={{ float: 'right' }}>{gift.note.length}/200</span>
                      </label>
                      <textarea id="g-note" className="textarea" maxLength={200} rows={3} value={gift.note} onChange={(e) => setGift((g) => ({ ...g, note: e.target.value }))} placeholder="Happy anniversary! Every year with you is my favourite photo." tabIndex={gift.on ? undefined : -1} />
                    </div>
                  </div>
                  <GiftCard gift={gift} />
                </div>
              </div>
            </div>
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
                <span>Gift packaging & card</span>
                <span>{money(GIFT_FEE)}</span>
              </div>
            )}
            {hasSig && (
              <div className="sum-row">
                <span>Premium packaging</span>
                <span>Included</span>
              </div>
            )}
            {founderFee > 0 && (
              <div className="sum-row">
                <span>Founder delivery</span>
                <span>{money(founderFee)}</span>
              </div>
            )}
            <div className="sum-row total">
              <span>Total</span>
              <span>{money(grand)}</span>
            </div>
            {failure && (
              <div className="ck-fail" role="alert">
                {failure}{' '}
                <a href={waLink(`Hi JHAYRA, my payment had a problem. Name: ${d.name}, Mobile: ${d.mobile}`)} target="_blank" rel="noopener noreferrer">
                  WhatsApp us
                </a>
              </div>
            )}
            <PayButton className="btn-lg btn-block ck-pay" status={status} disabled={busy || !cart.items.length} onClick={pay} label={concierge ? `Confirm with Signature concierge · ${money(grand)}` : `Pay ${money(grand)}`} />
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
              href={waLink(orderText(cart.items, cart, d.name ? { ...d, address: addr } : null) + (giftInfo ? `\n\nGift card — To: ${giftInfo.to || ''} From: ${giftInfo.from || ''}\n"${giftInfo.note || ''}"` : ''))}
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
      <div className="ck-bar">
        <div>
          <small>Total{gift.on ? ' · gift' : ''}</small>
          <b key={grand}>{money(grand)}</b>
        </div>
        <PayButton status={status} disabled={busy || !cart.items.length} onClick={pay} label={concierge ? 'Confirm' : 'Pay securely'} compact />
      </div>
    </>
  );
}
