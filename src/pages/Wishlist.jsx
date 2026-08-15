import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { JHAYRA_DATA } from '../data/products';
import { PRODUCT_ART } from '../data/artwork';
import { useScrollReveal } from '../components/ScrollReveal';
import SEO from '../components/SEO';

export default function Wishlist() {
  useScrollReveal();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const items = wishlist.map(id => JHAYRA_DATA.get(id)).filter(Boolean);

  return (
    <div data-page="wishlist">
      <SEO title="Wishlist | JHAYRA" description="" path="/wishlist" noindex={true} />
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow">Saved Items</p>
          <h1>My Wishlist</h1>
          <p>Your saved favourites</p>
        </div>
      </div>
      <div className="container">
        {items.length === 0 ? (
          <div style={{textAlign:'center',padding:'4rem 0'}}>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>❤️</div>
            <h3 style={{fontFamily:'var(--fd)',marginBottom:'.5rem'}}>Your wishlist is empty</h3>
            <p style={{color:'var(--muted)',marginBottom:'1.5rem'}}>Save products you love and come back to them later</p>
            <Link to="/shop" className="btn btn-gold">Browse Products</Link>
          </div>
        ) : (
          <div className="shop-grid" style={{margin:'2rem 0'}}>
            {items.map(product => {
              const art = PRODUCT_ART[product.id];
              return (
                <Link key={product.id} to={`/product/${product.id}`} className="product-card s-reveal" style={{textDecoration:'none',color:'inherit'}}>
                  <div className="product-card-img-wrap">
                    {art ? (
                      <div style={{width:'100%',height:'100%',background:`linear-gradient(145deg,${art.fc}f5,${art.fc}c8)`,display:'flex',alignItems:'center',justifyContent:'center',padding:'.55rem'}}>
                        <div style={{height:'88%',aspectRatio:'200/260',width:'auto',borderRadius:'3px',overflow:'hidden',boxShadow:'0 8px 24px rgba(0,0,0,.34)',position:'relative',flexShrink:0}}>
                          <div className="pc-art-frame" dangerouslySetInnerHTML={{__html:art.art}} />
                          <div style={{position:'absolute',inset:0,background:'linear-gradient(148deg,rgba(255,255,255,.15) 0%,transparent 60%)',pointerEvents:'none'}} />
                        </div>
                      </div>
                    ) : (
                      <div style={{width:'100%',height:'100%',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)',fontSize:'.8rem',padding:'1rem',textAlign:'center'}}>{product.name}</div>
                    )}
                    <div className="product-card-badges">
                      {product.newArrival && <span className="badge" style={{background:'var(--gold)',color:'#fff'}}>New</span>}
                    </div>
                    <div className="product-card-action-row">
                      <button className="product-action-btn" aria-label="Remove from wishlist" onClick={e=>{ e.preventDefault(); removeFromWishlist(product.id); toast('Removed from wishlist'); }}>
                        <svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-.9 1-.9-1a5.5 5.5 0 0 0-7.8 7.8l8.7 8.7 8.7-8.7a5.5 5.5 0 0 0 0-7.8z" fill="currentColor"/></svg>
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
                    <button className="product-card-add" onClick={e=>{ e.preventDefault(); addToCart(product.id); toast('Added to cart ✓'); }}>
                      Add to Cart
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
