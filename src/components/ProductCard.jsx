import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { PRODUCT_ART } from '../data/artwork';
import FramedArt from './FramedArt';

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

// Friendly product-type label per category so the card communicates WHAT it is
const CAT_LABEL = {
  'personalized': 'Personalised Frame', 'religious': 'Spiritual Art', 'running-horses': 'Vastu Art',
  'nature': 'Nature Print', 'modern-art': 'Modern Art', 'canvas': 'Canvas Print',
  'art-abstract': 'Abstract Art', 'love-romance': 'Couple Frame', 'wedding': 'Wedding Frame',
  'family': 'Family Frame', 'baby-kids': 'Kids Frame', 'animals-pets': 'Pet & Wildlife',
  'occasions': 'Occasion Frame', 'photography': 'Photo Print', 'quotes': 'Quote Art',
  'home-vastu': 'Vastu Art',
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
        {/* Clean artwork (Supabase photo › studio SVG › category fallback) is
            always framed dynamically by JHAYRA — the frame is never baked in,
            so a frame-inside-frame is impossible. Cards show a representative
            A4 · Portrait · Black frame; size/colour are chosen on the detail page. */}
        <div style={{
          width:'100%', height:'100%',
          /* Soft warm 'wall' backdrop so the framed art reads as a physical
             product hanging on a wall, not a flat graphic. */
          background:'radial-gradient(120% 100% at 50% 0%, #FBF7EF 0%, #F1E9DA 70%, #EAE0CE 100%)',
          display:'flex', alignItems:'center', justifyContent:'center',
          padding:'1rem .9rem',
        }}>
          <FramedArt
            fitContainer
            size="A4"
            orientation="Vertical"
            colour="Black"
            fit="cover"
            src={realImg || (!art ? catImg : undefined)}
            svg={!realImg && art ? art.art : undefined}
            background={!realImg && art ? `${art.fc}cc` : '#F3ECDD'}
            alt={product.name}
          />
        </div>
        <div className="product-card-badges">
          {product.bestSeller && <span className="badge" style={{background:'var(--gold)',color:'#fff'}}>Best Seller</span>}
          {product.newArrival && <span className="badge" style={{background:'#22C55E',color:'#fff'}}>New</span>}
        </div>
        <div className="product-card-action-row">
          <button className="product-action-btn" aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'} onClick={toggleWishlist}>
            <svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-.9 1-.9-1a5.5 5.5 0 0 0-7.8 7.8l8.7 8.7 8.7-8.7a5.5 5.5 0 0 0 0-7.8z" fill={isWished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"/></svg>
          </button>
        </div>
      </div>
      <div className="product-card-body">
        {CAT_LABEL[product.category] && (
          <div style={{fontSize:'.62rem',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'.15rem'}}>
            {CAT_LABEL[product.category]}
          </div>
        )}
        <div className="product-card-name">{product.name}</div>
        <div className="product-card-rating">
          <span className="stars">{'★'.repeat(Math.round(product.rating))}</span>
          <span>({product.reviewCount})</span>
        </div>
        <div className="product-card-price">
          <span className="price-now">from ₹{product.price.toLocaleString('en-IN')}</span>
        </div>
        <button className="product-card-add" onClick={e => { e.preventDefault(); addToCart(product.id, { name: product.name, price: product.price }); toast('Added to cart ✓'); }}>
          Add to Cart
        </button>
      </div>
    </Link>
  );
}
