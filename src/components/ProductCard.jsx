import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { PRODUCT_ART } from '../data/artwork';

// Maps every category slug to an existing /Images/ file so cards never appear blank
const CAT_IMG = {
  'personalized':   '/Images/personalized.jpg',
  'religious':      '/Images/religious.jpg',
  'running-horses': '/Images/horses.jpg',
  'nature':         '/Images/nature.jpg',
  'modern-art':     '/Images/modern.jpg',
  'canvas':         '/Images/canvas.jpg',
  'art-abstract':   '/Images/modern.jpg',
  'love-romance':   '/Images/personalized.jpg',
  'wedding':        '/Images/personalized.jpg',
  'family':         '/Images/personalized.jpg',
  'baby-kids':      '/Images/personalized.jpg',
  'animals-pets':   '/Images/nature.jpg',
  'occasions':      '/Images/personalized.jpg',
  'photography':    '/Images/nature.jpg',
  'quotes':         '/Images/modern.jpg',
  'home-vastu':     '/Images/religious.jpg',
};

export default function ProductCard({ product, className = '' }) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, wishlist } = useWishlist();
  const { toast } = useToast();
  const art = PRODUCT_ART[product.id];
  const realImg = product.thumbnail || product.images?.[0];
  const catImg = CAT_IMG[product.category] || '/Images/personalized.jpg';
  const isWished = wishlist.includes(product.id);

  const toggleWishlist = e => {
    e.preventDefault();
    if (isWished) { removeFromWishlist(product.id); toast('Removed from wishlist'); }
    else { addToWishlist(product.id); toast('Saved to wishlist ♥'); }
  };

  return (
    <Link to={`/product/${product.id}`} className={`product-card reveal ${className}`}>
      <div className="product-card-img-wrap">
        {realImg ? (
          /* Actual uploaded product photo from Supabase Storage */
          <img
            src={realImg}
            alt={product.name}
            loading="lazy"
            style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
          />
        ) : art ? (
          /* SVG artwork (existing design for known products) */
          <div style={{
            width:'100%', height:'100%',
            background:'var(--bg)',
            display:'flex', alignItems:'center', justifyContent:'center',
            padding:'.65rem',
          }}>
            <div style={{
              height:'90%',
              aspectRatio:'200/260',
              width:'auto',
              border:`12px solid ${art.fc}`,
              borderRadius:'2px',
              overflow:'hidden',
              boxShadow:'0 8px 28px rgba(0,0,0,.22),0 2px 8px rgba(0,0,0,.12)',
              position:'relative',
              flexShrink:0,
            }}>
              <div className="pc-art-frame" dangerouslySetInnerHTML={{__html: art.art}} />
              <div style={{position:'absolute',inset:0,background:'linear-gradient(148deg,rgba(255,255,255,.12) 0%,rgba(255,255,255,.03) 38%,transparent 60%)',pointerEvents:'none'}} />
            </div>
          </div>
        ) : (
          /* Category fallback image — always visible, never blank */
          <img
            src={catImg}
            alt={product.name}
            loading="lazy"
            style={{width:'100%',height:'100%',objectFit:'cover',display:'block',opacity:0.88}}
          />
        )}
        <div className="product-card-badges">
          {product.newArrival && <span className="badge" style={{background:'var(--gold)',color:'#fff'}}>New</span>}
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
          <span className="price-now">from ₹{product.price.toLocaleString('en-IN')}</span>
        </div>
        <button className="product-card-add" onClick={e => { e.preventDefault(); addToCart(product.id); toast('Added to cart ✓'); }}>
          Add to Cart
        </button>
      </div>
    </Link>
  );
}
