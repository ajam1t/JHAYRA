import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon';
import GiftWheel from '../components/GiftWheel';
import Frame from '../components/Frame';
import TemplateCanvas from '../components/TemplateCanvas';
import ProductCard from '../components/ProductCard';
import { SmoothTabs, ripple } from '../components/Motion';
import { Seo } from '../lib/seo';
import { useCategories, useFrameTables, useProducts } from '../lib/catalog';
import { useTemplates } from '../lib/templates';
import { money, waLink, deliveryWindow } from '../lib/site';
import { SIZES } from '../lib/frames';
import { WHO, WHEN, STYLES, TYPES, budgets, recommend, GIFT_GUIDE, GIFT_HOW } from '../lib/giftfinder';

const KEYS = ['who', 'when', 'budget', 'style', 'type'];
const ANY = 'any';

/* Live "your gift so far" panel: real matches for the answers given so far. */
function GiftPreview({ live, answers, step, total }) {
  const thumbs = (live?.products || []).slice(0, 3).map(({ p }) => p);
  const tmpl = !thumbs.length ? live?.templates?.[0]?.t : null;
  const n = (live?.productTotal || 0) + (live?.templateTotal || 0);
  return (
    <aside className="gf3-preview" aria-live="polite">
      <div className="gf3-fan" key={thumbs.map((p) => p.id).join() || tmpl?.id || 'none'}>
        {thumbs.length ? (
          thumbs.map((p, i) => (
            <span key={p.id} className="gf3-fan-card" style={{ '--i': i }}>
              <Frame src={p.thumbnail} alt="" ratio={{ w: 12, h: 16 }} colour={i === 1 ? '#b08a45' : '#1C1C1C'} glare={false} sizes="120px" />
            </span>
          ))
        ) : tmpl ? (
          <span className="gf3-fan-card" style={{ '--i': 1 }}>
            <Frame ratio={{ w: 12, h: 16 }} colour="#1C1C1C" glare={false}>
              <TemplateCanvas template={tmpl} mini />
            </Frame>
          </span>
        ) : (
          <span className="gf3-box" aria-hidden="true" />
        )}
      </div>
      <p className="gf3-count">
        {live ? (
          <>
            <b>{n}</b> {n === 1 ? 'design matches' : 'designs match'} so far
          </>
        ) : (
          'Loading the collection…'
        )}
      </p>
      <ul className="gf3-tags">
        {answers.map(([k, v]) => (
          <li key={k} className={v ? 'on' : ''}>
            {v || '…'}
          </li>
        ))}
      </ul>
      <div className="gf3-meter" aria-hidden="true">
        <span style={{ width: `${(step / total) * 100}%` }} />
      </div>
    </aside>
  );
}

/* The top pick, unwrapped. */
function GiftReveal({ pick, sizes, onShare, shared }) {
  const win = deliveryWindow();
  if (!pick) return null;
  const isT = pick.kind === 'template';
  const href = isT ? `/customize/${pick.t.id}` : `/product/${pick.p.id}${pick.query || ''}`;
  return (
    <div className="gf3-reveal">
      <div className="gf3-reveal-art">
        <span className="gf3-lid" aria-hidden="true" />
        <span className="gf3-glow" aria-hidden="true" />
        <Link to={href} className="gf3-reveal-frame" aria-label={isT ? pick.t.title : pick.p.name}>
          {isT ? (
            <Frame ratio={{ w: 12, h: 16 }} colour="#b08a45" glare={false}>
              <TemplateCanvas template={pick.t} mini />
            </Frame>
          ) : (
            <Frame src={pick.p.thumbnail} alt="" ratio={{ w: 12, h: 16 }} colour="#b08a45" glare={false} sizes="(max-width: 760px) 60vw, 300px" priority />
          )}
        </Link>
      </div>
      <div className="gf3-reveal-copy">
        <span className="eyebrow">Our top pick</span>
        <h2 className="h2">{isT ? pick.t.title : pick.p.name}</h2>
        {pick.why.length > 0 && (
          <ul className="gf3-why">
            {pick.why.slice(0, 3).map((w) => (
              <li key={w}>
                <Icon name="check" size={13} /> {w}
              </li>
            ))}
          </ul>
        )}
        <p className="gf3-price">
          {isT ? `Personalise with their photos · from ${money(sizes[0]?.price || 499)}` : `from ${money(pick.p.price)}`}
        </p>
        <div className="gf3-reveal-ctas">
          <Link to={href} className="btn btn-gold" onPointerDown={ripple}>
            {isT ? 'Personalise this gift' : 'See this gift'} <Icon name="arrow" size={16} />
          </Link>
          <button type="button" className="btn btn-ghost" onClick={onShare}>
            <Icon name={shared ? 'check' : 'share'} size={16} /> {shared ? 'Link copied' : 'Share these ideas'}
          </button>
        </div>
        <ul className="gf3-perks">
          <li>
            <Icon name="gift" size={15} /> Free gift card at checkout — and we can hide the price
          </li>
          <li>
            <Icon name="truck" size={15} /> Free delivery · order today, arrives {win.early} – {win.late}
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function GiftFinder() {
  const [params, setParams] = useSearchParams();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const { data: tables } = useFrameTables();
  const { active } = useTemplates();
  const heading = useRef(null);

  // Real size prices from the database; the bundled table is the fallback.
  const sizes = useMemo(() => (tables?.sizes?.length ? tables.sizes.map((s) => ({ slug: s.slug, name: s.name, price: +s.base_price, dimensions: s.dimensions })) : SIZES), [tables]);
  const budgetOpts = useMemo(() => budgets(sizes), [sizes]);
  // Only styles the catalogue can actually fill (personalised also counts templates).
  const styleOpts = useMemo(
    () =>
      STYLES.map((s) => ({ ...s, n: (products || []).filter((p) => p.thumbnail && s.test(p)).length + (s.templates ? active.length : s.groups ? active.filter((t) => s.groups.includes(t.group)).length : 0) })).filter((s) => s.n > 0),
    [products, active],
  );

  const a = Object.fromEntries(KEYS.map((k) => [k, params.get(k) || '']));
  const steps = [
    { key: 'who', q: 'Who are you shopping for?', opts: WHO.map((o) => ({ id: o.id, label: o.label, icon: o.icon })) },
    { key: 'when', q: 'What is the occasion?', opts: WHEN.map((o) => ({ id: o.id, label: o.label, icon: o.icon })) },
    { key: 'budget', q: 'What is your budget?', hint: 'Prices are per framed piece; every design comes in these sizes.', opts: budgetOpts.map((b) => ({ id: b.id, label: `Up to ${money(b.max)}`, icon: 'rupee', hint: b.sizes.length > 2 ? `${b.sizes[0].name} to ${b.sizes[b.sizes.length - 1].name}` : b.sizes.map((s) => s.name).join(' · ') })), skip: 'Any budget' },
    { key: 'style', q: 'What style do they like?', opts: styleOpts.map((s) => ({ id: s.id, label: s.label, icon: s.icon, hint: `${s.n} designs` })), skip: 'Not sure — skip' },
    { key: 'type', q: 'What type of artwork would they prefer?', opts: TYPES, skip: null },
  ];
  // The current step: explicit ?step=, else the first unanswered question.
  const first = steps.findIndex((s) => !a[s.key]);
  const stepParam = params.get('step');
  const step = stepParam != null ? Math.max(0, Math.min(steps.length, +stepParam)) : first === -1 ? steps.length : first;
  const done = step >= steps.length;

  const go = (next, patch = {}) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) v ? p.set(k, v) : p.delete(k);
    p.set('step', String(next));
    setParams(p);
  };
  const answer = (key, id) => go(step + 1, { [key]: id });
  const restart = () => setParams(new URLSearchParams());

  // Move focus to the new question so keyboard and screen-reader users follow.
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [step]);

  // Recommendations update live as each question is answered.
  const live = useMemo(() => {
    if (!products) return null;
    const clean = Object.fromEntries(KEYS.map((k) => [k, a[k] === ANY ? '' : a[k]]));
    return recommend({ products, templates: active, sizes, a: clean });
  }, [products, active, sizes, params]); // eslint-disable-line react-hooks/exhaustive-deps
  const results = done ? live : null;
  const [tab, setTab] = useState('');

  const largest = results?.fits?.[results.fits.length - 1];
  const sizeQuery = results?.budget && largest ? `?size=${largest.slug}` : '';
  const empty = results && !results.products.length && !results.templates.length;
  const kinds = results ? (a.type === 'personal' ? ['templates', 'products'] : ['products', 'templates']).filter((k) => (k === 'products' ? results.products.length : results.templates.length)) : [];
  const kind = kinds.includes(tab) ? tab : kinds[0];
  const top = kinds[0] === 'templates' ? results?.templates[0] : results?.products[0];
  const pick = top ? { ...top, kind: kinds[0] === 'templates' ? 'template' : 'product', query: sizeQuery } : null;
  const [shared, setShared] = useState(false);
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: 'Gift ideas from JHAYRA', url });
      else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      }
    } catch {}
  };
  const label = (key) => {
    const s = steps.find((x) => x.key === key);
    const v = a[key];
    if (!v || v === ANY) return null;
    return s?.opts.find((o) => o.id === v)?.label;
  };

  return (
    <>
      <Seo title="Gift Finder — Find Art They’ll Love" description="Five quick questions — who it’s for, the occasion, your budget, their style and the kind of art — and we’ll match real JHAYRA artwork and personalised frames." path="/gift-finder" />
      <section className="gf2 mesh">
        <div className={`wrap ${done ? 'wrap-narrow' : 'gf3-wrap'}`}>
          <div className="gf2-progress" role="progressbar" aria-label="Gift Finder progress" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={Math.min(step, steps.length)} aria-valuetext={done ? 'Results' : `Question ${step + 1} of ${steps.length}`}>
            {steps.map((s, i) => (
              <span key={s.key} className={i < step ? 'done' : i === step ? 'now' : ''} />
            ))}
          </div>
          {!done ? (
            <div className="gf3-grid">
            <div className="gf2-step" key={step}>
              <h1 className="h1 gf2-q" tabIndex={-1} ref={heading}>
                {steps[step].q}
              </h1>
              {steps[step].hint && <p className="muted gf2-hint">{steps[step].hint}</p>}
              <GiftWheel key={step} label={steps[step].q} options={steps[step].opts} value={a[steps[step].key]} onChoose={(id) => answer(steps[step].key, id)} step={step + 1} total={steps.length} />
              <div className="gf2-nav">
                {step > 0 ? (
                  <button type="button" className="link" onClick={() => go(step - 1)}>
                    <Icon name="arrowL" size={16} /> Back
                  </button>
                ) : (
                  <span />
                )}
                <span className="row" style={{ gap: 18 }}>
                  {steps[step].skip !== null && (
                    <button type="button" className="link" onClick={() => answer(steps[step].key, ANY)}>
                      {steps[step].skip || 'Skip'}
                    </button>
                  )}
                  {step > 0 && (
                    <button type="button" className="link" onClick={restart}>
                      <Icon name="refresh" size={15} /> Start over
                    </button>
                  )}
                </span>
              </div>
            </div>
            <GiftPreview live={live} answers={steps.map((x) => [x.key, label(x.key)])} step={step} total={steps.length} />
            </div>
          ) : (
            <div className="gf2-step gf2-summary" key="done">
              <span className="eyebrow">Your matches</span>
              <h1 className="h1 gf2-q" tabIndex={-1} ref={heading}>
                {label('who') ? (
                  <>
                    Gifts for <em>{label('who').toLowerCase()}.</em>
                  </>
                ) : (
                  <>
                    Art they’ll <em>love.</em>
                  </>
                )}
              </h1>
              <div className="chips gf2-answers" aria-label="Your answers">
                {steps.map((s, i) => (
                  <button key={s.key} type="button" className="chip" onClick={() => go(i)}>
                    {label(s.key) || `${s.key === 'who' ? 'Anyone' : s.key === 'when' ? 'Any occasion' : s.key === 'budget' ? 'Any budget' : s.key === 'style' ? 'Any style' : 'Both types'}`} <Icon name="edit" size={13} />
                  </button>
                ))}
              </div>
              {results?.budget && (
                <p className="muted">
                  Within {money(results.budget.max)}: {results.fits.map((s) => `${s.name} (${money(s.price)})`).join(', ')}.
                </p>
              )}
              <button type="button" className="link" style={{ marginTop: 14 }} onClick={restart}>
                <Icon name="refresh" size={16} /> Start over
              </button>
            </div>
          )}
        </div>
      </section>

      {done && !results && (
        <div className="wrap center muted" style={{ padding: '40px 0 90px' }} aria-live="polite">
          Finding matches…
        </div>
      )}

      {empty && (
        <section className="wrap wrap-narrow center gf2-empty">
          <h2 className="h3">Nothing matches every answer yet.</h2>
          <p className="muted">Try loosening one choice — or tell us who it’s for and we’ll suggest something personally.</p>
          <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap', marginTop: 18 }}>
            {a.style && a.style !== ANY && (
              <button type="button" className="btn btn-sm" onClick={() => go(steps.length, { style: ANY })}>
                Any style
              </button>
            )}
            {a.budget && a.budget !== ANY && (
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => go(steps.length, { budget: ANY })}>
                Any budget
              </button>
            )}
            <a className="btn btn-sm btn-ghost" href={waLink('Hi JHAYRA! Can you help me choose a gift?')} target="_blank" rel="noopener noreferrer">
              Ask us on WhatsApp
            </a>
          </div>
        </section>
      )}

      {results && !empty && (
        <section className="wrap gf2-results" aria-live="polite">
          <GiftReveal pick={pick} sizes={sizes} onShare={share} shared={shared} />
          {kinds.length > 1 && <SmoothTabs className="gf3-tabs" label="Gift ideas" value={kind} onChange={setTab} tabs={kinds.map((k) => [k, k === 'products' ? `Ready-made · ${results.productTotal}` : `Personalised · ${results.templateTotal}`])} />}
          {kind === 'templates' ? (
            <div key="t" className="gf2-block">
              {kinds.length < 2 && <h2 className="h3">Personalised with their photos</h2>}
              <div className="tgrid sf-stagger">
                {results.templates.map(({ t, why }, i) => (
                  <Link key={t.id} to={`/customize/${t.id}`} className="tcard" style={{ '--i': i }}>
                    <div className="tcard-stage">
                      <Frame ratio={{ w: 12, h: 16 }} colour="#1C1C1C" glare={false}>
                        <TemplateCanvas template={t} mini />
                      </Frame>
                    </div>
                    <b>{t.title}</b>
                    <small>Personalise · from {money(sizes[0]?.price || 499)}</small>
                    {why.length > 0 && <span className="gf2-why">{why.slice(0, 2).join(' · ')}</span>}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div key="p" className="gf2-block">
              {kinds.length < 2 && <h2 className="h3">Ready-made art they’ll love</h2>}
              <div className="grid-products sf-stagger">
                {results.products.map(({ p, why }, i) => (
                  <div key={p.id} className="gf2-pwrap" style={{ '--i': i }}>
                    <ProductCard product={p} categories={categories} index={i} query={sizeQuery} />
                    {why.length > 0 && <span className="gf2-why">{why.slice(0, 2).join(' · ')}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="gf3-help">
            <p>
              Still not sure? Tell us about them — we’ll suggest something personally.
            </p>
            <a className="btn btn-ghost btn-sm" href={waLink('Hi JHAYRA! Can you help me choose a gift?')} target="_blank" rel="noopener noreferrer">
              Ask us on WhatsApp
            </a>
          </div>
        </section>
      )}
      <section className="wrap gf3-guide" aria-labelledby="gf3-guide-h">
        <h2 id="gf3-guide-h" className="hs-title">
          Gift ideas by occasion
        </h2>
        <div className="gf3-guide-grid">
          {GIFT_GUIDE.map(([h, t, l]) => (
            <article key={h}>
              <h3>{h}</h3>
              <p>{t}</p>
              <p className="gf3-guide-links">
                {l.map(([to, label]) => (
                  <Link key={to + label} to={to}>
                    {label}
                  </Link>
                ))}
              </p>
            </article>
          ))}
        </div>
        <h2 className="hs-title">How the Gift Finder chooses</h2>
        <p className="gf3-guide-how">{GIFT_HOW}</p>
        <p className="gf3-guide-how">
          Every piece comes in {sizes.map((s) => `${s.name} (${money(s.price)})`).join(', ')}, with a free printed gift card at checkout and free delivery across India. More ideas: <Link to="/journal/wall-art-gift-guide-occasions">the wall art gift guide</Link> and{' '}
          <Link to="/journal/how-to-make-a-personalised-photo-frame">how to make a personalised photo frame gift</Link>.
        </p>
      </section>
    </>
  );
}
