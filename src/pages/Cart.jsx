import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { PRODUCT_ART } from '../data/artwork';
import SEO from '../components/SEO';

export default function Cart() {
  const { cartItems, subtotal, shipping, total, discountAmt, discountedTotal, appliedCoupon, money, changeQty, removeFromCart, applyCoupon, clearCoupon } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [couponErr, setCouponErr] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || couponLoading) return;
    setCouponLoading(true);
    setCouponErr('');
    try {
      const result = await applyCoupon(couponCode);
      setCouponErr(result.ok ? '' : 'Invalid coupon code.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleClearCoupon = () => {
    clearCoupon();
    setCouponCode('');
    setCouponErr('');
  };

  return (
    <div data-page="cart">
      <SEO title="Cart | JHAYRA" description="" path="/cart" noindex={true} />
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow">Shopping Cart</p>
          <h1>Your Cart</h1>
          <p>Review your items before checkout</p>
        </div>
      </div>
      <div className="container">
        <div className="cart-wrap">
          <div id="cartItems">
            {cartItems.length === 0 ? (
              <div style={{background:'#fff',borderRadius:'1.25rem',padding:'3rem',textAlign:'center',boxShadow:'var(--sh)'}}>
                <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🖼️</div>
                <h3 style={{fontFamily:'var(--fd)',marginBottom:'.5rem'}}>Your cart is empty</h3>
                <p style={{color:'var(--muted)',marginBottom:'1.5rem'}}>Discover our beautiful collection of wall art and frames</p>
                <Link to="/shop" className="btn btn-gold">Start Shopping</Link>
              </div>
            ) : (
              cartItems.map(({product, id, qty, price, meta}) => {
              const art = PRODUCT_ART[product.id];
              const frameLabel = meta?.size ? `${meta.size} · ${meta.colour} · PS Moulding` : product.category;
              return (
                <div key={id} className="cart-item">
                  <div className="cart-item-img" style={{overflow:'hidden'}}>
                    {art ? (
                      <div style={{width:'100%',height:'100%',background:`linear-gradient(145deg,${art.fc}f0,${art.fc}cc)`,display:'flex',alignItems:'center',justifyContent:'center',padding:'.25rem'}}>
                        <div style={{height:'88%',aspectRatio:'200/260',overflow:'hidden',borderRadius:'2px',flexShrink:0}} dangerouslySetInnerHTML={{__html:art.art}} />
                      </div>
                    ) : (
                      <div style={{width:'100%',height:'100%',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.65rem',color:'var(--muted)',textAlign:'center',padding:'.3rem'}}>{meta?.displayName || product.name}</div>
                    )}
                  </div>
                  <div>
                    <div className="cart-item-name">{meta?.displayName || product.name}</div>
                    <div className="cart-item-meta">{frameLabel}</div>
                    <div className="qty">
                      <button onClick={()=>changeQty(id,-1)} aria-label="Decrease quantity">−</button>
                      <span aria-label={`Quantity: ${qty}`}>{qty}</span>
                      <button onClick={()=>changeQty(id,1)} aria-label="Increase quantity">+</button>
                    </div>
                    <button className="cart-rm" onClick={()=>removeFromCart(id)} style={{cursor:'pointer',background:'none',border:'none',padding:0,font:'inherit'}}>Remove</button>
                  </div>
                  <div style={{fontWeight:700,fontFamily:'var(--fd)'}}>₹{(price*qty).toLocaleString('en-IN')}</div>
                </div>
              );})
            )}
          </div>
          <div className="summary">
            <h3>Order Summary</h3>
            {!appliedCoupon ? (
              <div className="coupon">
                <input className="form-input" placeholder="Enter coupon code" value={couponCode} onChange={e=>setCouponCode(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleApplyCoupon()} style={{flex:1,padding:'.6rem 1rem',border:'1.5px solid var(--cream)',borderRadius:'var(--pill)',fontSize:'.85rem'}} disabled={couponLoading} />
                <button className="btn btn-outline" style={{padding:'.6rem 1.1rem',minWidth:'4.5rem'}} onClick={handleApplyCoupon} disabled={couponLoading}>{couponLoading ? '…' : 'Apply'}</button>
              </div>
            ) : (
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'.75rem',padding:'.55rem .85rem',background:'rgba(34,135,58,.06)',border:'1px solid rgba(34,135,58,.2)',borderRadius:'var(--pill)'}}>
                <span style={{fontSize:'.83rem',color:'var(--ok)',fontWeight:600}}>✓ {appliedCoupon.code} — {appliedCoupon.discount}% off</span>
                <button onClick={handleClearCoupon} style={{background:'none',border:'none',cursor:'pointer',fontSize:'.78rem',color:'var(--muted)'}}>Remove</button>
              </div>
            )}
            {couponErr && <div style={{fontSize:'.8rem',color:'var(--err)',marginBottom:'.75rem',paddingLeft:'.25rem'}}>{couponErr}</div>}
            <div className="sum-row"><span style={{color:'var(--muted)'}}>Subtotal</span><span>{money(subtotal)}</span></div>
            {discountAmt > 0 && <div className="sum-row"><span style={{color:'var(--ok)'}}>Discount ({appliedCoupon.discount}%)</span><span style={{color:'var(--ok)'}}>−{money(discountAmt)}</span></div>}
            <div className="sum-row"><span style={{color:'var(--muted)'}}>Delivery</span><span style={{color:'#22873A',fontWeight:600}}>FREE</span></div>
            <div className="sum-total"><span>Total</span><b>{money(discountedTotal)}</b></div>
            <Link to="/checkout" className="btn btn-gold btn-lg" style={{width:'100%',marginTop:'1.2rem',display:'block',textAlign:'center'}}>Proceed to Checkout</Link>
            <button className="btn btn-outline" style={{width:'100%',marginTop:'.7rem'}} onClick={() => {
              const WA_NUMBER = '917070728989';
              if (!cartItems.length) return;
              const lines = cartItems.map(({product,qty,price,meta}) => {
                const name = meta?.displayName || product.name;
                const frame = meta?.size ? ` (${meta.size}, ${meta.colour})` : '';
                return `• ${name}${frame} × ${qty} — ₹${(price*qty).toLocaleString('en-IN')}`;
              });
              const discountLine = discountAmt > 0 ? `\nDiscount: −₹${discountAmt.toLocaleString('en-IN')}` : '';
              const msg = `Hello JHAYRA! I'd like to order:\n\n${lines.join('\n')}\n\nSubtotal: ₹${subtotal.toLocaleString('en-IN')}${discountLine}\nDelivery: FREE\nTotal: ₹${discountedTotal.toLocaleString('en-IN')}\n\nPlease confirm availability.`;
              window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
            }}>🟢 Order on WhatsApp</button>
          </div>
        </div>
      </div>

      {/* Mobile sticky checkout CTA */}
      {cartItems.length > 0 && (
        <div className="cart-mobile-cta">
          <div className="cart-mobile-cta-info">
            <div className="cart-mobile-cta-label">Total</div>
            <div className="cart-mobile-cta-total">{money(discountedTotal)}</div>
          </div>
          <Link to="/checkout" className="cart-mobile-cta-btn">
            Checkout →
          </Link>
        </div>
      )}
    </div>
  );
}
