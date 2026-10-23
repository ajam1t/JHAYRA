import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import Frame from '../components/Frame';
import TemplateCanvas from '../components/TemplateCanvas';
import ProductCard from '../components/ProductCard';
import { Seo } from '../lib/seo';
import { useCategories, useProducts } from '../lib/catalog';
import { useTemplates } from '../lib/templates';
import { useFestival } from '../state/festival';
import { money } from '../lib/site';
import { SIZES } from '../lib/frames';

const WHO = [
  { id: 'partner', label: 'My partner', emoji: '💞', groups: ['couple-frame', 'love', 'moon-style', 'anniversary', 'wedding'], cats: ['love-romance', 'wedding'] },
  { id: 'parents', label: 'Mom or Dad', emoji: '🙏', groups: ['parents', 'family', 'collage-frame'], cats: ['family', 'religious', 'quotes'] },
  { id: 'family', label: 'The whole family', emoji: '🏡', groups: ['family', 'collage-frame', 'mosaic-frame', 'calendar'], cats: ['family', 'home-vastu', 'religious'] },
  { id: 'baby', label: 'A little one', emoji: '🍼', groups: ['baby', 'milestones', 'birthday'], cats: ['baby-kids'] },
  { id: 'friend', label: 'A friend', emoji: '🥂', groups: ['friendship', 'travel', 'birthday', 'quotes'], cats: ['quotes', 'modern-art', 'nature'] },
  { id: 'work', label: 'Boss or colleague', emoji: '💼', groups: ['quotes', 'milestones'], cats: ['running-horses', 'modern-art', 'quotes'] },
  { id: 'home', label: 'My own home', emoji: '✨', groups: ['single-photo', 'collage-frame'], cats: ['modern-art', 'nature', 'religious', 'art-abstract', 'home-vastu'] },
];
const WHEN = [
  { id: 'birthday', label: 'Birthday', groups: ['birthday', 'milestones'] },
  { id: 'anniversary', label: 'Anniversary', groups: ['anniversary', 'couple-frame', 'love'] },
  { id: 'wedding', label: 'Wedding', groups: ['wedding'] },
  { id: 'festival', label: 'A festival', groups: ['festivals', 'spiritual'] },
  { id: 'housewarming', label: 'Housewarming', groups: ['family', 'spiritual', 'quotes'] },
  { id: 'just', label: 'Just because', groups: [] },
];
const STYLE = [
  { id: 'photo', label: 'With their photos', hint: 'Personalised & emotional' },
  { id: 'art', label: 'Beautiful art', hint: 'Spiritual, modern, nature' },
  { id: 'both', label: 'Show me both', hint: 'I’m not sure yet' },
];
const BUDGET = [
  { id: 'b1', label: `Under ${money(1000)}`, max: 999 },
  { id: 'b2', label: `Under ${money(1500)}`, max: 1499 },
  { id: 'b3', label: 'Make it grand', max: 99999 },
];

export default function GiftFinder() {
  const festival = useFestival();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const { active } = useTemplates();
  const [step, setStep] = useState(0);
  const [a, setA] = useState({});
  const steps = [
    ['Who is it for?', WHO, 'who'],
    ['What’s the occasion?', festival ? [{ id: 'fest', label: festival.name, groups: festival.templateGroups, hot: true }, ...WHEN] : WHEN, 'when'],
    ['What kind of gift?', STYLE, 'style'],
    ['Your budget?', BUDGET, 'budget'],
  ];
  const done = step >= steps.length;

  const results = useMemo(() => {
    if (!done) return null;
    const who = WHO.find((x) => x.id === a.who) || WHO[6];
    const when = steps[1][1].find((x) => x.id === a.when) || WHEN[5];
    const groups = [...new Set([...(when.groups || []), ...who.groups])];
    const budget = BUDGET.find((b) => b.id === a.budget) || BUDGET[2];
    const size = [...SIZES].reverse().find((s) => s.price <= budget.max) || SIZES[0];
    const t = a.style === 'art' ? [] : active.filter((x) => groups.includes(x.group)).sort((x, y) => groups.indexOf(x.group) - groups.indexOf(y.group)).slice(0, 6);
    const pr = a.style === 'photo' ? [] : (products || []).filter((p) => who.cats.includes(p.category)).sort((x, y) => (y.is_bestseller ? 1 : 0) - (x.is_bestseller ? 1 : 0)).slice(0, 8);
    return { templates: t, products: pr, size, who };
  }, [done, a, active, products]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Seo title="Gift Finder — The Perfect Personalised Gift in 30 Seconds" description="Answer four quick questions and we’ll find the perfect personalised frame or wall art for anyone — partner, parents, friends, colleagues." path="/gift-finder" />
      <section className="gf">
        <div className="wrap wrap-narrow">
          {!done ? (
            <>
              <div className="gf-progress" aria-hidden="true">
                <span style={{ width: `${(step / steps.length) * 100}%` }} />
              </div>
              <span className="eyebrow">
                Gift finder · {step + 1} of {steps.length}
              </span>
              <h1 className="h1 gf-q" key={step}>
                {steps[step][0]}
              </h1>
              <div className="gf-opts" key={'o' + step}>
                {steps[step][1].map((o, i) => (
                  <button
                    key={o.id}
                    className={`gf-opt ${a[steps[step][2]] === o.id ? 'on' : ''} ${o.hot ? 'hot' : ''}`}
                    style={{ '--i': i }}
                    onClick={() => {
                      setA((x) => ({ ...x, [steps[step][2]]: o.id }));
                      setTimeout(() => setStep((s) => s + 1), 180);
                    }}
                  >
                    {o.emoji && <span className="gf-emoji">{o.emoji}</span>}
                    <b>{o.label}</b>
                    {o.hint && <small>{o.hint}</small>}
                    {o.hot && <small>Coming up soon</small>}
                  </button>
                ))}
              </div>
              {step > 0 && (
                <button className="link" style={{ marginTop: 26 }} onClick={() => setStep((s) => s - 1)}>
                  <Icon name="arrowL" size={16} /> Back
                </button>
              )}
            </>
          ) : (
            <div className="gf-result">
              <span className="eyebrow">Your matches</span>
              <h1 className="h1" style={{ margin: '12px 0 10px' }}>
                Gifts for <em>{results.who.label.toLowerCase()}.</em>
              </h1>
              <p className="lead">
                We suggest the <b>{results.size.name}</b> size ({results.size.dimensions}) at {money(results.size.price)} for your budget.
              </p>
              <button className="link" style={{ marginTop: 16 }} onClick={() => (setStep(0), setA({}))}>
                <Icon name="refresh" size={16} /> Start over
              </button>
            </div>
          )}
        </div>
      </section>
      {results && (
        <section className="wrap" style={{ paddingBottom: 80 }}>
          {results.templates.length > 0 && (
            <>
              <h2 className="h3" style={{ margin: '10px 0 20px' }}>
                Personalised with your photos
              </h2>
              <div className="tgrid">
                {results.templates.map((t, i) => (
                  <Link key={t.id} to={`/customize/${t.id}`} className="tcard">
                    <div className="tcard-stage">
                      <Frame ratio={{ w: 12, h: 16 }} colour="#1C1C1C" glare={false}>
                        <TemplateCanvas template={t} mini />
                      </Frame>
                    </div>
                    <b>{t.title}</b>
                    <small>{t.subtitle}</small>
                  </Link>
                ))}
              </div>
            </>
          )}
          {results.products.length > 0 && (
            <>
              <h2 className="h3" style={{ margin: '48px 0 20px' }}>
                Ready-made art they’ll love
              </h2>
              <div className="grid-products">
                {results.products.map((p, i) => (
                  <ProductCard key={p.id} product={p} categories={categories} index={i} />
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
}
