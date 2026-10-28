import { useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon';
import GiftWheel from '../components/GiftWheel';
import Frame from '../components/Frame';
import TemplateCanvas from '../components/TemplateCanvas';
import ProductCard from '../components/ProductCard';
import { Seo } from '../lib/seo';
import { useCategories, useFrameTables, useProducts } from '../lib/catalog';
import { useTemplates } from '../lib/templates';
import { money, waLink } from '../lib/site';
import { SIZES } from '../lib/frames';
import { WHO, WHEN, STYLES, TYPES, budgets, recommend } from '../lib/giftfinder';

const KEYS = ['who', 'when', 'budget', 'style', 'type'];
const ANY = 'any';

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

  const results = useMemo(() => {
    if (!done || !products) return null;
    const clean = Object.fromEntries(KEYS.map((k) => [k, a[k] === ANY ? '' : a[k]]));
    return recommend({ products, templates: active, sizes, a: clean });
  }, [done, products, active, sizes, params]); // eslint-disable-line react-hooks/exhaustive-deps

  const largest = results?.fits?.[results.fits.length - 1];
  const sizeQuery = results?.budget && largest ? `?size=${largest.slug}` : '';
  const empty = results && !results.products.length && !results.templates.length;
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
        <div className="wrap wrap-narrow">
          <div className="gf2-progress" role="progressbar" aria-label="Gift Finder progress" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={Math.min(step, steps.length)} aria-valuetext={done ? 'Results' : `Question ${step + 1} of ${steps.length}`}>
            {steps.map((s, i) => (
              <span key={s.key} className={i < step ? 'done' : i === step ? 'now' : ''} />
            ))}
          </div>
          {!done ? (
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
          {[a.type === 'personal' ? 'templates' : 'products', a.type === 'personal' ? 'products' : 'templates'].map((kind) =>
            kind === 'templates' && results.templates.length ? (
              <div key={kind} className="gf2-block">
                <h2 className="h3">Personalised with their photos</h2>
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
            ) : kind === 'products' && results.products.length ? (
              <div key={kind} className="gf2-block">
                <h2 className="h3">Ready-made art they’ll love</h2>
                <div className="grid-products sf-stagger">
                  {results.products.map(({ p, why }, i) => (
                    <div key={p.id} className="gf2-pwrap" style={{ '--i': i }}>
                      <ProductCard product={p} categories={categories} index={i} query={sizeQuery} />
                      {why.length > 0 && <span className="gf2-why">{why.slice(0, 2).join(' · ')}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ) : null,
          )}
        </section>
      )}
    </>
  );
}
