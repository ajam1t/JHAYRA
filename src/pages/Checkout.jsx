import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { PRODUCT_ART } from '../data/artwork';
import { supabase } from '../lib/supabase';
import SEO from '../components/SEO';

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export default function Checkout() {
  const { cartItems, subtotal, discountAmt, discountedTotal, appliedCoupon, money, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', mobile: '', email: '', address: '', city: '', state: '', pin: '' });
  const [payState, setPayState] = useState('idle'); // idle | creating | processing | success | failure
  const [orderId, setOrderId] = useState('');
  const [failReason, setFailReason] = useState('');
  const payingRef = useRef(false); // guard against double-click

  useEffect(() => {
    if (cartItems.length === 0 && payState !== 'success') navigate('/cart', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handlePay() {
    if (payingRef.current) return;
    if (!cartItems.length) { toast('Your cart is empty'); return; }
    if (!form.name.trim()) { toast('Please enter your full name'); return; }
    if (form.mobile.replace(/\D/g, '').length < 10) { toast('Enter a valid 10-digit mobile number'); return; }
    if (!form.address.trim() || !form.city.trim() || !form.pin.trim()) { toast('Please fill all delivery address fields'); return; }
    if (!/^\d{6}$/.test(form.pin)) { toast('Enter a valid 6-digit pincode'); return; }

    if (!supabase) {
      toast('Payment not available — Supabase not configured');
      return;
    }

    payingRef.current = true;
    setPayState('creating');

    try {
      // Load Razorpay SDK
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast('Could not load payment gateway. Check your internet connection.');
        setPayState('idle');
        payingRef.current = false;
        return;
      }

      // Build items payload for Edge Function
      const items = cartItems.map((item) => ({
        legacyId: item.meta?.productId || item.id.split('__')[0] || item.id,
        name: item.meta?.displayName || item.product?.name || 'Product',
        qty: item.qty,
        price: item.price,
        size: item.meta?.size || null,
        colour: item.meta?.colour || null,
        category: item.product?.category || null,
      }));

      // Call Edge Function — creates Razorpay order + Supabase order record
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          items,
          customer: {
            name: form.name.trim(),
            mobile: form.mobile.trim(),
            email: form.email.trim() || null,
            address: form.address.trim(),
            city: form.city.trim(),
            state: form.state.trim() || null,
            pin: form.pin.trim(),
            coupon: appliedCoupon?.code || null,
          },
        },
      });

      if (error || data?.error) {
        const msg = data?.error || 'Could not create order. Please try again.';
        toast(msg);
        setPayState('idle');
        payingRef.current = false;
        return;
      }

      const { razorpay_order_id, amount, currency, key_id, order_id } = data;

      // Open Razorpay Checkout modal
      const rzp = new window.Razorpay({
        key: key_id,
        amount,
        currency,
        order_id: razorpay_order_id,
        name: 'JHAYRA',
        description: 'Wall Art & Personalised Frames',
        image: 'https://jhayra.com/Images/personalized.jpg',
        prefill: {
          name: form.name.trim(),
          email: form.email.trim() || '',
          contact: form.mobile.trim(),
        },
        theme: { color: '#B68D40' },
        modal: {
          ondismiss: () => {
            setPayState('idle');
            payingRef.current = false;
          },
        },
        handler: async (response) => {
          setPayState('processing');
          try {
            // Verify payment server-side
            const { data: vData, error: vErr } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id,
              },
            });

            if (vErr || !vData?.success) {
              setFailReason('Payment could not be verified. If money was deducted, please contact us on WhatsApp.');
              setPayState('failure');
              payingRef.current = false;
              return;
            }

            clearCart();
            setOrderId(order_id);
            setPayState('success');
            payingRef.current = false;
          } catch {
            setFailReason('Network error during verification. If money was deducted, contact us on WhatsApp.');
            setPayState('failure');
            payingRef.current = false;
          }
        },
      });

      rzp.on('payment.failed', (response) => {
        setFailReason(response.error?.description || 'Payment failed. Please try again.');
        setPayState('failure');
        payingRef.current = false;
      });

      rzp.open();
    } catch (err) {
      console.error('Checkout error:', err);
      toast('Something went wrong. Please try again.');
      setPayState('idle');
      payingRef.current = false;
    }
  }

  // ── Success screen ────────────────────────────────
  if (payState === 'success') {
    return (
      <div data-page="checkout">
        <SEO title="Order Confirmed | JHAYRA" description="" path="/checkout" noindex={true} />
        <div className="container" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '480px' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
            <h1 style={{ fontFamily: 'var(--fd)', fontSize: '1.8rem', marginBottom: '.5rem' }}>Payment Successful!</h1>
            <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>Your order has been confirmed.</p>
            {orderId && (
              <div style={{ background: 'var(--bg)', border: '1px solid var(--cream)', borderRadius: 'var(--r)', padding: '.75rem 1.25rem', marginBottom: '1.5rem', fontFamily: 'monospace', fontSize: '.82rem', color: 'var(--muted)', wordBreak: 'break-all' }}>
                Order ID: {orderId.slice(0, 8).toUpperCase()}
              </div>
            )}
            <p style={{ fontSize: '.88rem', color: 'var(--muted)', marginBottom: '2rem', lineHeight: 1.7 }}>
              We'll contact you on WhatsApp to confirm delivery details. Thank you for choosing JHAYRA!
            </p>
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/shop" className="btn btn-gold">Continue Shopping</Link>
              <a href="https://wa.me/917070728989" target="_blank" rel="noopener noreferrer" className="btn btn-outline">WhatsApp Us</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Failure screen ────────────────────────────────
  if (payState === 'failure') {
    return (
      <div data-page="checkout">
        <SEO title="Payment Failed | JHAYRA" description="" path="/checkout" noindex={true} />
        <div className="container" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '480px' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>❌</div>
            <h1 style={{ fontFamily: 'var(--fd)', fontSize: '1.8rem', marginBottom: '.5rem' }}>Payment Failed</h1>
            {failReason && <p style={{ color: 'var(--muted)', marginBottom: '1.5rem', fontSize: '.9rem' }}>{failReason}</p>}
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-gold" onClick={() => { setPayState('idle'); payingRef.current = false; }}>Try Again</button>
              <a href="https://wa.me/917070728989" target="_blank" rel="noopener noreferrer" className="btn btn-outline">Contact Support</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isCreating = payState === 'creating' || payState === 'processing';
  const btnLabel = payState === 'creating' ? 'Creating order…' : payState === 'processing' ? 'Verifying payment…' : `Pay ${money(discountedTotal)}`;

  return (
    <div data-page="checkout">
      <SEO title="Checkout | JHAYRA" description="" path="/checkout" noindex={true} />
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow">Secure Checkout</p>
          <h1>Checkout</h1>
          <p>Almost there — just a few details</p>
        </div>
      </div>
      <div className="container">
        <div className="checkout-wrap">
          <div className="box">
            <h3 style={{ fontFamily: 'var(--fd)', fontSize: '1.2rem', marginBottom: '1.2rem' }}>Delivery Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-input" placeholder="John Doe" value={form.name} onChange={set('name')} disabled={isCreating} />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile *</label>
                <input type="tel" className="form-input" placeholder="10-digit number" value={form.mobile} onChange={set('mobile')} disabled={isCreating} inputMode="numeric" />
              </div>
              <div className="form-group full">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" placeholder="you@email.com" value={form.email} onChange={set('email')} disabled={isCreating} />
              </div>
              <div className="form-group full">
                <label className="form-label">Address *</label>
                <textarea className="form-textarea" placeholder="Street, Area" rows={2} value={form.address} onChange={set('address')} disabled={isCreating} />
              </div>
              <div className="form-group">
                <label className="form-label">City *</label>
                <input type="text" className="form-input" placeholder="City" value={form.city} onChange={set('city')} disabled={isCreating} />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input type="text" className="form-input" placeholder="State" value={form.state} onChange={set('state')} disabled={isCreating} />
              </div>
              <div className="form-group">
                <label className="form-label">Pincode *</label>
                <input type="text" className="form-input" placeholder="6-digit pincode" maxLength={6} pattern="[0-9]{6}" inputMode="numeric" value={form.pin} onChange={set('pin')} disabled={isCreating} />
              </div>
            </div>

            <h3 style={{ fontFamily: 'var(--fd)', fontSize: '1.2rem', margin: '1.6rem 0 .75rem' }}>Payment</h3>

            <button
              id="payBtn"
              className="btn btn-gold btn-lg"
              style={{ width: '100%', opacity: isCreating ? 0.7 : 1, cursor: isCreating ? 'not-allowed' : 'pointer' }}
              onClick={handlePay}
              disabled={isCreating}
            >
              {isCreating ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
                  <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
                  {btnLabel}
                </span>
              ) : btnLabel}
            </button>

            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', fontSize: '.82rem', color: 'var(--muted)', marginTop: '1rem', padding: '.8rem', background: 'var(--bg)', borderRadius: 'var(--r)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              <span>Secured by Razorpay. UPI, Cards, Net Banking & Wallets accepted.</span>
            </div>
          </div>

          <div className="summary">
            <h3>Order Summary</h3>
            <div style={{ marginBottom: '1rem' }}>
              {cartItems.map(({ id, product, qty, price, meta }) => {
                const art = PRODUCT_ART[product.id];
                const name = meta?.displayName || product.name;
                const frameLabel = meta?.size ? `${meta.size} · ${meta.colour}` : `Qty: ${qty}`;
                return (
                  <div key={id} style={{ display: 'flex', gap: '.6rem', alignItems: 'center', marginBottom: '.75rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '.4rem', overflow: 'hidden', flexShrink: 0, background: art ? `${art.fc}dd` : 'var(--bg)' }}>
                      {art && <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ height: '80%', aspectRatio: '200/260', overflow: 'hidden', borderRadius: '1px' }} dangerouslySetInnerHTML={{ __html: art.art }} /></div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                      <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{frameLabel} · Qty: {qty}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '.88rem', flexShrink: 0 }}>₹{(price * qty).toLocaleString('en-IN')}</div>
                  </div>
                );
              })}
            </div>
            <div className="sum-row"><span style={{ color: 'var(--muted)' }}>Subtotal</span><span>{money(subtotal)}</span></div>
            {discountAmt > 0 && <div className="sum-row"><span style={{ color: 'var(--ok)' }}>Discount ({appliedCoupon?.code})</span><span style={{ color: 'var(--ok)' }}>−{money(discountAmt)}</span></div>}
            <div className="sum-row"><span style={{ color: 'var(--muted)' }}>Delivery</span><span style={{ color: '#22873A', fontWeight: 600 }}>FREE</span></div>
            <div className="sum-total"><span>Total</span><b>{money(discountedTotal)}</b></div>
          </div>
        </div>
      </div>
    </div>
  );
}
