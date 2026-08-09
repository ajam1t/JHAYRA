import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { PRODUCT_ART } from '../data/artwork';

export default function Checkout() {
  const { cartItems, subtotal, shipping, total, discountAmt, discountedTotal, appliedCoupon, money, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', mobile:'', email:'', address:'', city:'', state:'', pin:'' });
  const WA_NUMBER = '917070728989';

  useEffect(() => {
    if (cartItems.length === 0) navigate('/cart', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOrder = () => {
    if (!cartItems.length) { toast('Your cart is empty'); return; }
    if (!form.name || !form.mobile) { toast('Please fill required fields'); return; }
    if (form.mobile.replace(/\D/g,'').length < 10) { toast('Enter a valid 10-digit mobile number'); return; }
    if (!form.address || !form.city || !form.pin) { toast('Please fill delivery address details'); return; }
    if (!/^\d{6}$/.test(form.pin)) { toast('Enter a valid 6-digit pincode'); return; }
    const lines = cartItems.map(({product,qty,price,meta})=>{
      const name = meta?.displayName || product.name;
      const frame = meta?.size ? ` (${meta.size}, ${meta.colour})` : '';
      return `• ${name}${frame} × ${qty} — ₹${(price*qty).toLocaleString('en-IN')}`;
    });
    const discountLine = discountAmt > 0 ? `\nDiscount (${appliedCoupon?.code}): −${money(discountAmt)}` : '';
    const stateStr = form.state ? `, ${form.state}` : '';
    const msg = `Hello JHAYRA! I'd like to place an order:\n\n${lines.join('\n')}\n\nSubtotal: ${money(subtotal)}${discountLine}\nDelivery: FREE\nTotal: ${money(discountedTotal)}\n\nDelivery Details:\nName: ${form.name}\nMobile: ${form.mobile}\nEmail: ${form.email}\nAddress: ${form.address}, ${form.city}${stateStr} - ${form.pin}\n\nPlease confirm my order.`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    clearCart();
    navigate('/');
    toast('Order sent via WhatsApp — please tap Send to confirm!');
  };

  const set = field => e => setForm(f => ({...f, [field]: e.target.value}));

  return (
    <div data-page="checkout">
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow">Order Summary</p>
          <h1>Checkout</h1>
          <p>Almost there — just a few details</p>
        </div>
      </div>
      <div className="container">
        <div className="checkout-wrap">
          <div className="box">
            <h3 style={{fontFamily:'var(--fd)',fontSize:'1.2rem',marginBottom:'1.2rem'}}>Delivery Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-input" placeholder="John Doe" value={form.name} onChange={set('name')} />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile *</label>
                <input type="tel" className="form-input" placeholder="10-digit number" value={form.mobile} onChange={set('mobile')} />
              </div>
              <div className="form-group full">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" placeholder="you@email.com" value={form.email} onChange={set('email')} />
              </div>
              <div className="form-group full">
                <label className="form-label">Address *</label>
                <textarea className="form-textarea" placeholder="Street, Area" rows={2} value={form.address} onChange={set('address')} />
              </div>
              <div className="form-group">
                <label className="form-label">City *</label>
                <input type="text" className="form-input" placeholder="City" value={form.city} onChange={set('city')} />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input type="text" className="form-input" placeholder="State" value={form.state} onChange={set('state')} />
              </div>
              <div className="form-group">
                <label className="form-label">Pincode *</label>
                <input type="text" className="form-input" placeholder="6-digit pincode" maxLength={6} pattern="[0-9]{6}" inputMode="numeric" value={form.pin} onChange={set('pin')} />
              </div>
            </div>
            <h3 style={{fontFamily:'var(--fd)',fontSize:'1.2rem',margin:'1.6rem 0 .4rem'}}>Confirm Your Order</h3>
            <p style={{fontSize:'.85rem',color:'var(--muted)',marginBottom:'1rem'}}>Your order will be confirmed via WhatsApp.</p>
            <button id="payBtn" className="btn btn-gold btn-lg" style={{width:'100%'}} onClick={handleOrder}>
              🟢 Confirm Order on WhatsApp
            </button>
            <div style={{display:'flex',gap:'.5rem',alignItems:'center',fontSize:'.82rem',color:'var(--muted)',marginTop:'1rem',padding:'.8rem',background:'var(--bg)',borderRadius:'var(--r)'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>Your information is safe. We use WhatsApp for secure order confirmation.</span>
            </div>
          </div>
          <div className="summary">
            <h3>Order Summary</h3>
            <div style={{marginBottom:'1rem'}}>
              {cartItems.length === 0 && <div style={{fontSize:'.85rem',color:'var(--muted)'}}>No items in cart</div>}
              {cartItems.map(({id, product, qty, price, meta})=>{
                const art = PRODUCT_ART[product.id];
                const name = meta?.displayName || product.name;
                const frameLabel = meta?.size ? `${meta.size} · ${meta.colour}` : `Qty: ${qty}`;
                return (
                  <div key={id} style={{display:'flex',gap:'.6rem',alignItems:'center',marginBottom:'.75rem'}}>
                    <div style={{width:'44px',height:'44px',borderRadius:'.4rem',overflow:'hidden',flexShrink:0,background:art?`${art.fc}dd`:'var(--bg)'}}>
                      {art && <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{height:'80%',aspectRatio:'200/260',overflow:'hidden',borderRadius:'1px'}} dangerouslySetInnerHTML={{__html:art.art}} /></div>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'.82rem',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{name}</div>
                      <div style={{fontSize:'.72rem',color:'var(--muted)'}}>{frameLabel} · Qty: {qty}</div>
                    </div>
                    <div style={{fontWeight:700,fontSize:'.88rem',flexShrink:0}}>₹{(price*qty).toLocaleString('en-IN')}</div>
                  </div>
                );
              })}
            </div>
            <div className="sum-row"><span style={{color:'var(--muted)'}}>Subtotal</span><span>{money(subtotal)}</span></div>
            {discountAmt > 0 && <div className="sum-row"><span style={{color:'var(--ok)'}}>Discount ({appliedCoupon?.code})</span><span style={{color:'var(--ok)'}}>−{money(discountAmt)}</span></div>}
            <div className="sum-row"><span style={{color:'var(--muted)'}}>Delivery</span><span style={{color:'#22873A',fontWeight:600}}>FREE</span></div>
            <div className="sum-total"><span>Total</span><b>{money(discountedTotal)}</b></div>
          </div>
        </div>
      </div>
    </div>
  );
}
