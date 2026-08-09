import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { PRODUCT_ART } from '../data/artwork';

const VALID_COUPONS = { 'JHAYRA10': 10, 'JHAYRA15': 15 };

export default function Cart() {
  const { cartItems, subtotal, shipping, total, money, changeQty, removeFromCart } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState('');
  const [discount, setDiscount] = useState(0);

  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (VALID_COUPONS[code]) {
      const pct = VALID_COUPONS[code];
      setDiscount(pct);
      setCouponMsg(`✓ ${pct}% discount applied!`);
    } else {
      setDiscount(0);
      setCouponMsg('Invalid coupon code.');
    }
  };

  return (
    <div data-page="cart">
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
                      <button onClick={()=>changeQty(id,-1)}>−</button>
                      <span>{qty}</span>
                      <button onClick={()=>changeQty(id,1)}>+</button>
                    </div>
                    <span className="cart-rm" onClick={()=>removeFromCart(id)} style={{cursor:'pointer'}}>Remove</span>
                  </div>
                  <div style={{fontWeight:700,fontFamily:'var(--fd)'}}>₹{(price*qty).toLocaleString('en-IN')}</div>
                </div>
              );})
            )}
          </div>
          <div className="summary">
            <h3>Order Summary</h3>
            <div className="coupon">
              <input className="form-input" placeholder="Coupon code (try JHAYRA10)" value={couponCode} onChange={e=>setCouponCode(e.target.value)} onKeyDown={e=>e.key==='Enter'&&applyCoupon()} style={{flex:1,padding:'.6rem 1rem',border:'1.5px solid var(--cream)',borderRadius:'var(--pill)',fontSize:'.85rem'}} />
              <button className="btn btn-outline" style={{padding:'.6rem 1.1rem'}} onClick={applyCoupon}>Apply</button>
            </div>
            {couponMsg && <div style={{fontSize:'.8rem',color:discount>0?'var(--ok)':'var(--err)',marginBottom:'.75rem',paddingLeft:'.25rem'}}>{couponMsg}</div>}
            <div className="sum-row"><span style={{color:'var(--muted)'}}>Subtotal</span><span>{money(subtotal)}</span></div>
            {discount > 0 && <div className="sum-row"><span style={{color:'var(--ok)'}}>Discount ({discount}%)</span><span style={{color:'var(--ok)'}}>−{money(Math.round(subtotal*discount/100))}</span></div>}
            <div className="sum-row"><span style={{color:'var(--muted)'}}>Delivery</span><span style={{color:'#22873A',fontWeight:600}}>FREE</span></div>
            <div className="sum-total"><span>Total</span><b>{money(Math.max(0, total - Math.round(subtotal*discount/100)))}</b></div>
            <Link to="/checkout" className="btn btn-gold btn-lg" style={{width:'100%',marginTop:'1.2rem',display:'block',textAlign:'center'}}>Proceed to Checkout</Link>
            <button className="btn btn-outline" style={{width:'100%',marginTop:'.7rem'}} onClick={() => {
              const WA_NUMBER = '917070728989';
              if (!cartItems.length) return;
              const lines = cartItems.map(({product,qty,price,meta}) => {
                const name = meta?.displayName || product.name;
                const frame = meta?.size ? ` (${meta.size}, ${meta.colour})` : '';
                return `• ${name}${frame} × ${qty} — ₹${(price*qty).toLocaleString('en-IN')}`;
              });
              const msg = `Hello JHAYRA! I'd like to order:\n\n${lines.join('\n')}\n\nSubtotal: ₹${subtotal.toLocaleString('en-IN')}\nDelivery: FREE\nTotal: ₹${total.toLocaleString('en-IN')}\n\nPlease confirm availability.`;
              window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
            }}>🟢 Order on WhatsApp</button>
          </div>
        </div>
      </div>
    </div>
  );
}
