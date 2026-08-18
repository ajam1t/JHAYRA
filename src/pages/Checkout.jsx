import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { PRODUCT_ART } from '../data/artwork';
import FramedArt from '../components/FramedArt';
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

function CheckMark() {
  return (
    <svg className="ck-svg" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle className="ck-circle" cx="40" cy="40" r="37" stroke="var(--gold)" strokeWidth="3" />
      <path className="ck-path" d="M22 41L34 53L58 27" stroke="var(--gold)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const PROGRESS_STEPS = [
  { id: 'placed', label: 'Order Placed' },
  { id: 'personalization', label: 'Personalization' },
  { id: 'packed', label: 'Packed' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
];

export default function Checkout() {
  const { cartItems, subtotal, discountAmt, discountedTotal, appliedCoupon, money, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', mobile: '', email: '', address: '', city: '', state: '', pin: '' });
  const [payState, setPayState] = useState('idle'); // idle | creating | processing | success | failure | dismissed
  const [payData, setPayData] = useState(null);
  const [failReason, setFailReason] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [pinStatus, setPinStatus] = useState(''); // '' | 'loading' | 'ok' | 'error'
  const payingRef = useRef(false);

  useEffect(() => {
    if (cartItems.length === 0 && payState !== 'success') navigate('/cart', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (payState === 'success') {
      const t = setTimeout(() => setShowReceipt(true), 1000);
      return () => clearTimeout(t);
    }
  }, [payState]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // Pincode auto-fetch: populate city + state from India Post API
  useEffect(() => {
    if (!/^\d{6}$/.test(form.pin)) { setPinStatus(''); return; }
    setPinStatus('loading');
    const ctrl = new AbortController();
    fetch(`https://api.postalpincode.in/pincode/${form.pin}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => {
        const po = data?.[0]?.PostOffice?.[0];
        if (data?.[0]?.Status === 'Success' && po) {
          setForm(f => ({ ...f, city: po.District || po.Name || f.city, state: po.State || f.state }));
          setPinStatus('ok');
        } else {
          setPinStatus('error');
        }
      })
      .catch(() => { /* aborted or network — silently let user fill manually */ setPinStatus('error'); });
    return () => ctrl.abort();
  }, [form.pin]); // eslint-disable-line react-hooks/exhaustive-deps

  function validateForm() {
    if (!cartItems.length) { toast('Your cart is empty'); return false; }
    if (!form.name.trim()) { toast('Please enter your full name'); return false; }
    const digits = form.mobile.replace(/\D/g, '');
    if (digits.length !== 10) { toast('Mobile number must be exactly 10 digits'); return false; }
    if (!form.address.trim() || !form.city.trim() || !form.pin.trim()) { toast('Please fill all delivery address fields'); return false; }
    if (!/^\d{6}$/.test(form.pin)) { toast('Enter a valid 6-digit pincode'); return false; }
    return true;
  }

  async function handleWhatsApp() {
    if (!validateForm()) return;
    const lines = cartItems.map(item => {
      const name = item.meta?.displayName || item.product?.name || 'Product';
      const frame = item.meta?.size ? ` (${item.meta.size} · ${item.meta.colour})` : '';
      return `• ${name}${frame} × ${item.qty} — ₹${(item.price * item.qty).toLocaleString('en-IN')}`;
    });
    const discountLine = discountAmt > 0 ? `\nDiscount (${appliedCoupon?.code}): −₹${discountAmt.toLocaleString('en-IN')}` : '';
    const stateStr = form.state.trim() ? `, ${form.state.trim()}` : '';
    const msg = [
      'Hello JHAYRA! I\'d like to place an order:',
      '',
      lines.join('\n'),
      '',
      `Subtotal: ₹${subtotal.toLocaleString('en-IN')}${discountLine}`,
      'Delivery: FREE',
      `Total: ₹${discountedTotal.toLocaleString('en-IN')}`,
      '',
      'Delivery Details:',
      `Name: ${form.name.trim()}`,
      `Mobile: ${form.mobile.trim()}`,
      `Address: ${form.address.trim()}, ${form.city.trim()}${stateStr} − ${form.pin.trim()}`,
    ].join('\n');
    window.open(`https://wa.me/917070728989?text=${encodeURIComponent(msg)}`, '_blank');
    toast('WhatsApp opened — your cart is preserved');
  }

  async function handlePay() {
    if (payingRef.current) return;
    if (!validateForm()) return;

    if (!supabase) {
      toast('Payment not available — Supabase not configured');
      return;
    }

    payingRef.current = true;
    setPayState('creating');

    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast('Could not load payment gateway. Check your internet connection.');
        setPayState('idle');
        payingRef.current = false;
        return;
      }

      const items = cartItems.map((item) => ({
        legacyId: item.meta?.productId || item.id.split('__')[0] || item.id,
        name: item.meta?.displayName || item.product?.name || 'Product',
        qty: item.qty,
        price: item.price,
        size: item.meta?.size || null,
        colour: item.meta?.colour || null,
        orientation: item.meta?.orientation || null,
        category: item.product?.category || null,
        artworkPaths: Array.isArray(item.meta?.artworkPaths) ? item.meta.artworkPaths : null,
        customization: item.meta?.customization || null,
      }));

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

      const { razorpay_order_id, amount, currency, key_id, order_id, order_number } = data;

      // Snapshot cart BEFORE clearCart is called in the payment handler
      const cartSnapshot = {
        items: cartItems.map((i) => ({ ...i })),
        subtotal,
        discountAmt,
        discountedTotal,
        couponCode: appliedCoupon?.code || null,
      };

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
            setPayState('dismissed');
            payingRef.current = false;
          },
        },
        handler: async (response) => {
          setPayState('processing');
          try {
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
            setPayData({
              orderId: order_id,
              orderNumber: order_number || `ORD-${order_id.slice(0, 8).toUpperCase()}`,
              amount: amount / 100,
              paymentId: response.razorpay_payment_id,
              customerName: form.name.trim(),
              ...cartSnapshot,
            });
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

  // ── Success screen ──────────────────────────────────────────────────────
  if (payState === 'success') {
    const d = payData || {};
    const receiptDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const amtDisplay = d.amount ? d.amount.toLocaleString('en-IN') : (d.discountedTotal || 0).toLocaleString('en-IN');

    return (
      <>
        <SEO title="Order Confirmed | JHAYRA" description="" path="/checkout" noindex={true} />

        {/* Print-only receipt — shown only via window.print() */}
        <div className="receipt-print">
          <div className="rp-header">
            <div className="rp-logo">JHAYRA</div>
            <div className="rp-tagline">Wall Art &amp; Personalised Frames</div>
          </div>
          <hr className="rp-divider" />
          <div className="rp-meta">
            <div><span>Order</span><strong>{d.orderNumber}</strong></div>
            <div><span>Date</span><strong>{receiptDate}</strong></div>
            <div><span>Payment ID</span><strong>{d.paymentId}</strong></div>
            <div><span>Status</span><strong>PAID</strong></div>
          </div>
          <hr className="rp-divider" />
          <div className="rp-items">
            {(d.items || []).map((item, i) => (
              <div key={i} className="rp-item">
                <span>
                  {item.meta?.displayName || item.product?.name}
                  {item.meta?.size ? ` (${item.meta.size} · ${item.meta.colour})` : ''}
                  {' × '}{item.qty}
                </span>
                <span>&#8377;{(item.price * item.qty).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
          <hr className="rp-divider" />
          <div className="rp-totals">
            <div className="rp-item"><span>Subtotal</span><span>&#8377;{(d.subtotal || 0).toLocaleString('en-IN')}</span></div>
            {(d.discountAmt || 0) > 0 && (
              <div className="rp-item"><span>Discount ({d.couponCode})</span><span>&#8722;&#8377;{(d.discountAmt || 0).toLocaleString('en-IN')}</span></div>
            )}
            <div className="rp-item"><span>Delivery</span><span>FREE</span></div>
            <div className="rp-item rp-total"><span>Total Paid</span><span>&#8377;{amtDisplay}</span></div>
          </div>
          <hr className="rp-divider" />
          <div className="rp-footer">jhayra.com &middot; hello@jhayra.com &middot; +91 70707 28989</div>
        </div>

        {/* Screen success UI */}
        <div className="co-success no-print">
          <div className="container">
            <div className="co-success-inner">

              <div className="co-check-wrap">
                <CheckMark />
              </div>

              <p className="eyebrow" style={{ textAlign: 'center', marginBottom: '.4rem' }}>Payment Confirmed</p>
              <h1 className="co-success-h1">Thank you, {d.customerName?.split(' ')[0] || 'Dear Customer'}!</h1>
              <p className="co-success-sub">Your order has been placed. We'll start creating your personalised artwork with love and care.</p>

              {/* Order detail chips */}
              <div className="co-chips">
                <div className="co-chip">
                  <span className="co-chip-label">Order</span>
                  <span className="co-chip-val">{d.orderNumber}</span>
                </div>
                <div className="co-chip">
                  <span className="co-chip-label">Amount Paid</span>
                  <span className="co-chip-val">&#8377;{amtDisplay}</span>
                </div>
                <div className="co-chip">
                  <span className="co-chip-label">Payment ID</span>
                  <span className="co-chip-val co-chip-mono">{(d.paymentId || '').slice(0, 18)}&hellip;</span>
                </div>
              </div>

              {/* Animated digital receipt */}
              <div className={`co-receipt${showReceipt ? ' co-receipt-vis' : ''}`}>
                <div className="co-receipt-header">
                  <div>
                    <div className="co-receipt-logo">JHAYRA</div>
                    <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: '.1rem' }}>Digital Receipt &middot; {receiptDate}</div>
                  </div>
                  <div className="co-paid-badge">PAID</div>
                </div>

                <div className="co-receipt-items">
                  {(d.items || []).map((item, i) => {
                    const name = item.meta?.displayName || item.product?.name;
                    const desc = item.meta?.size ? `${item.meta.size} · ${item.meta.colour}` : '';
                    return (
                      <div key={i} className="co-receipt-item">
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '.84rem' }}>{name}</div>
                          {desc && <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{desc} &middot; Qty: {item.qty}</div>}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '.84rem', flexShrink: 0 }}>&#8377;{(item.price * item.qty).toLocaleString('en-IN')}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="co-receipt-totals">
                  <div className="co-rt-row"><span>Subtotal</span><span>&#8377;{(d.subtotal || 0).toLocaleString('en-IN')}</span></div>
                  {(d.discountAmt || 0) > 0 && (
                    <div className="co-rt-row" style={{ color: 'var(--ok)' }}>
                      <span>Discount ({d.couponCode})</span>
                      <span>&#8722;&#8377;{(d.discountAmt || 0).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="co-rt-row">
                    <span style={{ color: 'var(--muted)' }}>Delivery</span>
                    <span style={{ color: '#22873A', fontWeight: 600 }}>FREE</span>
                  </div>
                  <div className="co-rt-row co-rt-total">
                    <span>Total Paid</span>
                    <span>&#8377;{amtDisplay}</span>
                  </div>
                </div>

                <button className="co-download-btn no-print" onClick={() => window.print()}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download Receipt
                </button>
              </div>

              {/* Order progress tracker */}
              <div className={`co-tracker${showReceipt ? ' co-tracker-vis' : ''}`}>
                <div className="co-tracker-label">Order Progress</div>
                <div className="co-tracker-steps">
                  {PROGRESS_STEPS.map((step, i) => (
                    <div
                      key={step.id}
                      className={`co-step${i === 0 ? ' co-step-done' : i === 1 ? ' co-step-active' : ''}`}
                    >
                      <div className="co-step-dot">{i === 0 ? '✓' : i + 1}</div>
                      <div className="co-step-label">{step.label}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '.78rem', color: 'var(--muted)', textAlign: 'center', marginTop: '1.2rem', lineHeight: 1.65 }}>
                  We'll contact you on WhatsApp to share personalization &amp; delivery updates.
                </p>
              </div>

              <div className="co-success-ctas no-print">
                <Link to="/shop" className="btn btn-gold">Continue Shopping</Link>
                <a href="https://wa.me/917070728989" target="_blank" rel="noopener noreferrer" className="btn btn-outline">WhatsApp Us</a>
              </div>

            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Failure screen ──────────────────────────────────────────────────────
  if (payState === 'failure') {
    return (
      <div data-page="checkout" className="no-print">
        <SEO title="Payment Failed | JHAYRA" description="" path="/checkout" noindex={true} />
        <div className="container" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem' }}>
          <div className="co-state-card">
            <div className="co-state-icon co-state-fail">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h2 className="co-state-title">Payment Unsuccessful</h2>
            {failReason && <p className="co-state-msg">{failReason}</p>}
            <div className="co-state-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" style={{ flexShrink: 0 }}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              Your cart is safe &mdash; items are still waiting for you.
            </div>
            <div className="co-state-actions">
              <button className="btn btn-gold" onClick={() => { setPayState('idle'); payingRef.current = false; }}>Try Again</button>
              <Link to="/cart" className="btn btn-outline">Back to Cart</Link>
              <a href="https://wa.me/917070728989" target="_blank" rel="noopener noreferrer" className="btn btn-outline">Contact Support</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Checkout form ───────────────────────────────────────────────────────
  const isCreating = payState === 'creating' || payState === 'processing';
  const btnLabel = payState === 'creating'
    ? 'Creating order…'
    : payState === 'processing'
    ? 'Verifying payment…'
    : 'Proceed to Secure Payment';

  return (
    <div data-page="checkout" className="no-print">
      <SEO title="Checkout | JHAYRA" description="" path="/checkout" noindex={true} />

      <div className="page-hero">
        <div className="container">
          <p className="eyebrow">Secure Checkout</p>
          <h1>Complete Your Order</h1>
          <p>Crafted with love &mdash; delivered to your door</p>
        </div>
      </div>

      <div className="container">
        <div className="co-layout">

          {/* ── Left: form ── */}
          <div className="co-form-col">

            {payState === 'dismissed' && (
              <div className="co-dismissed">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                No worries &mdash; your items are still in your cart. Ready when you are!
              </div>
            )}

            <div className="box">
              <div className="co-section-title">
                <div className="co-section-num">1</div>
                <h3>Delivery Details</h3>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-input" placeholder="John Doe" value={form.name} onChange={set('name')} disabled={isCreating} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile *</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="10-digit mobile number"
                    value={form.mobile}
                    onChange={e => setForm(f => ({ ...f, mobile: e.target.value.replace(/[^\d]/g, '').slice(0, 10) }))}
                    disabled={isCreating}
                    inputMode="numeric"
                    maxLength={10}
                  />
                  {form.mobile.length > 0 && form.mobile.length < 10 && (
                    <div className="co-field-hint co-field-hint-err">{form.mobile.length}/10 digits</div>
                  )}
                  {form.mobile.length === 10 && (
                    <div className="co-field-hint co-field-hint-ok">✓ Valid</div>
                  )}
                </div>
                <div className="form-group full">
                  <label className="form-label">Email (optional)</label>
                  <input type="email" className="form-input" placeholder="you@email.com" value={form.email} onChange={set('email')} disabled={isCreating} />
                </div>
                <div className="form-group full">
                  <label className="form-label">Delivery Address *</label>
                  <textarea className="form-textarea" placeholder="Flat / House no., Street, Area" rows={2} value={form.address} onChange={set('address')} disabled={isCreating} />
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
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="6-digit pincode"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      inputMode="numeric"
                      value={form.pin}
                      onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      disabled={isCreating}
                    />
                    {pinStatus === 'loading' && (
                      <span style={{ position: 'absolute', right: '.75rem', top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, border: '2px solid var(--cream)', borderTopColor: 'var(--gold)', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
                    )}
                  </div>
                  {pinStatus === 'ok' && <div className="co-field-hint co-field-hint-ok">✓ City &amp; State auto-filled — edit if needed</div>}
                  {pinStatus === 'error' && <div className="co-field-hint co-field-hint-err">Pincode not found — please enter city &amp; state manually</div>}
                </div>
              </div>
            </div>

            <div className="box">
              <div className="co-section-title">
                <div className="co-section-num">2</div>
                <h3>Choose Payment Method</h3>
              </div>

              {/* Pay Online */}
              <div className="co-pay-option">
                <div className="co-pay-option-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <strong>Pay Online</strong>
                  <span className="co-pay-option-sub">Instant confirmation</span>
                </div>
                <div className="co-pay-methods">
                  {['UPI', 'Cards', 'Net Banking', 'Wallets'].map((m) => (
                    <span key={m} className="co-pay-chip">{m}</span>
                  ))}
                </div>
                <button
                  id="payBtn"
                  className="btn btn-gold btn-lg co-pay-btn"
                  onClick={handlePay}
                  disabled={isCreating}
                  style={{ opacity: isCreating ? 0.7 : 1, cursor: isCreating ? 'not-allowed' : 'pointer' }}
                >
                  {isCreating ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
                      <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
                      {btnLabel}
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Proceed to Secure Payment
                    </span>
                  )}
                </button>
                <div className="co-secure-note">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Secured by Razorpay &middot; 256-bit SSL encryption
                </div>
              </div>

              {/* Divider */}
              <div className="co-pay-divider"><span>or</span></div>

              {/* Order via WhatsApp */}
              <div className="co-pay-option co-pay-option-wa">
                <div className="co-pay-option-header">
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="#25D366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <strong>Order via WhatsApp</strong>
                  <span className="co-pay-option-sub">Pay on delivery or via UPI on chat</span>
                </div>
                <p className="co-wa-desc">Send your order details directly to our team on WhatsApp. We'll confirm availability and share payment options.</p>
                <button
                  className="btn co-wa-btn"
                  onClick={handleWhatsApp}
                  disabled={isCreating}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Send Order on WhatsApp
                </button>
              </div>
            </div>
          </div>

          {/* ── Right: order summary ── */}
          <div className="co-summary-col">
            <div className="summary co-summary-sticky">
              <h3>Order Summary</h3>
              <div style={{ marginBottom: '1rem' }}>
                {cartItems.map(({ id, product, qty, price, meta }) => {
                  const art = PRODUCT_ART[product.id];
                  const name = meta?.displayName || product.name;
                  const frameLabel = meta?.size ? `${meta.size} · ${meta.colour}` : '';
                  return (
                    <div key={id} style={{ display: 'flex', gap: '.6rem', alignItems: 'center', marginBottom: '.75rem' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '.4rem', overflow: 'hidden', flexShrink: 0, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px' }}>
                        {art && (
                          <FramedArt
                            fitContainer
                            size={meta?.size || 'A4'}
                            orientation={meta?.orientation || 'Vertical'}
                            colour={meta?.colour || 'Black'}
                            fit="cover"
                            svg={art.art}
                            background={`${art.fc}cc`}
                            gloss={false}
                            alt={name}
                          />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{frameLabel && `${frameLabel} · `}Qty: {qty}</div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '.88rem', flexShrink: 0 }}>&#8377;{(price * qty).toLocaleString('en-IN')}</div>
                    </div>
                  );
                })}
              </div>
              <div className="sum-row"><span style={{ color: 'var(--muted)' }}>Subtotal</span><span>{money(subtotal)}</span></div>
              {discountAmt > 0 && (
                <div className="sum-row">
                  <span style={{ color: 'var(--ok)' }}>Discount ({appliedCoupon?.code})</span>
                  <span style={{ color: 'var(--ok)' }}>&minus;{money(discountAmt)}</span>
                </div>
              )}
              <div className="sum-row"><span style={{ color: 'var(--muted)' }}>Delivery</span><span style={{ color: '#22873A', fontWeight: 600 }}>FREE</span></div>
              <div className="sum-total"><span>Total</span><b>{money(discountedTotal)}</b></div>
              <div className="co-trust">
                {['Secure Payment', 'Handcrafted', 'Free Delivery'].map((t) => (
                  <div key={t} className="co-trust-item">{t}</div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
