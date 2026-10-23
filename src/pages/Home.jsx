import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Frame from '../components/Frame';
import Img from '../components/Img';
import Icon from '../components/Icon';
import Reveal from '../components/Reveal';
import Particles from '../components/Particles';
import TemplateCanvas from '../components/TemplateCanvas';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import { Seo } from '../lib/seo';
import { useCategories, useCollections, useProducts } from '../lib/catalog';
import { useTemplates, MOMENTS } from '../lib/templates';
import { readPhoto, photoHandoff } from '../lib/upload';
import { useFestival } from '../state/festival';
import { useToast } from '../state/store';
import { daysUntil, orderBy } from '../lib/festivals';
import { money, SITE, waLink } from '../lib/site';
import { BRAND } from '../lib/brand';
import { MIN_PRICE } from '../lib/frames';

/* ── Festival world hero ──────────────────────────────────────────────── */
function Countdown({ festival }) {
  const left = daysUntil(festival);
  const by = orderBy(festival);
  const late = by < new Date();
  const fmt = (d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  if (left < 0) return null;
  return (
    <div className="fx-count">
      <div className="fx-count-num">
        <b>{left === 0 ? 'Today' : left}</b>
        {left > 0 && <span>{left === 1 ? 'day to go' : 'days to go'}</span>}
      </div>
      <p>
        {late ? (
          <>
            Short on time? <a href={waLink(`Hi JHAYRA! Can you deliver a ${festival.name} frame before ${fmt(new Date(festival.date))}? My pincode is: `)} target="_blank" rel="noopener noreferrer">WhatsApp us</a> — we'll tell you honestly if we can make it to your city.
          </>
        ) : (
          <>
            Order by <b>{fmt(by)}</b> for delivery before {festival.name}.
          </>
        )}
      </p>
    </div>
  );
}

function CouponChip({ code, offer }) {
  const toast = useToast();
  if (!code) return null;
  return (
    <button
      type="button"
      className="fx-coupon"
      onClick={() => {
        navigator.clipboard?.writeText(code).catch(() => {});
        toast(`Code ${code} copied — it's applied automatically at checkout`, 'ok');
      }}
    >
      <span>{offer}</span>
      <b>{code}</b>
      <small>Tap to copy</small>
    </button>
  );
}

function FestivalHero({ festival }) {
  const { active } = useTemplates();
  const pick = useMemo(() => {
    for (const g of festival.templateGroups) {
      const t = active.find((x) => x.group === g && !x.layout.startsWith('calendar') && (x.slots?.length || 0) <= 2);
      if (t) return t;
    }
    return active[0];
  }, [active, festival]);
  const texts = festival.id === 'karva-chauth' ? { name1: 'Aarav', name2: 'Ananya', name: 'Aarav & Ananya', msg: 'My moon, my forever', date: festival.date } : {};
  return (
    <section className="fx-hero" aria-label={`${festival.name} collection`}>
      <Particles kind={festival.particles} />
      {festival.theme.moon && <div className="fx-moon" aria-hidden="true" />}
      {festival.theme.rangoli && <div className="fx-rangoli" aria-hidden="true" />}
      <div className="wrap fx-grid">
        <div className="fx-copy">
          <span className="eyebrow">{festival.eyebrow}</span>
          <h1 className="display fx-title">
            {festival.title.map((line, i) => (
              <span key={i} style={{ '--i': i }}>
                {i === festival.title.length - 1 ? <em>{line}</em> : line}
              </span>
            ))}
          </h1>
          <p className="lead">{festival.lead}</p>
          <CouponChip code={festival.coupon} offer={festival.offer} />
          <div className="row fx-ctas">
            <Link to={festival.cta.to} className="btn btn-gold btn-lg">
              {festival.cta.label} <Icon name="arrow" size={18} />
            </Link>
            <Link to={festival.cta2.to} className="btn btn-ghost-light btn-lg">
              {festival.cta2.label}
            </Link>
          </div>
          <Countdown festival={festival} />
        </div>
        <div className="fx-art" aria-hidden="true">
          <div className="fx-art-glow" />
          {pick && (
            <Frame ratio={{ w: 12, h: 16 }} colour="#B8932A" tilt mat>
              <TemplateCanvas template={pick} texts={{ ...texts }} />
            </Frame>
          )}
        </div>
      </div>
    </section>
  );
}

function FestivalPicks({ festival, products, categories }) {
  const { active } = useTemplates();
  const templates = active.filter((t) => festival.templateGroups.includes(t.group)).slice(0, 8);
  const picks = (products || [])
    .filter((p) => festival.categories.includes(p.category) || festival.keywords.some((k) => p.name.toLowerCase().includes(k)))
    .slice(0, 8);
  if (!templates.length && !picks.length) return null;
  return (
    <section className="section fx-picks">
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="eyebrow">{festival.name} edit</span>
            <h2 className="h2">
              Made for <em>this {festival.name}</em>
            </h2>
          </div>
          <Link to={festival.cta.to} className="link">
            See everything <Icon name="arrow" size={16} />
          </Link>
        </div>
        {templates.length > 0 && (
          <div className="rail" role="list">
            {templates.map((t) => (
              <Link key={t.id} to={`/customize/${t.id}`} className="rail-item tcard" role="listitem">
                <div className="tcard-stage">
                  <Frame ratio={{ w: 12, h: 16 }} colour="#B8932A" glare={false}>
                    <TemplateCanvas template={t} mini />
                  </Frame>
                </div>
                <b>{t.title}</b>
                <small>Personalise · from {money(MIN_PRICE)}</small>
              </Link>
            ))}
          </div>
        )}
        {picks.length > 0 && (
          <div className="grid-products" style={{ marginTop: 48 }}>
            {picks.slice(0, 4).map((p, i) => (
              <ProductCard key={p.id} product={p} categories={categories} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Default hero: drop your photo ────────────────────────────────────── */
function PhotoHero({ products, compact = false }) {
  const [photo, setPhoto] = useState(null);
  const [drag, setDrag] = useState(false);
  const [i, setI] = useState(0);
  const input = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();
  const art = (products || []).filter((p) => p.thumbnail && p.is_bestseller).slice(0, 6);

  useEffect(() => {
    if (photo || art.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % art.length), 3800);
    return () => clearInterval(t);
  }, [photo, art.length]);

  const pick = async (file) => {
    try {
      const p = await readPhoto(file);
      setPhoto(p);
    } catch (e) {
      toast(e.message, 'warn');
    }
  };
  const go = () => {
    photoHandoff.set(photo);
    navigate('/customize/photo');
  };

  const Tag = compact ? 'section' : 'section';
  return (
    <Tag className={`hero ${compact ? 'hero-compact' : ''}`}>
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">Since {BRAND.since} · {BRAND.homes} homes</span>
          {compact ? (
            <h2 className="h1">
              Or frame <em>your own</em> photo.
            </h2>
          ) : (
            <h1 className="display">
              The photo you keep going back to <em>deserves a frame.</em>
            </h1>
          )}
          <p className="lead">Drop any photo here and watch it become a handcrafted frame — sized, finished and delivered free across India. From {money(MIN_PRICE)}.</p>
          <div className="row hero-ctas">
            {photo ? (
              <>
                <button className="btn btn-gold btn-lg" onClick={go}>
                  Frame this photo <Icon name="arrow" size={18} />
                </button>
                <button className="btn btn-ghost btn-lg" onClick={() => input.current?.click()}>
                  Try another
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-gold btn-lg" onClick={() => input.current?.click()}>
                  <Icon name="upload" size={18} /> Upload your photo
                </button>
                <Link to="/shop" className="btn btn-ghost btn-lg">
                  Explore designs
                </Link>
              </>
            )}
          </div>
          <ul className="hero-proof">
            <li>
              <Icon name="truck" size={18} /> Free delivery, all India
            </li>
            <li>
              <Icon name="refresh" size={18} /> Free replacement if damaged
            </li>
            <li>
              <Icon name="lock" size={18} /> UPI · Cards · Netbanking
            </li>
          </ul>
        </div>
        <div
          className={`hero-stage ${drag ? 'drag' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f) pick(f);
          }}
        >
          <div className="hero-wall">
            <div className="hero-spot" />
            <div className="hero-frame">
              {photo ? (
                <Frame key={photo.url} src={photo.url} ratio={{ w: 12, h: 18 }} orientation={photo.width > photo.height * 1.15 ? 'Horizontal' : 'Vertical'} colour="#1C1C1C" tilt priority />
              ) : (
                <Frame key={art[i]?.id || 'ph'} src={art[i]?.thumbnail} alt={art[i]?.name || ''} ratio={{ w: 12, h: 18 }} colour={['#1C1C1C', '#B8932A', '#6B4423'][i % 3]} tilt priority />
              )}
            </div>
            <button className="hero-drop" onClick={() => input.current?.click()}>
              <Icon name="image" size={18} />
              {photo ? 'Change photo' : 'Drop a photo to see it framed'}
            </button>
            {photo && (
              <span className={`hero-q q-${photo.quality}`}>
                {photo.quality === 'low' ? 'Low resolution — best at A4' : photo.quality === 'unknown' ? 'Photo ready' : 'Great print quality'}
              </span>
            )}
          </div>
        </div>
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])} />
    </Tag>
  );
}

/* ── Shop by moment ───────────────────────────────────────────────────── */
function Moments() {
  const { active } = useTemplates();
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="eyebrow">Personalise</span>
            <h2 className="h2">
              Every moment has <em>a frame.</em>
            </h2>
          </div>
          <Link to="/customize" className="link">
            All {active.length} designs <Icon name="arrow" size={16} />
          </Link>
        </div>
        <div className="moments">
          {MOMENTS.slice(0, 4).map((m, i) => {
            const t = active.find((x) => m.groups.includes(x.group));
            return (
              <Reveal key={m.id} delay={i * 0.05}>
                <Link to={`/customize?moment=${m.id}`} className="moment">
                  <div className="moment-art">
                    {t && (
                      <Frame ratio={{ w: 12, h: 16 }} colour={i % 2 ? '#1C1C1C' : '#B8932A'} glare={false}>
                        <TemplateCanvas template={t} mini />
                      </Frame>
                    )}
                  </div>
                  <div>
                    <b>{m.label}</b>
                    <small>{m.hint}</small>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Collections from the admin panel ─────────────────────────────────── */
function Collections({ collections }) {
  if (!collections?.length) return null;
  return (
    <section className="section surface-cream">
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="eyebrow">Collections</span>
            <h2 className="h2">
              Every wall <em>has a story.</em>
            </h2>
          </div>
          <Link to="/collections" className="link">
            Browse collections <Icon name="arrow" size={16} />
          </Link>
        </div>
        <div className="bento">
          {collections.slice(0, 6).map((c, i) => (
            <Reveal key={c.id} delay={i * 0.06} className={`bento-item b${i}`}>
              <Link to={c.link || '/shop'} className="bento-link">
                <Img src={c.image_url} alt={c.alt_text || c.title} sizes="(max-width: 760px) 100vw, 40vw" width={900} />
                <div className="bento-cap">
                  <small>{c.subtitle}</small>
                  <b>{c.title}</b>
                  <span className="bento-go">
                    <Icon name="arrow" size={18} />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    el.addEventListener('pointermove', move);
    return () => el.removeEventListener('pointermove', move);
  }, []);
  return (
    <section ref={ref} className="final-cta surface-night">
      <div className="wrap center">
        <span className="eyebrow center">Since {BRAND.since} · {BRAND.homes} homes · {BRAND.gifts} gifts</span>
        <h2 className="h1" style={{ marginTop: 18 }}>
          Make a wall <em>worth stopping at.</em>
        </h2>
        <div className="row" style={{ justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
          <Link to="/customize" className="btn btn-gold btn-lg">
            Start personalising
          </Link>
          <Link to="/gift-finder" className="btn btn-ghost-light btn-lg">
            Find a gift in 30 seconds
          </Link>
        </div>
      </div>
    </section>
  );
}

const TRUST = [
  ['truck', 'Free delivery', 'Every order, every pincode'],
  ['refresh', 'Free replacement', 'If it arrives damaged'],
  ['shield', 'Secure checkout', 'Razorpay · UPI · Cards'],
  ['sparkle', `Since ${BRAND.since}`, `${BRAND.homes} homes on Amazon & beyond`],
];

export default function Home() {
  const festival = useFestival();
  const { data: products, loading } = useProducts();
  const { data: categories } = useCategories();
  const { data: collections } = useCollections();
  const featured = (products || []).filter((p) => p.homepage_visible || p.is_bestseller).slice(0, 8);

  return (
    <>
      <Seo
        title={festival ? `${festival.name} Gifts — Personalised Frames | JHAYRA` : 'JHAYRA — Personalised Photo Frames & Wall Art, Made in India'}
        description={festival ? festival.lead : 'Turn your favourite photo into a handcrafted frame. Personalised couple, family and wedding frames, spiritual and modern wall art. Free delivery across India.'}
        path="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'JHAYRA',
          url: SITE.url,
          logo: SITE.ogImage,
          foundingDate: String(BRAND.since),
          sameAs: [SITE.instagram],
          contactPoint: { '@type': 'ContactPoint', telephone: '+91-7070728989', contactType: 'customer service', availableLanguage: ['English', 'Hindi'] },
        }}
      />
      {festival ? <FestivalHero festival={festival} /> : <PhotoHero products={products} />}
      <div className="trust">
        {TRUST.map(([ic, b, s]) => (
          <div key={b}>
            <Icon name={ic} />
            <span>
              <b>{b}</b>
              <small>{s}</small>
            </span>
          </div>
        ))}
      </div>
      {festival && <FestivalPicks festival={festival} products={products} categories={categories} />}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="eyebrow">Bestsellers</span>
              <h2 className="h2">
                Loved on <em>thousands of walls.</em>
              </h2>
            </div>
            <Link to="/shop" className="link">
              Shop all <Icon name="arrow" size={16} />
            </Link>
          </div>
          <div className="grid-products home-best">
            {loading
              ? Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)
              : featured.map((p, i) => <ProductCard key={p.id} product={p} categories={categories} index={i} />)}
          </div>
          <p className="small muted" style={{ marginTop: 18 }}>
            ★ {BRAND.ratingSource}.
          </p>
        </div>
      </section>
      <Moments />
      <Collections collections={collections} />
      <FinalCta />
    </>
  );
}
