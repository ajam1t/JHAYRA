import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Frame from '../components/Frame';
import TemplateCanvas from '../components/TemplateCanvas';
import Icon from '../components/Icon';
import Reveal from '../components/Reveal';
import { Story, reduced, ripple } from '../components/Motion';
import { Seo } from '../lib/seo';
import { SITE_URL, breadcrumbLd } from '../lib/schema';
import { useTemplates, MOMENTS } from '../lib/templates';
import { money } from '../lib/site';
import { MIN_PRICE } from '../lib/frames';

const PHOTOS = [
  ['', 'Any'],
  ['1', '1 photo'],
  ['2-3', '2–3 photos'],
  ['4', '4+ photos'],
  ['0', 'Words only'],
];
const photoTest = (n, f) => (f === '1' ? n === 1 : f === '2-3' ? n >= 2 && n <= 3 : f === '4' ? n >= 4 : f === '0' ? n === 0 : true);

/* The hero studio: real couple designs, with sample names typed in live. */
const DEMO = [
  ['Aarav', 'Meera'],
  ['Kabir', 'Anaya'],
  ['Rohan', 'Isha'],
];
function LiveStudio({ templates }) {
  const demo = useMemo(() => {
    const couple = templates.filter((t) => t.textFields?.some((f) => f.id === 'name1') && t.textFields?.some((f) => f.id === 'name2'));
    const best = couple.filter((t) => t.bestSeller || t.popular);
    return (best.length >= 2 ? best : couple.length ? couple : templates).slice(0, 4);
  }, [templates]);
  const [n, setN] = useState(0);
  const [chars, setChars] = useState(99);
  const t = demo[n % (demo.length || 1)];
  const [a, b] = DEMO[n % DEMO.length];
  useEffect(() => {
    if (!demo.length || reduced()) return;
    setChars(0);
    const full = a.length + b.length;
    let c = 0;
    const type = setInterval(() => {
      c += 1;
      setChars(c);
      if (c >= full) clearInterval(type);
    }, 110);
    const next = setTimeout(() => setN((x) => x + 1), 4200);
    return () => (clearInterval(type), clearTimeout(next));
  }, [n, demo.length]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!t) return <div className="cz3-studio" aria-hidden="true" />;
  const texts = t.textFields?.some((f) => f.id === 'name1') ? { name1: a.slice(0, chars), name2: chars > a.length ? b.slice(0, chars - a.length) : '' } : {};
  return (
    <Link to={`/customize/${t.id}`} className="cz3-studio" aria-label={`Try ${t.title}`}>
      <span className="cz3-live">
        <i /> Live preview
      </span>
      <div className="cz3-studio-frame" key={t.id}>
        <Frame ratio={{ w: 12, h: 16 }} colour="#b08a45" glare={false}>
          <TemplateCanvas template={t} texts={texts} mini />
        </Frame>
      </div>
      <div className="cz3-type" aria-hidden="true">
        <span>
          <small>Name 1</small>
          {a.slice(0, chars)}
          {chars <= a.length && <b className="cz3-caret" />}
        </span>
        <span>
          <small>Name 2</small>
          {chars > a.length ? b.slice(0, chars - a.length) : ''}
          {chars > a.length && <b className="cz3-caret" />}
        </span>
      </div>
      <span className="cz3-studio-cap">
        {t.title} <Icon name="arrow" size={14} />
      </span>
    </Link>
  );
}

function Moments({ active, moment, onPick }) {
  const tiles = MOMENTS.map((m) => {
    const list = active.filter((t) => m.groups.includes(t.group));
    return { ...m, n: list.length, t: list.find((t) => t.bestSeller || t.popular) || list[0] };
  }).filter((m) => m.n > 0);
  return (
    <div className="cz3-moments" role="toolbar" aria-label="Occasion">
      {tiles.map((m, i) => (
        <button key={m.id} type="button" className="cz3-moment" aria-pressed={moment === m.id} onClick={(e) => (ripple(e), onPick(moment === m.id ? '' : m.id))} style={{ '--i': i }}>
          <span className="cz3-moment-art" aria-hidden="true">
            <Frame ratio={{ w: 12, h: 16 }} colour="#1C1C1C" glare={false} thickness={4}>
              <TemplateCanvas template={m.t} mini />
            </Frame>
          </span>
          <b>{m.label}</b>
          <small>
            {m.n} design{m.n > 1 ? 's' : ''}
          </small>
        </button>
      ))}
    </div>
  );
}

function TCard({ t, i }) {
  const n = t.slots?.length || 0;
  return (
    <Reveal delay={Math.min(i, 8) * 0.03}>
      <Link to={`/customize/${t.id}`} className="tcard cz3-card">
        <div className="tcard-stage">
          {(t.bestSeller || t.popular || t.newArrival) && <span className="pill pill-gold tcard-badge">{t.bestSeller ? 'Bestseller' : t.newArrival ? 'New' : 'Popular'}</span>}
          <span className="cz3-count" aria-hidden="true">
            <Icon name={n ? 'image' : 'edit'} size={12} /> {n || 'Aa'}
          </span>
          <Frame ratio={{ w: 12, h: 16 }} colour="#1C1C1C" glare={false}>
            <TemplateCanvas template={t} mini />
          </Frame>
          <span className="cz3-cta" aria-hidden="true">
            Personalise <Icon name="arrow" size={14} />
          </span>
        </div>
        <b>{t.title}</b>
        <small>
          {n ? `${n} photo${n > 1 ? 's' : ''}` : 'Words only'} · from {money(MIN_PRICE)}
        </small>
      </Link>
    </Reveal>
  );
}

/* Featured design styles, promoted ahead of the full catalogue. Each shows a
   real design from that style and links to all of them. */
const FEATURED = [
  { group: 'mosaic-frame', pick: 'tmpl-mosaic-heart', title: 'Mosaic Photo Frames', pitch: 'Many of your photos come together as one heart, number or letter.' },
  { group: 'moon-style', pick: 'tmpl-moon-stars', title: 'Moon & Stars', pitch: 'A night-sky design for the night that mattered — with your names.' },
  { group: 'collage-frame', pick: 'tmpl-cf-5photo', title: 'Collage Frames', pitch: 'Your favourite moments together in one frame.' },
  { group: 'calendar', pick: 'tmpl-single-photo-cal', title: 'Calendar Frames', pitch: 'Your photo above the month you’ll never forget, the date circled.' },
  { group: 'couple-frame', pick: 'tmpl-couple-wedding-frame', title: 'Couple Frames', pitch: 'Two names, one date, your favourite picture of you two.' },
  { group: 'genz', pick: 'tmpl-genz-main-character', title: 'Gen Z Quote Frames', pitch: 'Witty one-liners, framed for their wall.' },
  { group: 'names', pick: 'tmpl-name-aarav', title: 'Kids’ Name Boards', pitch: 'Bright, personalised name boards for the nursery door.' },
];
function Featured({ active, onGroup }) {
  const tiles = FEATURED.map((f) => {
    const list = active.filter((t) => t.group === f.group);
    return { ...f, n: list.length, t: list.find((t) => t.id === f.pick) || list.find((t) => t.bestSeller || t.popular) || list[0] };
  }).filter((f) => f.t);
  if (tiles.length < 3) return null;
  return (
    <section className="cz3-feat">
      <div className="wrap">
        <div className="hs-head">
          <div>
            <span className="eyebrow">Featured designs</span>
            <h2 className="hs-title">Signature styles to personalise</h2>
          </div>
        </div>
        <div className="cz3-feat-grid">
          {tiles.map((f, i) => (
            <article key={f.group} className={`cz3-feat-card${i === 0 ? ' big' : ''}`} style={{ '--i': i }}>
              <Link to={`/customize/${f.t.id}`} className="cz3-feat-art" aria-label={`Personalise ${f.t.title}`}>
                <Frame ratio={{ w: 12, h: 16 }} colour={i === 0 ? '#b08a45' : '#1C1C1C'} glare={false}>
                  <TemplateCanvas template={f.t} mini />
                </Frame>
              </Link>
              <div className="cz3-feat-copy">
                <h3>{f.title}</h3>
                <p>{f.pitch}</p>
                <div className="cz3-feat-ctas">
                  <Link to={`/customize/${f.t.id}`} className="btn btn-sm btn-gold" onPointerDown={ripple}>
                    Personalise
                  </Link>
                  {f.n > 1 && (
                    <button type="button" className="link small" onClick={() => onGroup(f.group)}>
                      See all {f.n}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Customize() {
  const [params, setParams] = useSearchParams();
  const { active, groups } = useTemplates();
  const [q, setQ] = useState('');
  const moment = params.get('moment') || '';
  const group = params.get('group') || '';
  const photos = params.get('photos') || '';

  const set = (k, v) => {
    const n = new URLSearchParams(params);
    if (k === 'moment' || k === 'group') (n.delete('moment'), n.delete('group'));
    v ? n.set(k, v) : n.delete(k);
    setParams(n, { replace: true });
  };

  const list = useMemo(() => {
    let l = active;
    const m = MOMENTS.find((x) => x.id === moment);
    if (m) l = l.filter((t) => m.groups.includes(t.group));
    if (group) l = l.filter((t) => t.group === group);
    if (photos) l = l.filter((t) => photoTest(t.slots?.length || 0, photos));
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter((t) => [t.title, t.subtitle, t.group, ...(t.occasion || []), ...(t.recipient || [])].join(' ').toLowerCase().includes(s));
    }
    return l;
  }, [active, moment, group, photos, q]);

  // Show designs in pages of 24 so the page stays short and fast on phones.
  const PAGE = 24;
  const [shown, setShown] = useState(PAGE);
  const key = `${group}|${q}|${moment}|${photos}`;
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    setShown(PAGE);
  }
  const usedGroups = groups.filter((g) => active.some((t) => t.group === g.id));
  const filtered = !!(moment || group || photos || q.trim());
  const loved = active.filter((t) => t.bestSeller).slice(0, 10);
  const mLabel = MOMENTS.find((m) => m.id === moment)?.label;

  return (
    <>
      <Seo title="Personalised Photo Frames — Design Yours Live" description={`Choose from ${active.length}+ personalised frame designs for weddings, anniversaries, birthdays, babies and festivals. Add photos, names and dates and see it live. From ${money(MIN_PRICE)}.`} path="/customize"
        jsonLd={[
          breadcrumbLd([['Home', '/'], ['Personalised frames', '/customize']]),
          { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Personalised photo frames', url: `${SITE_URL}/customize`, mainEntity: { '@type': 'ItemList', numberOfItems: active.length, itemListElement: active.slice(0, 40).map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/customize/${t.id}`, name: t.title })) } },
        ]}
      />
      <section className="cz3-hero">
        <div className="wrap cz3-hero-grid">
          <div>
            <span className="eyebrow">Create · Personalise</span>
            <h1 className="display">
              Design it. <em>See it live.</em>
            </h1>
            <p className="lead">Pick a design, drop in your photos, type your names and dates — your frame updates as you go. What you see is exactly what we craft.</p>
            <div className="cz-starts cz3-starts">
              <Link to="/customize/photo" className="cz-start" onPointerDown={ripple}>
                <span className="cz-start-ic">
                  <Icon name="image" size={24} />
                </span>
                <span>
                  <b>Frame a single photo</b>
                  <small>Upload, crop, choose size & finish</small>
                </span>
                <Icon name="arrow" />
              </Link>
              <Link to="/customize/scratch" className="cz-start" onPointerDown={ripple}>
                <span className="cz-start-ic">
                  <Icon name="sparkle" size={24} />
                </span>
                <span>
                  <b>Design from scratch</b>
                  <small>Any layout · up to 9 photos · your words</small>
                </span>
                <Icon name="arrow" />
              </Link>
              <Link to="/wall-planner" className="cz-start" onPointerDown={ripple}>
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
          <LiveStudio templates={active} />
        </div>
      </section>

      <Featured
        active={active}
        onGroup={(g) => {
          set('group', g);
          setTimeout(() => document.getElementById('designs')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
        }}
      />

      <section className="cz3-moments-wrap">
        <div className="wrap">
          <div className="hs-head">
            <div>
              <span className="eyebrow">Start with the moment</span>
              <h2 className="hs-title">What are you celebrating?</h2>
            </div>
          </div>
          <Moments active={active} moment={moment} onPick={(v) => set('moment', v)} />
        </div>
      </section>

      {!filtered && loved.length > 2 && (
        <section className="cz3-loved">
          <div className="wrap">
            <div className="hs-head">
              <div>
                <span className="eyebrow">Most loved</span>
                <h2 className="hs-title">Our bestselling designs</h2>
              </div>
            </div>
            <div className="hs-scroll cz3-rail">
              {loved.map((t, i) => (
                <TCard key={t.id} t={t} i={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {!filtered && (
        <section className="cz3-how">
          <div className="wrap">
            <span className="eyebrow">How it works</span>
            <Story
              className="cz3-story"
              steps={[
                ['Pick a design', 'Or start from a single photo, or from scratch.'],
                ['Add photos & words', 'Upload, drag to position, type names and dates — the preview updates live.'],
                ['Choose size & frame', 'Black, gold or wood, in every size we make.'],
                ['We craft & deliver', 'Handcrafted to order, dispatched in 1–2 days, free delivery across India.'],
              ]}
            />
          </div>
        </section>
      )}

      <div className="filterbar cz3-bar" id="designs">
        <div className="wrap">
          <div className="filter-row">
            <label className="cz-search">
              <Icon name="search" size={18} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: mom, travel, Diwali, 9 photos…" aria-label="Search designs" />
            </label>
            <select className="select cz3-select" value={group} onChange={(e) => set('group', e.target.value)} aria-label="Style">
              <option value="">All styles</option>
              {usedGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div className="chips scroll" role="toolbar" aria-label="Number of photos">
            {PHOTOS.map(([v, l]) => (
              <button key={v || 'any'} type="button" className="chip" aria-pressed={photos === v} onClick={() => set('photos', v)}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
      <section className="section-sm">
        <div className="wrap">
          <div className="cz3-head">
            <p className="muted small">
              {list.length} design{list.length === 1 ? '' : 's'}
              {mLabel ? ` for ${mLabel}` : ''}
            </p>
            {filtered && (
              <button type="button" className="link small" onClick={() => (setQ(''), setParams(new URLSearchParams(), { replace: true }))}>
                Clear filters
              </button>
            )}
          </div>
          <div className="tgrid">
            {list.slice(0, shown).map((t, i) => (
              <TCard key={t.id} t={t} i={i} />
            ))}
          </div>
          {list.length > shown && (
            <div className="center" style={{ marginTop: 28 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShown((n) => n + PAGE)}>
                Show more designs <span className="muted small">({list.length - shown} more)</span>
              </button>
            </div>
          )}
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
