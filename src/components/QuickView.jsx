import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Frame from './Frame';
import Icon from './Icon';
import { Stars } from './ProductCard';
import { useFrameConfig } from '../lib/catalog';
import { useCart } from '../state/cart';
import { money } from '../lib/site';

/** Size + frame chooser in a dialog, using the product's real options and prices. */
export default function QuickView({ product, onClose }) {
  const cart = useCart();
  const { data: cfg } = useFrameConfig(product.dbId);
  const [sizeSlug, setSizeSlug] = useState(null);
  const [colourName, setColourName] = useState('Black');

  useEffect(() => {
    if (!cfg) return;
    setSizeSlug((cfg.sizes.find((s) => s.isDefault) || cfg.sizes[0]).slug);
    setColourName(cfg.colours.find((c) => c.name === 'Black')?.name || cfg.colours[0].name);
  }, [cfg]);

  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const size = cfg?.sizes.find((s) => s.slug === sizeSlug);
  const colour = cfg?.colours.find((c) => c.name === colourName);
  const mat = cfg?.materials.find((m) => m.isDefault) || cfg?.materials[0];

  const add = () => {
    if (!size || !colour || !mat) return;
    cart.add({
      productId: product.id,
      name: product.name,
      image: product.thumbnail,
      price: size.price,
      category: product.category,
      colourHex: colour.hex,
      option: { id: `${size.slug}_${colour.slug}_${mat.slug}`, size: size.name, dimensions: size.dimensions, colour: colour.name, material: mat.name },
      orientation: 'Vertical',
      customization: { material: mat.name, artworkVariant: null },
    });
    onClose();
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={`Quick view: ${product.name}`}>
      <div className="scrim" onClick={onClose} />
      <div className="modal-panel qv">
        <button className="icon-btn modal-close" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
        <div className="qv-media">
          <div className="qv-frame" style={{ width: `${30 + ((size?.ratioH || 13) / 36) * 40}%` }}>
            <Frame src={product.thumbnail} alt={product.name} ratio={{ w: size?.ratioW || 9.5, h: size?.ratioH || 13 }} colour={colour?.hex || '#1C1C1C'} sizes="40vw" tilt />
          </div>
        </div>
        <div className="qv-info">
          <h2 className="h2">{product.name}</h2>
          <Stars rating={product.rating} count={product.review_count} />
          <div className="qv-price">{money(size?.price ?? product.price)}</div>
          {product.description && <p className="muted">{product.description}</p>}
          {!cfg && <div className="skel" style={{ height: 120, marginTop: 16 }} />}
          {cfg && (
            <>
              <label className="editor-label">Size {size && <span className="muted">· {size.dimensions}</span>}</label>
              <div className="ls-sizes">
                {cfg.sizes.map((s) => (
                  <button key={s.slug} className={`ls-size ${s.slug === sizeSlug ? 'on' : ''}`} aria-pressed={s.slug === sizeSlug} onClick={() => setSizeSlug(s.slug)}>
                    <b>{s.name}</b>
                    <small>{money(s.price)}</small>
                  </button>
                ))}
              </div>
              <label className="editor-label">Frame</label>
              <div className="swatches">
                {cfg.colours.map((c) => (
                  <button key={c.slug} className={`swatch swatch-frame ${c.name === colourName ? 'on' : ''}`} style={{ '--sw': c.hex }} aria-label={`${c.name} frame`} aria-pressed={c.name === colourName} onClick={() => setColourName(c.name)} />
                ))}
              </div>
            </>
          )}
          <button className="btn btn-gold btn-lg btn-block" style={{ marginTop: 24 }} disabled={!size} onClick={add}>
            Add to bag{size ? ` · ${money(size.price)}` : ''}
          </button>
          <div className="qv-links">
            <Link to={`/product/${product.id}`} onClick={onClose} className="link">
              Full details <Icon name="arrow" size={15} />
            </Link>
            <Link to={`/visualise?p=${product.id}`} onClick={onClose} className="link">
              Visualise in my room <Icon name="arrow" size={15} />
            </Link>
            {product.customer_photo_eligible && (
              <Link to={`/product/${product.id}`} onClick={onClose} className="link">
                Use my own photo <Icon name="arrow" size={15} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
