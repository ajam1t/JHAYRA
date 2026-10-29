import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Frame from '../components/Frame';
import Img from '../components/Img';
import Icon from '../components/Icon';
import Reveal from '../components/Reveal';
import { Seo } from '../lib/seo';
import { useProducts } from '../lib/catalog';
import { useCart } from '../state/cart';
import { money, SITE, waLink } from '../lib/site';

// The JHAYRA Signature Experience: curated art, packaging, gift messages,
// priority delivery, founder delivery and the art concierge.
function SignatureCard({ icon, title, children, cta, to, href, note, className = '', i = 0 }) {
  const action = href ? (
    <a className="link sig-cta" href={href} target="_blank" rel="noopener noreferrer">
      {cta} <Icon name="arrow" size={15} />
    </a>
  ) : (
    <Link className="link sig-cta" to={to}>
      {cta} <Icon name="arrow" size={15} />
    </Link>
  );
  return (
    <Reveal as="article" className={`sig-card ${className}`} delay={(i % 3) * 0.06}>
      <span className="sig-ic" aria-hidden="true">
        {icon}
      </span>
      <h3>{title}</h3>
      <div className="sig-body">{children}</div>
      {note && <p className="sig-note">{note}</p>}
      {action}
    </Reveal>
  );
}

function Signature({ products }) {
  const { count } = useCart();
  const art = (products || []).filter((p) => p.thumbnail);
  // Curated: the highest-rated bestseller from a few different categories.
  const curated = useMemo(() => {
    const seen = new Set();
    return art
      .filter((p) => p.is_bestseller)
      .sort((a, b) => (b.rating || 0) * (b.review_count || 0) - (a.rating || 0) * (a.review_count || 0))
      .filter((p) => !seen.has(p.category) && seen.add(p.category))
      .slice(0, 3);
  }, [products]); // eslint-disable-line react-hooks/exhaustive-deps
  const feature = curated[0];
  return (
    <section className="section sig" id="signature" aria-labelledby="sig-title">
      <div className="wrap">
        <div className="sig-intro">
          <Reveal className="sig-copy">
            <span className="deco" aria-hidden="true" />
            <span className="eyebrow">The Jhayra Signature Experience</span>
            <h1 className="h2" id="sig-title">
              Enter a World of <em>Extraordinary Art.</em>
            </h1>
            <p className="lead">Exceptional designs, thoughtful craftsmanship, beautiful packaging, and personal touches that make every Jhayra order feel special.</p>
            <a
              className="btn btn-gold btn-lg sheen"
              href="#sig-cards"
              onClick={(e) => {
                e.preventDefault();
                const c = document.getElementById('sig-cards');
                const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
                const offset = (document.querySelector('.header')?.offsetHeight || 68) + 12;
                c && window.scrollTo({ top: c.getBoundingClientRect().top + window.scrollY - offset, behavior: reduce ? 'auto' : 'smooth' });
              }}
            >
              Explore the Experience <Icon name="arrow" size={18} />
            </a>
          </Reveal>
          <Reveal className="sig-art deco-frame" delay={0.08}>
            {feature && (
              <Link to={`/product/${feature.id}`} className="sig-feature" aria-label={`${feature.name}, from ${money(feature.price)}`}>
                <Frame src={feature.thumbnail} alt={feature.name} ratio={{ w: 12, h: 16 }} colour="#1C1C1C" glare mat sizes="(max-width: 900px) 70vw, 30vw" />
              </Link>
            )}
            <span className="sig-seal" aria-hidden="true">
              <span>JHAYRA</span>
              <small>Signature</small>
            </span>
          </Reveal>
        </div>

        <div className="sig-cards" id="sig-cards">
          <SignatureCard i={0} className="sig-curated" icon={<Icon name="star" size={18} />} title="Curated Artwork" cta="Explore the Collection" to="/collections">
            <p>Bestsellers chosen from across our styles.</p>
            <ul className="sig-picks">
              {curated.map((p) => (
                <li key={p.id}>
                  <Link to={`/product/${p.id}`}>
                    <span className="sig-pick-img">
                      <Img src={p.thumbnail} alt="" sizes="56px" width={140} />
                    </span>
                    <span>
                      <b>{p.name}</b>
                      <small>from {money(p.price)}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </SignatureCard>
          <SignatureCard i={1} icon={<Icon name="box" size={18} />} title="Beautiful Packaging" cta="Discover the Packaging" to="/replacement-policy">
            <p>Every order is quality-checked and packed securely for its journey. Ordering a gift? Your printed gift card goes inside the box and the price stays hidden.</p>
          </SignatureCard>
          <SignatureCard i={2} icon={<Icon name="edit" size={18} />} title="Personalised Gift Messages" cta="Make It Personal" to={count ? '/checkout?gift=1' : '/shop'} note={count ? 'Opens checkout with the gift card ready to write.' : 'Add a free gift card with your message at checkout.'}>
            <p>Write who it’s for, who it’s from and a message from the heart. We print it on a card and send it with the artwork — free on every order.</p>
          </SignatureCard>
          <SignatureCard
            i={3}
            icon={<Icon name="truck" size={18} />}
            title="Priority Delivery"
            cta="Check Delivery Options"
            href={waLink('Hi JHAYRA! I’d like to check faster delivery. My pincode is: … and I need it by: …')}
            note="Faster delivery isn’t bookable online yet. We confirm availability and any extra cost on WhatsApp before you pay."
          >
            <p>
              Standard delivery is free: made to order in 1–2 business days, then 5–7 business days in transit. Need it sooner? Faster delivery may be possible for some orders and pincodes.
            </p>
          </SignatureCard>
          <SignatureCard
            i={4}
            className="sig-founder"
            icon={<span className="sig-wink">😉</span>}
            title="Delivered by the Founder"
            cta="Request Founder Delivery"
            href={waLink('Hi JHAYRA! I’d love to request founder delivery for my order. My city and pincode are: …  (I understand this is a request and not confirmed until you accept it.)')}
            note="A request, not a booking — it’s only confirmed once we reply and accept."
          >
            <p>Sometimes, your order comes with a personal hello. Available in selected locations, subject to confirmation.</p>
          </SignatureCard>
          <SignatureCard i={5} icon={<Icon name="sparkle" size={18} />} title="Personal Art Concierge" cta="Get Personal Guidance" href={waLink('Hi JHAYRA! I’d like help choosing artwork — size, frame or a gift.')} note={`Mon–Sat 9–7 · Sun 10–4 · ${SITE.phoneDisplay}`}>
            <p>Not sure which size suits your wall, which frame finish goes with your room, or what to gift? Talk to a real person on WhatsApp.</p>
          </SignatureCard>
        </div>
      </div>
    </section>
  );
}

export default function SignaturePage() {
  const { data: products } = useProducts();
  return (
    <>
      <Seo title="The JHAYRA Signature Experience" description="Curated artwork, careful packaging, personal gift messages, priority delivery on request and a personal art concierge — the JHAYRA Signature Experience." path="/signature-experience" />
      <Signature products={products} />
    </>
  );
}
