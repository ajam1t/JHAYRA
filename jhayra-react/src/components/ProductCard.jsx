import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { PRODUCT_ART } from '../data/artwork';

export default function ProductCard({ product, className = '' }) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, wishlist } = useWishlist();
  const { toast } = useToast();
  const discount = Math.round((1 - product.price / product.originalPrice) * 100);
  const art = PRODUCT_ART[product.id];
  const isWished = wishlist.includes(product.id);

  const toggleWishlist = e => {
    e.preventDefault();
    if (isWished) { removeFromWishlist(product.id); toast('Removed from wishlist'); }
    else { addToWishlist(product.id); toast('Saved to wishlist ♥'); }
  };

  return (
    <Link to={`/product/${product.id}`} className={`product-card reveal ${className}`}>
      <div className="product-card-img-wrap">
        {art ? (
          <div style={{
            width:'100%', height:'100%',
            background:`linear-gradient(145deg,${art.fc}f5 0%,${art.fc}c8 100%)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            padding:'.55rem',
          }}>
            <div style={{
              height:'88%',
              aspectRatio:'200/260',
              width:'auto',
              borderRadius:'3px',
              overflow:'hidden',
              boxShadow:'0 8px 24px rgba(0,0,0,.34),0 2px 8px rgba(0,0,0,.18)',
              position:'relative',
              flexShrink:0,
            }}>
              <div className="pc-art-frame" dangerouslySetInnerHTML={{__html: art.art}} />
              <div style={{position:'absolute',inset:0,background:'linear-gradient(148deg,rgba(255,255,255,.15) 0%,rgba(255,255,255,.04) 38%,transparent 60%)',pointerEvents:'none'}} />
            </div>
          </div>
        ) : (
          <div style={{width:'100%',height:'100%',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)',fontSize:'.8rem',padding:'1rem',textAlign:'center'}}>
            {product.name}
          </div>
        )}
        <div className="product-card-badges">
          {discount > 0 && <span className="badge badge-sale">-{discount}%</span>}
          {product.newArrival && <span className="badge" style={{background:'var(--gold)',color:'#fff',marginLeft:'.3rem'}}>New</span>}
        </div>
        <div className="product-card-action-row">
          <button className="product-action-btn" aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'} onClick={toggleWishlist}>
            <svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-.9 1-.9-1a5.5 5.5 0 0 0-7.8 7.8l8.7 8.7 8.7-8.7a5.5 5.5 0 0 0 0-7.8z" fill={isWished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"/></svg>
          </button>
        </div>
      </div>
      <div className="product-card-body">
        <div className="product-card-name">{product.name}</div>
        <div className="product-card-rating">
          <span className="stars">{'★'.repeat(Math.round(product.rating))}</span>
          <span>({product.reviewCount})</span>
        </div>
        <div className="product-card-price">
          <span className="price-now">₹{product.price.toLocaleString('en-IN')}</span>
          <span className="price-was">₹{product.originalPrice.toLocaleString('en-IN')}</span>
        </div>
        <button className="product-card-add" onClick={e => { e.preventDefault(); addToCart(product.id); toast('Added to cart ✓'); }}>
          Add to Cart
        </button>
      </div>
    </Link>
  );
}
