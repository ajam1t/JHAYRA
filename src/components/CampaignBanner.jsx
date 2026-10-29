import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Frame from './Frame';
import Icon from './Icon';
import { useProducts } from '../lib/catalog';
import { campaignImage, liveCampaigns, targetFor, useCampaigns } from '../lib/campaigns';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Campaign dates are calendar days in India; format them without time zones.
const fmt = (d) => `${+d.slice(8, 10)} ${MONTHS[+d.slice(5, 7) - 1]}`;

export function CampaignSlide({ c, products, priority = false }) {
  const img = campaignImage(c, products);
  const t = targetFor(c.target);
  return (
    <div className="cb-slide">
      <div className="cb-copy">
        <span className="cb-kicker">
          <span className="cb-dot" aria-hidden="true" /> {c.kicker}
        </span>
        <h2 className="cb-title">{c.title}</h2>
        <p className="cb-sub">{c.subtitle}</p>
        <div className="cb-foot">
          <Link to={t.to} className="btn btn-gold sheen">
            {c.cta || 'Explore Collection'} <Icon name="arrow" size={16} />
          </Link>
          {c.end && <span className="cb-until">Until {fmt(c.end)}</span>}
        </div>
      </div>
      <Link to={t.to} className="cb-art" tabIndex={-1} aria-hidden="true">
        <span className="cb-glow" />
        {img && <Frame src={img} alt="" ratio={{ w: 12, h: 16 }} colour="#1C1C1C" glare mat sizes="(max-width: 760px) 46vw, 300px" priority={priority} />}
      </Link>
    </div>
  );
}

// Live campaigns below the hero; rotates when there is more than one.
export default function CampaignBanner() {
  const all = useCampaigns();
  const { data: products } = useProducts();
  const live = liveCampaigns(all);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const box = useRef(null);
  const n = live.length;
  useEffect(() => {
    if (n < 2 || paused || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 7000);
    return () => clearInterval(t);
  }, [n, paused]);
  if (!n) return null;
  const k = i % n;
  return (
    <section className="cb" aria-roledescription="carousel" aria-label="Celebrations" ref={box} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="wrap">
        <div className="cb-stage">
          {live.map((c, j) => (
            <div key={c.id} className={`cb-item ${j === k ? 'on' : ''}`} aria-hidden={j !== k} inert={j !== k ? '' : undefined} role="group" aria-roledescription="slide" aria-label={`${j + 1} of ${n}: ${c.title}`}>
              <CampaignSlide c={c} products={products} priority={j === 0} />
            </div>
          ))}
        </div>
        {n > 1 && (
          <div className="cb-nav">
            <button type="button" className="icon-btn" aria-label="Previous celebration" onClick={() => setI((x) => (x - 1 + n) % n)}>
              <Icon name="arrowL" size={18} />
            </button>
            <div className="cb-dots" role="tablist" aria-label="Choose a celebration">
              {live.map((c, j) => (
                <button key={c.id} type="button" role="tab" aria-selected={j === k} aria-label={c.title} onClick={() => setI(j)} />
              ))}
            </div>
            <button type="button" className="icon-btn" aria-label="Next celebration" onClick={() => setI((x) => (x + 1) % n)}>
              <Icon name="arrow" size={18} />
            </button>
            <Link to="/celebrations" className="link cb-all">
              All celebrations
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
