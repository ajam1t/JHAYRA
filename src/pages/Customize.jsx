import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Frame from '../components/Frame';
import TemplateCanvas from '../components/TemplateCanvas';
import Icon from '../components/Icon';
import Reveal from '../components/Reveal';
import { Seo } from '../lib/seo';
import { useTemplates, MOMENTS } from '../lib/templates';
import { money } from '../lib/site';
import { MIN_PRICE } from '../lib/frames';

export default function Customize() {
  const [params, setParams] = useSearchParams();
  const { active, groups } = useTemplates();
  const [q, setQ] = useState('');
  const moment = params.get('moment') || '';
  const group = params.get('group') || '';

  const set = (k, v) => {
    const n = new URLSearchParams();
    if (v) n.set(k, v);
    setParams(n, { replace: true });
  };

  const list = useMemo(() => {
    let l = active;
    const m = MOMENTS.find((x) => x.id === moment);
    if (m) l = l.filter((t) => m.groups.includes(t.group));
    if (group) l = l.filter((t) => t.group === group);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter((t) => [t.title, t.subtitle, t.group, ...(t.occasion || []), ...(t.recipient || [])].join(' ').toLowerCase().includes(s));
    }
    return l;
  }, [active, moment, group, q]);

  const usedGroups = groups.filter((g) => active.some((t) => t.group === g.id));

  return (
    <>
      <Seo title="Personalised Photo Frames — Design Yours Live" description={`Choose from ${active.length}+ personalised frame designs for weddings, anniversaries, birthdays, babies and festivals. Add photos, names and dates and see it live. From ${money(MIN_PRICE)}.`} path="/customize" />
      <section className="page-hero cz-hero">
        <div className="wrap">
          <span className="eyebrow">Personalise</span>
          <h1 className="display" style={{ marginTop: 16 }}>
            Design it. <em>See it live.</em>
          </h1>
          <p className="lead">Pick a design, drop in your photos, type your names and dates — your frame updates as you go. What you see is exactly what we craft.</p>
          <div className="cz-starts">
            <Link to="/customize/photo" className="cz-start">
              <span className="cz-start-ic">
                <Icon name="image" size={24} />
              </span>
              <span>
                <b>Frame a single photo</b>
                <small>Upload, crop, choose size & finish</small>
              </span>
              <Icon name="arrow" />
            </Link>
            <Link to="/customize/scratch" className="cz-start">
              <span className="cz-start-ic">
                <Icon name="sparkle" size={24} />
              </span>
              <span>
                <b>Design from scratch</b>
                <small>Any layout · up to 9 photos · your words</small>
              </span>
              <Icon name="arrow" />
            </Link>
            <Link to="/wall-planner" className="cz-start">
              <span className="cz-start-ic">
                <Icon name="wall" size={24} />
              </span>
              <span>
                <b>Plan a gallery wall</b>
                <small>Arrange several frames together</small>
              </span>
              <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </section>
      <div className="filterbar">
        <div className="wrap">
          <div className="chips scroll" role="toolbar" aria-label="Occasion">
            <button className="chip" aria-pressed={!moment && !group} onClick={() => set('', '')}>
              All designs <span className="chip-n">{active.length}</span>
            </button>
            {MOMENTS.map((m) => (
              <button key={m.id} className="chip" aria-pressed={moment === m.id} onClick={() => set('moment', moment === m.id ? '' : m.id)}>
                {m.label}
              </button>
            ))}
          </div>
          <div className="filter-row">
            <label className="cz-search">
              <Icon name="search" size={18} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: mom, travel, Diwali, 9 photos…" aria-label="Search designs" />
            </label>
            <select className="select" style={{ width: 'auto', minHeight: 40, borderRadius: 999, fontSize: 14, padding: '6px 36px 6px 14px' }} value={group} onChange={(e) => set('group', e.target.value)} aria-label="Style">
              <option value="">All styles</option>
              {usedGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <section className="section-sm">
        <div className="wrap">
          <p className="muted small" style={{ marginBottom: 18 }}>
            {list.length} design{list.length === 1 ? '' : 's'}
          </p>
          <div className="tgrid">
            {list.map((t, i) => (
              <Reveal key={t.id} delay={Math.min(i, 8) * 0.03}>
                <Link to={`/customize/${t.id}`} className="tcard">
                  <div className="tcard-stage">
                    {(t.bestSeller || t.popular || t.newArrival) && <span className="pill pill-gold tcard-badge">{t.bestSeller ? 'Bestseller' : t.newArrival ? 'New' : 'Popular'}</span>}
                    <Frame ratio={{ w: 12, h: 16 }} colour="#1C1C1C" glare={false}>
                      <TemplateCanvas template={t} mini />
                    </Frame>
                  </div>
                  <b>{t.title}</b>
                  <small>
                    {t.slots?.length ? `${t.slots.length} photo${t.slots.length > 1 ? 's' : ''}` : 'Words only'} · from {money(MIN_PRICE)}
                  </small>
                </Link>
              </Reveal>
            ))}
          </div>
          {!list.length && (
            <div className="empty">
              <p className="muted">No designs match — try “Design from scratch” and make exactly what you want.</p>
              <Link to="/customize/scratch" className="btn" style={{ marginTop: 18 }}>
                Design from scratch
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
