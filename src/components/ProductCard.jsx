import { useState } from 'react';
import { Link } from 'react-router-dom';
import Frame from './Frame';
import Img from './Img';
import Icon from './Icon';
import { useShop } from '../state/store';
import QuickView from './QuickView';
import { money } from '../lib/site';
import { SIZES } from '../lib/frames';

export function Stars({ rating, count, small }) {
  if (!rating) return null;
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <span className={`stars ${small ? 'stars-sm' : ''}`} aria-label={`Rated ${rating} out of 5${count ? ` from ${count} reviews` : ''}`}>
      <span className="stars-bar" style={{ '--pct': `${pct}%` }} aria-hidden="true">
        ★★★★★
      </span>
      <b>{Number(rating).toFixed(1)}</b>
      {count ? <span className="muted">({count.toLocaleString('en-IN')})</span> : null}
    </span>
  );
}

export function categoryLabel(slug, categories) {
  const c = categories?.find((x) => x.slug === slug);
  if (c) return c.name;
  return (slug || '').replace(/-/g, ' ');
}

// `options` (optional): { sizes, colours } counts from loadOptionSummary.
export default function ProductCard({ product, categories, priority = false, index = 0, room = false, options, query = '' }) {
  const href = `/product/${product.id}${query}`;
  const { wish, toggleWish } = useShop();
  const [quick, setQuick] = useState(false);
  const on = wish.includes(product.id);
  const alt = product.images[1]?.url;
  const a4 = SIZES[0];

  return (
    <article className={`pcard ${room ? 'pcard-room' : ''}`} style={{ '--i': index }}>
      <div className="pcard-media">
        <Link to={href} className="pcard-stage" aria-label={product.name}>
          <Frame src={product.thumbnail} alt={product.name} sizes="(max-width: 760px) 40vw, (max-width: 1120px) 22vw, 16vw" priority={priority} glare={false} thickness={3.6} />
          {alt && (
            <div className="pcard-alt" aria-hidden="true">
              <Img src={alt} sizes="(max-width: 760px) 50vw, 25vw" />
            </div>
          )}
          <div className="pcard-badges">
            {product.is_bestseller && <span className="pill pill-gold">Bestseller</span>}
            {product.is_new_arrival && <span className="pill pill-dark">New</span>}
            {product.customer_photo_eligible && <span className="pill">Add your photo</span>}
          </div>
        </Link>
        <button type="button" className={`pcard-wish ${on ? 'on' : ''}`} aria-pressed={on} aria-label={on ? 'Remove from wishlist' : 'Save to wishlist'} onClick={() => toggleWish(product.id)}>
          <Icon name="heart" size={19} />
        </button>
        <button type="button" className="pcard-qv" aria-label={`Quick view: ${product.name}`} onClick={() => setQuick(true)}>
          <Icon name="plus" size={18} />
          <span>Quick view</span>
        </button>
      </div>
      <Link to={href} className="pcard-body">
        <span className="pcard-cat">{categoryLabel(product.category, categories)}</span>
        <h3 className="pcard-name">{product.name}</h3>
        <Stars rating={product.rating} count={product.review_count} small />
        <span className="pcard-price">
          from <b>{money(product.price || a4.price)}</b>
          {product.compare_price ? <s className="muted"> {money(product.compare_price)}</s> : null}
        </span>
        {options?.sizes > 0 && (
          <span className="pcard-opts">
            {options.sizes} {options.sizes === 1 ? 'size' : 'sizes'}
            {options.colours > 0 && ` · ${options.colours} ${options.colours === 1 ? 'frame finish' : 'frame finishes'}`}
          </span>
        )}
      </Link>
      {quick && <QuickView product={product} onClose={() => setQuick(false)} />}
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="pcard" aria-hidden="true">
      <div className="pcard-stage skel" />
      <div className="pcard-body">
        <div className="skel" style={{ height: 10, width: '40%' }} />
        <div className="skel" style={{ height: 18, width: '80%' }} />
        <div className="skel" style={{ height: 14, width: '30%' }} />
      </div>
    </div>
  );
}
