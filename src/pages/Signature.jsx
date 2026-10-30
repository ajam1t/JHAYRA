import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import Frame from '../components/Frame';
import Img from '../components/Img';
import Icon from '../components/Icon';
import { Motion, ripple } from '../components/Motion';
import { Seo } from '../lib/seo';
import { useFrameConfig, useProducts } from '../lib/catalog';
import { useCart } from '../state/cart';
import { useToast } from '../state/store';
import { money, waLink } from '../lib/site';
import { founderEligible, signatureItems, signaturePrice, useSignature } from '../lib/signature';

// ════════════════════════════════════════════════════════════════════════
// The JHAYRA Signature Experience — an admin-curated atelier collection at
// three times the regular price, premium packaging included, optional
// founder delivery in Mumbai, Thane and Navi Mumbai.
// ════════════════════════════════════════════════════════════════════════

const PRIVILEGES = [
  ['star', 'Founder-curated', 'Only artwork our founder selects for the collection.'],
  ['box', 'Premium packaging', 'Included in every Signature price — never an extra.'],
  ['brush', 'Framed to order', 'Your choice of size and frame finish, handcrafted for you.'],
  ['users', 'Personal concierge', 'A real person guides your order on WhatsApp.'],
  ['truck', 'Founder delivery', 'Optional, personal delivery in Mumbai, Thane & Navi Mumbai.'],
];

// Detailed presentation with size and finish selection at Signature prices.
function Detail({ item, s, onClose }) {
  const p = item.product;
  const { data: cfg } = useFrameConfig(p.dbId);
  const [size, setSize] = useState(null);
  const [colour, setColour] = useState(null);
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    if (!cfg) return;
    setSize((x) => x || (cfg.sizes.find((z) => z.isDefault) || cfg.sizes[0])?.slug);
    setColour((x) => x || (cfg.colours.find((c) => c.isDefault) || cfg.colours[0])?.slug);
  }, [cfg]);
  useEffect(() => {
    const key = (e) => e.key === 'Escape' && onClose();
    addEventListener('keydown', key);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => (removeEventListener('keydown', key), (document.body.style.overflow = prev));
  }, [onClose]);
  const sz = cfg?.sizes.find((z) => z.slug === size);
  const col = cfg?.colours.find((c) => c.slug === colour);
  const mat = cfg?.materials[0];
  const price = sz ? signaturePrice(sz.price, s, item, sz.slug) : null;
  const add = (go) => {
    if (!sz || !col) return;
    cart.add(
      {
        productId: p.id,
        name: `${p.name} — Signature`,
        image: p.thumbnail,
        price,
        regularPrice: sz.price,
        signature: true,
        category: p.category,
        option: { id: `sig-${sz.slug}-${col.slug}`, size: sz.name, dimensions: sz.dimensions, colour: col.name, material: mat?.name },
        colourHex: col.hex,
        orientation: 'Vertical',
        customization: { source: 'signature', productId: p.id, productName: p.name, signature: { price, regularPrice: sz.price, custom: Number(item.prices?.[sz.slug]) > 0, packaging: 'premium included' } },
      },
      { open: false },
    );
    toast(`${p.name} added to your Signature bag`, 'ok');
    onClose();
    if (go) navigate('/checkout');
  };
  return createPortal(
    <div className="sg-detail" role="dialog" aria-modal="true" aria-label={p.name}>
      <div className="scrim" onClick={onClose} />
      <div className="sg-detail-panel m-morph">
        <button className="icon-btn sg-close" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
        <div className="sg-detail-art">
          <Frame src={p.thumbnail} alt={p.name} ratio={sz ? { w: sz.ratioW, h: sz.ratioH } : { w: 12, h: 16 }} colour={col?.hex || '#1C1C1C'} mat glare sizes="(max-width: 760px) 70vw, 420px" />
        </div>
        <div className="sg-detail-info">
          <span className="sg-kick">Signature collection</span>
          <h2>{p.name}</h2>
          {item.note && <p className="sg-note">{item.note}</p>}
          <p className="sg-desc">{p.description}</p>
          {!cfg ? (
            <p className="muted">Loading sizes…</p>
          ) : (
            <>
              <span className="sg-lab">Size</span>
              <div className="sg-opts">
                {cfg.sizes.map((z) => (
                  <button key={z.slug} type="button" className={`sg-opt ${size === z.slug ? 'on' : ''}`} aria-pressed={size === z.slug} onClick={() => setSize(z.slug)}>
                    <b>{z.name}</b>
                    <small>{money(signaturePrice(z.price, s, item, z.slug))}</small>
                  </button>
                ))}
              </div>
              <span className="sg-lab">Frame finish · {col?.name}</span>
              <div className="sg-fin">
                {cfg.colours.map((c) => (
                  <button key={c.slug} type="button" className={`sg-sw ${colour === c.slug ? 'on' : ''}`} aria-pressed={colour === c.slug} aria-label={`${c.name} frame`} style={{ '--sw': c.hex }} onClick={() => setColour(c.slug)} />
                ))}
              </div>
              <div className="sg-price">
                <b>{money(price)}</b>
                <small>
                  {sz?.dimensions} · premium packaging included
                  {` · Signature price`}
                </small>
              </div>
              <div className="sg-actions">
                <button type="button" className="btn sg-btn m-ripple" onClick={(e) => (ripple(e), add(true))} disabled={!sz}>
                  Reserve this piece <Icon name="arrow" size={16} />
                </button>
                <button type="button" className="btn sg-btn-ghost" onClick={() => add(false)} disabled={!sz}>
                  Add to bag
                </button>
              </div>
              <Link to={`/visualise?p=${p.id}`} className="sg-link">
                See it on my wall <Icon name="arrow" size={14} />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function FounderCheck({ s }) {
  const [pin, setPin] = useState('');
  const ok = founderEligible(pin, s);
  return (
    <div className="sg-pin">
      <label htmlFor="sg-pin">Check your pincode</label>
      <div className="sg-pin-row">
        <input id="sg-pin" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 400601" />
        {pin.length === 6 && <span className={ok ? 'sg-ok' : 'sg-no'}>{ok ? '✓ Founder delivery available' : 'Not available at this pincode'}</span>}
      </div>
    </div>
  );
}

export default function SignaturePage() {
  const s = useSignature();
  const { data: products } = useProducts();
  const items = useMemo(() => signatureItems(s, products), [s, products]);
  const hero = items.find((i) => i.product.id === s.hero.productId) || items.find((i) => i.featured) || items[0];
  const [open, setOpen] = useState(null);
  const from = (it) => signaturePrice(it.product.price, s, it, 'a4');

  if (s.enabled === false && !s.preview)
    return (
      <section className="sg sg-closed">
        <Seo title="The JHAYRA Signature Experience" description="An exclusive, founder-curated collection from JHAYRA." path="/signature-experience" noindex />
        <div className="wrap center">
          <span className="sg-kick">The Jhayra Signature Experience</span>
          <h1 className="sg-h1">Returning soon.</h1>
          <p className="sg-lead">Our atelier collection is being prepared. In the meantime, explore our full collection.</p>
          <Link to="/shop" className="btn sg-btn">
            Shop wall art <Icon name="arrow" size={16} />
          </Link>
        </div>
      </section>
    );

  return (
    <>
      <Seo title="The JHAYRA Signature Experience — Founder-Curated Art" description="An exclusive, founder-curated collection: framed to order, premium packaging included, personal concierge and optional founder delivery in Mumbai, Thane and Navi Mumbai." path="/signature-experience" />
      {s.preview && <div className="sg-preview-bar">Preview — not published yet</div>}

      <section className="sg sg-hero">
        <span className="sg-hero-line" aria-hidden="true" />
        <div className="wrap sg-hero-grid">
          <Motion type="blur" className="sg-hero-copy">
            <span className="sg-kick">{s.hero.kicker}</span>
            <h1 className="sg-h1">
              {(s.hero.title || '').replace(/ Experience$/, '')}
              {/ Experience$/.test(s.hero.title) && (
                <>
                  <br />
                  <em>Experience</em>
                </>
              )}
            </h1>
            <p className="sg-sub">{s.hero.subtitle}</p>
            <span className="sg-rule" aria-hidden="true" />
            <p className="sg-lead">{s.hero.lead}</p>
            <a href="#sg-collection" className="btn sg-btn m-ripple" onClick={ripple}>
              Explore the collection <Icon name="arrow" size={16} />
            </a>
          </Motion>
          {hero && (
            <Motion type="scale" delay={0.15} className="sg-hero-art">
              <button type="button" className="sg-hero-frame" onClick={() => setOpen(hero)} aria-label={`View ${hero.product.name}`}>
                <Frame src={hero.product.thumbnail} alt={hero.product.name} ratio={{ w: 12, h: 16 }} colour="#1C1C1C" mat glare sizes="(max-width: 760px) 70vw, 380px" priority />
              </button>
              <span className="sg-hero-cap">
                {hero.product.name} · from {money(from(hero))}
              </span>
            </Motion>
          )}
        </div>
      </section>

      <section className="sg sg-privileges">
        <div className="wrap">
          <Motion type="up" stagger className="sg-priv">
            {PRIVILEGES.filter(([, t]) => t !== 'Founder delivery' || s.founder.enabled).map(([ic, t, d], i) => (
              <div key={t} style={{ '--i': i }}>
                <span className="sg-priv-ic">
                  <Icon name={ic} size={18} />
                </span>
                <b>{t}</b>
                <small>{d}</small>
              </div>
            ))}
          </Motion>
        </div>
      </section>

      <section className="sg sg-collection" id="sg-collection">
        <div className="wrap">
          <div className="sg-head">
            <span className="sg-kick">The collection</span>
            <h2 className="sg-h2">
              Chosen, <em>not catalogued.</em>
            </h2>
          </div>
          {items.length ? (
            <Motion type="up" stagger className="sg-grid">
              {items.map((it, i) => (
                <article key={it.productId} className={`sg-card ${it.featured ? 'feat' : ''}`} style={{ '--i': i }}>
                  <button type="button" className="sg-card-art" onClick={() => setOpen(it)} aria-label={`View ${it.product.name}`}>
                    <Frame src={it.product.thumbnail} alt={it.product.name} ratio={{ w: 12, h: 16 }} colour="#1C1C1C" mat glare={false} sizes="(max-width: 760px) 44vw, 260px" />
                    {it.featured && <span className="sg-tag">Featured</span>}
                  </button>
                  <div className="sg-card-body">
                    <h3>{it.product.name}</h3>
                    {it.note && <p>{it.note}</p>}
                    <span className="sg-card-price">from {money(from(it))}</span>
                    <button type="button" className="sg-card-cta" onClick={() => setOpen(it)}>
                      View & reserve <Icon name="arrow" size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </Motion>
          ) : (
            <p className="sg-empty">The Signature collection is being curated. Please visit again soon — or ask our concierge on WhatsApp.</p>
          )}
        </div>
      </section>

      {s.packaging.enabled && (
        <section className="sg sg-pack">
          <div className="wrap sg-pack-grid">
            <Motion type="scale" className="sg-pack-art">
              {s.packaging.images?.[0] ? (
                <img src={s.packaging.images[0]} alt="Signature packaging" loading="lazy" />
              ) : (
                <span className="sg-box" aria-hidden="true">
                  <span className="sg-box-lid" />
                  <span className="sg-box-body">
                    <b>JHAYRA</b>
                    <small>Signature</small>
                  </span>
                  <span className="sg-box-ribbon" />
                </span>
              )}
            </Motion>
            <div>
              <span className="sg-kick">Included with every piece</span>
              <h2 className="sg-h2">{s.packaging.title}</h2>
              <p className="sg-lead">{s.packaging.text}</p>
              <ul className="sg-list">
                {s.packaging.points.filter(Boolean).map((x) => (
                  <li key={x}>
                    <Icon name="check" size={14} /> {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {s.founder.enabled && (
        <section className="sg sg-founder">
          <div className="wrap sg-founder-box">
            <div>
              <span className="sg-kick">An exclusive service</span>
              <h2 className="sg-h2">
                Delivered personally <em>by the founder.</em>
              </h2>
              <p className="sg-lead">{s.founder.note}</p>
              <dl className="sg-facts">
                <div>
                  <dt>Service fee</dt>
                  <dd>{money(s.founder.fee)}, added separately</dd>
                </div>
                <div>
                  <dt>Available in</dt>
                  <dd>{s.founder.areas.join(', ')}</dd>
                </div>
                <div>
                  <dt>Slots</dt>
                  <dd>{s.founder.slots.join(' · ')}</dd>
                </div>
              </dl>
              <FounderCheck s={s} />
              <p className="sg-small">Optional. Choose it at checkout once your address is in an eligible area. Your slot is confirmed with you before delivery.</p>
            </div>
          </div>
        </section>
      )}

      <section className="sg sg-faq">
        <div className="wrap">
          <div className="sg-head">
            <span className="sg-kick">Questions</span>
            <h2 className="sg-h2">Before you reserve</h2>
          </div>
          <div className="sg-faq-list">
            {s.faq.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
          <div className="sg-end">
            <Link to="/checkout" className="btn sg-btn">
              Go to checkout <Icon name="arrow" size={16} />
            </Link>
            <a className="btn sg-btn-ghost" href={waLink('Hi JHAYRA! I would like help with the Signature collection.')} target="_blank" rel="noopener noreferrer">
              Speak to the concierge
            </a>
          </div>
        </div>
      </section>

      {open && <Detail item={open} s={s} onClose={() => setOpen(null)} />}
    </>
  );
}
