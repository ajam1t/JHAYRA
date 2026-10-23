import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Frame from '../components/Frame';
import Img from '../components/Img';
import Icon, { WhatsAppGlyph } from '../components/Icon';
import TemplateCanvas, { SKYLINES } from '../components/TemplateCanvas';
import { WorldTile, useWorldCounts } from '../components/WorldTile';
import { Seo } from '../lib/seo';
import { useProducts } from '../lib/catalog';
import { useTemplates } from '../lib/templates';
import { WORLDS, WORLD_MAP, FAITHS, DIRECTIONS, matchProducts, worldProducts, worldTemplates } from '../lib/worlds';
import { FESTIVALS, daysUntil } from '../lib/festivals';
import { thoughtOfTheDay, frameThoughtLink } from '../lib/thoughts';
import { SIZES, MIN_PRICE } from '../lib/frames';
import { money, waLink, SITE } from '../lib/site';

/* ── Shared pieces ────────────────────────────────────────────────────── */
function toItems(products = [], templates = []) {
  return [
    ...products.map((p) => ({ key: p.id, kind: 'p', title: p.name, price: p.price || MIN_PRICE, to: `/product/${p.id}`, img: p.thumbnail, p })),
    ...templates.map((t) => ({ key: t.id, kind: 't', title: t.title, price: MIN_PRICE, to: `/customize/${t.id}`, t })),
  ];
}

function Art({ item, ratio = { w: 12, h: 16 }, colour = '#1C1C1C', sizes = '(max-width: 760px) 45vw, 22vw', glare = false, thickness }) {
  return (
    <Frame src={item.kind === 'p' ? item.img : undefined} alt={item.title} ratio={ratio} colour={colour} glare={glare} sizes={sizes} thickness={thickness}>
      {item.kind === 't' ? <TemplateCanvas template={item.t} mini /> : null}
    </Frame>
  );
}

function Caption({ item, className = '' }) {
  return (
    <span className={`w-cap ${className}`}>
      <b>{item.title}</b>
      <span>{item.kind === 't' ? `Personalise · from ${money(item.price)}` : `from ${money(item.price)}`}</span>
    </span>
  );
}

function Soon({ w, what }) {
  const msg = `Hi JHAYRA! Please tell me when the ${what || w.title} collection launches.`;
  return (
    <div className="w-soon">
      <span className="w-soon-tag">Launching soon</span>
      <h2>{what || w.title} is being curated.</h2>
      <p>We’re selecting the first pieces for this collection. Get a WhatsApp message the day it opens — or tell us exactly what you’d love on your wall.</p>
      <div className="w-soon-ctas">
        <a className="btn btn-gold" href={waLink(msg)} target="_blank" rel="noopener noreferrer">
          <WhatsAppGlyph size={18} /> Notify me on WhatsApp
        </a>
        <Link to="/worlds" className="btn btn-ghost">
          Explore other worlds
        </Link>
      </div>
    </div>
  );
}

function Grid({ items, className = '', render }) {
  return <div className={`w-grid ${className}`}>{items.map((it, i) => render(it, i))}</div>;
}

/* ── 1 · Manga ────────────────────────────────────────────────────────── */
function Manga({ w, items }) {
  return (
    <>
      <header className="d-manga-hero">
        <div className="wrap">
          <span className="d-manga-tag">Vol. 01</span>
          <h1>
            <span className="d-manga-bubble">{w.title}!</span>
          </h1>
          <p>{w.line}</p>
          <p className="d-manga-note">All artwork is original anime-style art — no copied characters.</p>
        </div>
      </header>
      <section className="wrap section-sm">
        {items.length ? (
          <div className="d-manga-grid">
            {items.map((it, i) => (
              <Link key={it.key} to={it.to} className={`d-manga-panel s${i % 5}`}>
                <Art item={it} />
                <Caption item={it} className="d-manga-cap" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="d-manga-grid">
            <div className="d-manga-panel s0 d-manga-empty">
              <span className="d-manga-bubble small">Chapter 1 — coming soon!</span>
            </div>
            <div className="d-manga-panel s1 d-manga-lines" />
            <div className="d-manga-panel s2 d-manga-lines" />
            <div className="w-span">
              <Soon w={w} />
            </div>
          </div>
        )}
      </section>
    </>
  );
}

/* ── 2 · Sticker board (Gen Z) ────────────────────────────────────────── */
function Sticker({ w, items }) {
  const lines = items.filter((x) => x.kind === 't').map((x) => x.t.textFields?.[0]?.defaultValue).filter(Boolean);
  return (
    <>
      <header className="d-sticker-hero">
        <div className="wrap">
          <span className="d-sticker-pill">new drop</span>
          <h1>{w.kicker.toLowerCase()}.</h1>
          <p>{w.line}</p>
        </div>
        {lines.length > 0 && (
          <div className="d-sticker-ticker" aria-hidden="true">
            <div>
              {[...lines, ...lines].map((l, i) => (
                <span key={i}>{l}</span>
              ))}
            </div>
          </div>
        )}
      </header>
      <section className="wrap section-sm">
        {items.length ? (
          <div className="d-sticker-board">
            {items.map((it, i) => (
              <Link key={it.key} to={it.to} className="d-sticker" style={{ '--r': `${((i * 37) % 9) - 4}deg` }}>
                <Art item={it} ratio={{ w: 12, h: 15 }} />
                <Caption item={it} />
              </Link>
            ))}
          </div>
        ) : (
          <Soon w={w} />
        )}
      </section>
    </>
  );
}

/* ── 3 · Divine ───────────────────────────────────────────────────────── */
function Divine({ w, products, templates }) {
  const [faith, setFaith] = useState('hindu');
  const [deity, setDeity] = useState('');
  const f = FAITHS.find((x) => x.id === faith);
  let list = faith === 'hindu' ? matchProducts(products, { cats: f.cats, words: [] }).filter((p) => p.category === 'religious' || /om|lotus|vastu/i.test(p.name)) : matchProducts(products, { cats: f.cats, words: f.words });
  const d = f.deities?.find((x) => x.id === deity);
  if (d) list = matchProducts(products, { words: d.words });
  const items = toItems(list, faith === 'hindu' && !deity ? templates : []);
  const q = thoughtOfTheDay();
  return (
    <>
      <header className="d-divine-hero">
        <div className="d-divine-glow" aria-hidden="true" />
        <div className="wrap">
          <span className="eyebrow">{w.kicker}</span>
          <h1 className="display">{w.title}</h1>
          <p className="lead">{w.line}</p>
          <div className="d-divine-faiths" role="tablist" aria-label="Faith">
            {FAITHS.map((x) => (
              <button key={x.id} role="tab" aria-selected={x.id === faith} onClick={() => (setFaith(x.id), setDeity(''))}>
                <span className="d-divine-sym" aria-hidden="true">
                  {x.symbol}
                </span>
                {x.label}
              </button>
            ))}
          </div>
          <p className="d-divine-thought">
            <span>Thought of the day</span>“{q.text}” <small>— {q.source}</small>{' '}
            <Link to={frameThoughtLink(q)} className="link">
              Frame it <Icon name="arrow" size={14} />
            </Link>
          </p>
        </div>
      </header>
      <section className="wrap section-sm">
        {f.deities && (
          <div className="chips scroll d-divine-deities" aria-label="Deity">
            <button className="chip" aria-pressed={!deity} onClick={() => setDeity('')}>
              All
            </button>
            {f.deities.map((x) => {
              const n = matchProducts(products, { words: x.words }).length;
              return (
                <button key={x.id} className="chip" aria-pressed={deity === x.id} onClick={() => setDeity(x.id)} disabled={!n}>
                  {x.label} <span className="chip-n">{n || 'soon'}</span>
                </button>
              );
            })}
          </div>
        )}
        {items.length ? (
          <div className="d-divine-grid">
            {items.map((it) => (
              <Link key={it.key} to={it.to} className="d-arch">
                <div className="d-arch-window">
                  <Art item={it} ratio={{ w: 12, h: 16 }} />
                </div>
                <Caption item={it} />
              </Link>
            ))}
          </div>
        ) : (
          <Soon w={w} what={`${f.label} devotional art`} />
        )}
      </section>
    </>
  );
}

/* ── 4 · Festival timeline ────────────────────────────────────────────── */
function Timeline({ w, items, templates }) {
  const upcoming = FESTIVALS.filter((f) => daysUntil(f) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);
  const forFest = (f) => templates.find((t) => t.title.toLowerCase().includes(f.name.split(' ')[0].toLowerCase().replace('’s', '')));
  return (
    <>
      <header className="d-time-hero">
        <div className="wrap">
          <span className="eyebrow">{w.kicker}</span>
          <h1 className="display">{w.title}</h1>
          <p className="lead">{w.line}</p>
        </div>
        <div className="d-time-rail" role="list">
          {upcoming.map((f) => {
            const t = forFest(f);
            const days = daysUntil(f);
            const date = new Date(f.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            return (
              <div key={f.id} className="d-time-stop" role="listitem" style={{ '--c': f.theme.accent }}>
                <span className="d-time-dot" />
                <small>
                  {f.verify ? '≈ ' : ''}
                  {date}
                </small>
                <b>{f.name}</b>
                <span>{days === 0 ? 'Today' : `${days} days`}</span>
                {t ? (
                  <Link to={`/customize/${t.id}`} className="link">
                    Personalise <Icon name="arrow" size={14} />
                  </Link>
                ) : (
                  <Link to="/customize?moment=festivals" className="link">
                    Gift ideas <Icon name="arrow" size={14} />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
        <p className="wrap small d-time-note">≈ Festival dates follow the lunar calendar and may shift by a day.</p>
      </header>
      <section className="wrap section-sm">
        {items.length ? <Grid items={items} className="w-grid-4" render={(it) => <Link key={it.key} to={it.to} className="w-card"><Art item={it} /><Caption item={it} /></Link>} /> : <Soon w={w} />}
      </section>
    </>
  );
}

/* ── 5 · Window view (scenery) ────────────────────────────────────────── */
const HOURS = [
  ['dawn', 'Dawn'],
  ['day', 'Day'],
  ['dusk', 'Dusk'],
  ['night', 'Night'],
];
function Window({ w, items }) {
  const [sel, setSel] = useState(0);
  const [hour, setHour] = useState('day');
  const it = items[sel];
  return (
    <>
      <header className="d-window-hero">
        <div className="wrap d-window-grid">
          <div>
            <span className="eyebrow">{w.kicker}</span>
            <h1 className="display">{w.title}</h1>
            <p className="lead">{w.line}</p>
            <div className="d-window-hours" role="group" aria-label="Time of day">
              {HOURS.map(([id, label]) => (
                <button key={id} aria-pressed={hour === id} onClick={() => setHour(id)}>
                  {label}
                </button>
              ))}
            </div>
            {it && (
              <Link to={it.to} className="btn btn-gold" style={{ marginTop: 22 }}>
                {it.title} · from {money(it.price)} <Icon name="arrow" size={16} />
              </Link>
            )}
          </div>
          {it && (
            <div className={`d-window h-${hour}`}>
              <div className="d-window-view">
                <Img src={it.img} alt={it.title} sizes="(max-width: 900px) 90vw, 50vw" width={1200} priority />
              </div>
              <span className="d-window-tint" aria-hidden="true" />
              <span className="d-window-mullion v" aria-hidden="true" />
              <span className="d-window-mullion h" aria-hidden="true" />
              <span className="d-window-sill" aria-hidden="true" />
            </div>
          )}
        </div>
      </header>
      <section className="wrap section-sm">
        <div className="d-window-strip">
          {items.map((x, i) => (
            <button key={x.key} className={i === sel ? 'on' : ''} onClick={() => setSel(i)} aria-label={`View ${x.title}`}>
              <Img src={x.img} alt="" sizes="160px" width={320} />
              <span>{x.title}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

/* ── 6 · White-cube gallery ───────────────────────────────────────────── */
function Gallery({ w, items }) {
  return (
    <>
      <header className="d-gallery-hero wrap">
        <span className="d-gallery-room">Room {String(WORLDS.indexOf(w) + 1).padStart(2, '0')}</span>
        <h1>{w.title}</h1>
        <p>{w.line}</p>
      </header>
      <section className="d-gallery-wall">
        <div className="wrap d-gallery-row">
          {items.map((it, i) => (
            <Link key={it.key} to={it.to} className="d-gallery-work" style={{ '--h': `${[300, 360, 280, 340][i % 4]}px` }}>
              <div className="d-gallery-light" aria-hidden="true" />
              <div className="d-gallery-art">
                <Art item={it} ratio={{ w: 12, h: 15 }} thickness={2.6} />
              </div>
              <div className="d-gallery-plaque">
                <b>{it.title}</b>
                <span>{it.p?.category?.replace(/-/g, ' ') || 'Personalised'} · print, black frame</span>
                <span>from {money(it.price)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

/* ── 7 · Heritage (premium) ───────────────────────────────────────────── */
function Heritage({ w, items }) {
  return (
    <>
      <header className="d-heritage-hero">
        <div className="wrap">
          <span className="d-heritage-kicker">{w.kicker}</span>
          <h1>
            Mithila <em>Heritage</em>
          </h1>
          <span className="d-heritage-rule" aria-hidden="true" />
          <p>{w.line}</p>
        </div>
      </header>
      <section className="d-heritage-story">
        <div className="wrap d-heritage-cols">
          <div>
            <h2>A living tradition</h2>
            <p>Mithila painting comes from the Mithila region of Bihar and Nepal, where it was traditionally painted by women on the walls and floors of homes for weddings and festivals. Fish, peacocks, lotus, the sun and the moon are among its best-loved motifs, drawn in fine double lines and filled with bold natural colour.</p>
          </div>
          <ul className="d-heritage-promise">
            <li>
              <b>Original</b> hand-painted works, not prints
            </li>
            <li>
              <b>Signed</b> by the artist, with their story
            </li>
            <li>
              <b>Certificate</b> of authenticity with every piece
            </li>
            <li>
              <b>Commissions</b> in your size and colours
            </li>
          </ul>
        </div>
      </section>
      <section className="wrap section-sm">
        {items.length ? (
          <div className="d-heritage-grid">
            {items.map((it) => (
              <Link key={it.key} to={it.to} className="d-heritage-piece">
                <div className="d-heritage-mount">
                  <Art item={it} ratio={{ w: 12, h: 16 }} />
                </div>
                <b>{it.title}</b>
                <span>from {money(it.price)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="d-heritage-soon">
            <Soon w={w} what="Mithila Heritage" />
            <a className="link" href={waLink('Hi JHAYRA! I would like to commission a Mithila painting.')} target="_blank" rel="noopener noreferrer">
              Or commission a painting now <Icon name="arrow" size={15} />
            </a>
          </div>
        )}
      </section>
    </>
  );
}

/* ── 8 · Vastu compass ────────────────────────────────────────────────── */
function Compass({ w, products }) {
  const [dir, setDir] = useState('N');
  const d = DIRECTIONS.find((x) => x.id === dir);
  const items = toItems(matchProducts(products, d), []);
  return (
    <>
      <header className="d-compass-hero">
        <div className="wrap d-compass-grid">
          <div>
            <span className="eyebrow">{w.kicker}</span>
            <h1 className="display">{w.title}</h1>
            <p className="lead">{w.line}</p>
            <div className="d-compass-read" aria-live="polite">
              <b>
                {d.label} · {d.idea}
              </b>
              <p>{d.note}</p>
            </div>
            <p className="small d-compass-note">Traditional guidance for inspiration — not a substitute for a Vastu consultant.</p>
          </div>
          <div className="d-compass" role="radiogroup" aria-label="Wall direction">
            <span className="d-compass-needle" style={{ '--a': `${DIRECTIONS.indexOf(d) * 45}deg` }} aria-hidden="true" />
            {DIRECTIONS.map((x, i) => (
              <button key={x.id} role="radio" aria-checked={x.id === dir} aria-label={x.label} className="d-compass-pt" style={{ '--a': `${i * 45}deg` }} onClick={() => setDir(x.id)}>
                {x.id}
              </button>
            ))}
            <span className="d-compass-centre" aria-hidden="true">
              वास्तु
            </span>
          </div>
        </div>
      </header>
      <section className="wrap section-sm">
        <h2 className="h3" style={{ marginBottom: 18 }}>
          For your {d.label.toLowerCase()} wall
        </h2>
        {items.length ? <Grid items={items} className="w-grid-4" render={(it) => <Link key={it.key} to={it.to} className="w-card"><Art item={it} /><Caption item={it} /></Link>} /> : <p className="muted">We’re adding pieces for this direction — try another wall.</p>}
      </section>
    </>
  );
}

/* ── 9 · Polaroids on string lights ───────────────────────────────────── */
function Polaroid({ w, items }) {
  return (
    <>
      <header className="d-polaroid-hero">
        <div className="wrap">
          <span className="eyebrow">{w.kicker}</span>
          <h1 className="display">{w.title}</h1>
          <p className="lead">{w.line}</p>
        </div>
      </header>
      <section className="d-polaroid-wall">
        <div className="wrap d-polaroid-line">
          {items.map((it, i) => (
            <Link key={it.key} to={it.to} className="d-polaroid" style={{ '--r': `${((i * 53) % 11) - 5}deg` }}>
              <span className="d-pin" aria-hidden="true" />
              <div className="d-polaroid-img">
                <Art item={it} ratio={{ w: 12, h: 13 }} thickness={2} />
              </div>
              <span className="d-polaroid-cap">{it.title}</span>
              <span className="d-polaroid-price">from {money(it.price)}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

/* ── 10 · Bubbles (kids) ──────────────────────────────────────────────── */
function Bubbles({ w, items }) {
  return (
    <>
      <header className="d-bubbles-hero">
        <span className="d-blob b1" aria-hidden="true" />
        <span className="d-blob b2" aria-hidden="true" />
        <span className="d-blob b3" aria-hidden="true" />
        <div className="wrap">
          <span className="eyebrow">{w.kicker}</span>
          <h1 className="display">{w.title}</h1>
          <p className="lead">{w.line}</p>
        </div>
      </header>
      <section className="wrap section-sm">
        <Grid
          items={items}
          className="w-grid-4"
          render={(it, i) => (
            <Link key={it.key} to={it.to} className="d-bubble-card" style={{ '--c': ['#ffd9cf', '#d8ecff', '#e6dcff', '#d7f3e3', '#fff1b8'][i % 5] }}>
              <Art item={it} />
              <Caption item={it} />
            </Link>
          )}
        />
      </section>
    </>
  );
}

/* ── 11 · Paw trail ───────────────────────────────────────────────────── */
function Paws({ w, items }) {
  return (
    <>
      <header className="d-paws-hero">
        <div className="wrap">
          <span className="eyebrow">{w.kicker}</span>
          <h1 className="display">{w.title}</h1>
          <p className="lead">{w.line}</p>
        </div>
      </header>
      <section className="wrap section-sm d-paws-trail">
        {items.map((it, i) => (
          <Link key={it.key} to={it.to} className={`d-paw-stop ${i % 2 ? 'right' : 'left'}`}>
            <span className="d-paw-prints" aria-hidden="true">
              🐾
            </span>
            <div className="d-paw-art">
              <Art item={it} />
            </div>
            <Caption item={it} />
          </Link>
        ))}
      </section>
    </>
  );
}

/* ── 12 · Ticker (motivation) ─────────────────────────────────────────── */
function Ticker({ w, items }) {
  const words = ['DREAM', 'BUILD', 'SHIP', 'REPEAT', 'FOCUS', 'GROW'];
  return (
    <>
      <header className="d-ticker-hero">
        <div className="d-ticker-band" aria-hidden="true">
          <div>
            {[...words, ...words, ...words].map((x, i) => (
              <span key={i}>{x}</span>
            ))}
          </div>
        </div>
        <div className="wrap">
          <h1>{w.title}</h1>
          <p>{w.line}</p>
        </div>
      </header>
      <section className="wrap section-sm">
        <Grid items={items} className="w-grid-3" render={(it) => <Link key={it.key} to={it.to} className="w-card d-ticker-card"><Art item={it} /><Caption item={it} /></Link>} />
      </section>
    </>
  );
}

/* ── 13 · Speed lines (horses) ────────────────────────────────────────── */
function Speed({ w, items }) {
  return (
    <>
      <header className="d-speed-hero">
        <div className="d-speed-lines" aria-hidden="true" />
        <div className="wrap">
          <span className="eyebrow">{w.kicker}</span>
          <h1 className="display">{w.title}</h1>
          <p className="lead">{w.line}</p>
        </div>
      </header>
      <section className="d-speed-track">
        <div className="wrap d-speed-row">
          {items.map((it) => (
            <Link key={it.key} to={it.to} className="d-speed-card">
              <Art item={it} ratio={{ w: 16, h: 12 }} />
              <Caption item={it} />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

/* ── 14 · Family tree ─────────────────────────────────────────────────── */
function Tree({ w, items }) {
  return (
    <>
      <header className="d-tree-hero">
        <div className="wrap center">
          <span className="eyebrow center">{w.kicker}</span>
          <h1 className="display">{w.title}</h1>
          <p className="lead">{w.line}</p>
        </div>
      </header>
      <section className="wrap section-sm d-tree">
        <span className="d-tree-trunk" aria-hidden="true" />
        {items.map((it, i) => (
          <Link key={it.key} to={it.to} className={`d-tree-leaf ${i % 2 ? 'r' : 'l'}`}>
            <span className="d-tree-branch" aria-hidden="true" />
            <div className="d-tree-art">
              <Art item={it} />
            </div>
            <Caption item={it} />
          </Link>
        ))}
      </section>
    </>
  );
}

/* ── 15 · Invitation (wedding) ────────────────────────────────────────── */
function Invite({ w, items }) {
  return (
    <>
      <header className="d-invite-hero">
        <div className="d-invite-card">
          <span className="d-invite-orn" aria-hidden="true">
            ❦
          </span>
          <small>{w.kicker}</small>
          <h1>
            Together with their families,
            <br />
            <em>you are invited</em>
            <br />
            to frame forever.
          </h1>
          <p>{w.line}</p>
        </div>
      </header>
      <section className="wrap section-sm">
        <Grid
          items={items}
          className="w-grid-4"
          render={(it) => (
            <Link key={it.key} to={it.to} className="d-invite-item">
              <Art item={it} />
              <Caption item={it} />
            </Link>
          )}
        />
      </section>
    </>
  );
}

/* ── 16 · Contact sheet (photography) ─────────────────────────────────── */
function Film({ w, items }) {
  return (
    <>
      <header className="d-film-hero">
        <div className="wrap">
          <span className="d-film-meta">ISO 400 · {items.length} frames</span>
          <h1>{w.title}</h1>
          <p>{w.line}</p>
        </div>
      </header>
      <section className="d-film-sheet">
        <div className="wrap d-film-strip">
          {items.map((it, i) => (
            <Link key={it.key} to={it.to} className={`d-film-frame ${i === 0 ? 'pick' : ''}`}>
              <span className="d-film-no">{String(i + 1).padStart(2, '0')}A</span>
              <div className="d-film-img">{it.img ? <Img src={it.img} alt={it.title} sizes="(max-width: 760px) 45vw, 22vw" /> : <Art item={it} />}</div>
              <Caption item={it} />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

/* ── 17 · Chalkboard (desi) ───────────────────────────────────────────── */
function Chalk({ w, items }) {
  return (
    <>
      <header className="d-chalk-hero">
        <div className="wrap">
          <span className="d-chalk-menu">Aaj ka special</span>
          <h1>{w.title}</h1>
          <p>{w.line}</p>
        </div>
      </header>
      <section className="wrap section-sm">
        {items.length ? <Grid items={items} className="w-grid-4" render={(it) => <Link key={it.key} to={it.to} className="w-card d-chalk-card"><Art item={it} ratio={{ w: 12, h: 15 }} /><Caption item={it} /></Link>} /> : <Soon w={w} />}
      </section>
    </>
  );
}

/* ── 18 · Swiss grid (minimal) ────────────────────────────────────────── */
function Swiss({ w, items }) {
  return (
    <>
      <header className="d-swiss-hero wrap">
        <div className="d-swiss-head">
          <span className="d-swiss-sq" aria-hidden="true" />
          <h1>{w.title}.</h1>
        </div>
        <p>{w.line}</p>
      </header>
      <section className="wrap section-sm">
        <div className="d-swiss-grid">
          {items.map((it, i) => (
            <Link key={it.key} to={it.to} className="d-swiss-cell">
              <span className="d-swiss-n">{String(i + 1).padStart(2, '0')}</span>
              <Art item={it} ratio={{ w: 12, h: 15 }} thickness={2.6} />
              <Caption item={it} />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

/* ── 19 · Price ladder (gifts) ────────────────────────────────────────── */
function Ladder({ w, items }) {
  const prods = items.filter((x) => x.kind === 'p');
  return (
    <>
      <header className="d-ladder-hero wrap">
        <span className="eyebrow">{w.kicker}</span>
        <h1 className="display">{w.title}</h1>
        <p className="lead">{w.line}</p>
      </header>
      <section className="wrap section-sm d-ladder">
        {SIZES.map((s, i) => (
          <div key={s.slug} className="d-step" style={{ '--i': i }}>
            <div className="d-step-head">
              <b>{money(s.price)}</b>
              <span>
                {s.name} · {s.dimensions}
              </span>
              <span className="d-step-size" style={{ width: (s.w / 36) * 60, height: (s.h / 36) * 60 }} aria-hidden="true" />
            </div>
            <div className="d-step-picks">
              {prods.slice(i * 2, i * 2 + 2).map((it) => (
                <Link key={it.key} to={`${it.to}?size=${s.slug}`} className="w-card">
                  <Art item={it} />
                  <span className="w-cap">
                    <b>{it.title}</b>
                    <span>
                      {s.name} · {money(s.price)}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
        <p className="small muted">Every design comes in all four sizes — pick any piece and choose its size on the product page.</p>
      </section>
    </>
  );
}

/* ── 20 · Map (travel) ────────────────────────────────────────────────── */
const PINS = [
  ['Manali', 22, 12],
  ['Jaipur', 26, 34],
  ['Varanasi', 52, 36],
  ['Darjeeling', 70, 30],
  ['Goa', 24, 66],
  ['Kerala', 34, 86],
];
function MapWorld({ w, items }) {
  return (
    <>
      <header className="d-map-hero">
        <div className="wrap d-map-grid">
          <div>
            <span className="eyebrow">{w.kicker}</span>
            <h1 className="display">{w.title}</h1>
            <p className="lead">{w.line}</p>
          </div>
          <div className="d-map" aria-hidden="true">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M22 12 Q 26 24 26 34 T 52 36 T 70 30" />
              <path d="M26 34 Q 22 50 24 66 T 34 86" />
            </svg>
            {PINS.map(([name, x, y]) => (
              <span key={name} className="d-pin-map" style={{ left: `${x}%`, top: `${y}%` }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </header>
      <section className="wrap section-sm">
        <Grid items={items} className="w-grid-4" render={(it) => <Link key={it.key} to={it.to} className="w-card d-map-card"><Art item={it} /><Caption item={it} /></Link>} />
      </section>
    </>
  );
}

/* ── Live builders (jersey, city, name board) ─────────────────────────── */
const fill = (t, texts) => `/customize/${t.id}?` + Object.entries(texts).map(([k, v]) => `text.${k}=${encodeURIComponent(v)}`).join('&');
const def = (t, id) => t.textFields.find((f) => f.id === id)?.defaultValue || '';

function Preview({ t, texts, label }) {
  return (
    <div className="w-preview" aria-label={label}>
      <Frame ratio={{ w: 12, h: 16 }} colour="#1C1C1C" thickness={3} glare>
        <TemplateCanvas template={t} texts={texts} />
      </Frame>
    </div>
  );
}

function Swatches({ list, value, onChange, label, colourOf, nameOf }) {
  return (
    <div className="w-swatches" role="radiogroup" aria-label={label}>
      {list.map((t) => (
        <button key={t.id} type="button" role="radio" aria-checked={t.id === value} aria-label={nameOf(t)} title={nameOf(t)} onClick={() => onChange(t.id)} style={{ '--sw': colourOf(t) }} />
      ))}
    </div>
  );
}

function ItemGrid({ items, className = '' }) {
  return <Grid items={items} className={`w-grid-4 ${className}`} render={(it) => <Link key={it.key} to={it.to} className="w-card"><Art item={it} /><Caption item={it} /></Link>} />;
}

/* ── 21 · Stadium (sports) ────────────────────────────────────────────── */
function Stadium({ w, items, templates }) {
  const jerseys = templates.filter((t) => t.decoratives?.includes('jersey'));
  const [jid, setJid] = useState(jerseys[0]?.id);
  const [name, setName] = useState('');
  const [no, setNo] = useState('');
  const j = jerseys.find((x) => x.id === jid) || jerseys[0];
  const texts = j ? { name: (name || def(j, 'name')).toUpperCase(), number: no || def(j, 'number'), sign: def(j, 'sign') } : {};
  return (
    <>
      <header className="d-stadium-hero">
        <span className="d-flood l" aria-hidden="true" />
        <span className="d-flood r" aria-hidden="true" />
        <div className="wrap">
          <span className="eyebrow">{w.kicker}</span>
          <h1 className="display">{w.title}</h1>
          <p className="lead">{w.line}</p>
          <div className="d-stadium-board" aria-label="At a glance">
            <span>
              <small>Jerseys</small>
              <b>{String(jerseys.length).padStart(2, '0')}</b>
            </span>
            <span>
              <small>Quotes</small>
              <b>{String(templates.length - jerseys.length).padStart(2, '0')}</b>
            </span>
            <span>
              <small>From</small>
              <b>{money(MIN_PRICE)}</b>
            </span>
          </div>
        </div>
      </header>
      {j && (
        <section className="wrap section-sm w-builder d-stadium-builder">
          <div className="w-builder-form">
            <h2 className="h3">Build your jersey</h2>
            <label className="w-field">
              Name on the back
              <input className="input" value={name} maxLength={12} placeholder={def(j, 'name')} onChange={(e) => setName(e.target.value.replace(/[^\p{L} .'-]/gu, ''))} />
            </label>
            <label className="w-field">
              Number
              <input className="input" inputMode="numeric" value={no} maxLength={3} placeholder={def(j, 'number')} onChange={(e) => setNo(e.target.value.replace(/\D/g, ''))} />
            </label>
            <span className="w-field">Jersey colour</span>
            <Swatches list={jerseys} value={j.id} onChange={setJid} label="Jersey colour" colourOf={(t) => t.colors?.color} nameOf={(t) => t.title.replace('Home Jersey — ', '')} />
            <Link to={fill(j, texts)} className="btn btn-gold">
              Personalise this jersey · from {money(MIN_PRICE)} <Icon name="arrow" size={16} />
            </Link>
          </div>
          <Preview t={j} texts={texts} label="Jersey preview" />
        </section>
      )}
      <section className="wrap section-sm">{items.length ? <ItemGrid items={items} /> : <Soon w={w} />}</section>
    </>
  );
}

/* ── 22 · Skyline (cities) ────────────────────────────────────────────── */
function Skyline({ w, items, templates }) {
  const cities = templates.filter((t) => t.decoratives?.includes('skyline'));
  const [cid, setCid] = useState(cities[0]?.id);
  const [own, setOwn] = useState('');
  const c = cities.find((x) => x.id === cid) || cities[0];
  const texts = c ? (own.trim() ? { name: own.trim(), tagline: 'Where my story began', coords: '' } : { name: def(c, 'name'), tagline: def(c, 'tagline'), coords: def(c, 'coords') }) : {};
  return (
    <>
      <header className="d-sky-hero">
        <div className="wrap">
          <span className="eyebrow">{w.kicker}</span>
          <h1 className="display">{w.title}</h1>
          <p className="lead">{w.line}</p>
        </div>
        <div className="d-sky-layers" aria-hidden="true">
          {SKYLINES.map(([vb, d], i) => (
            <svg key={i} className={`d-sky-l l${i}`} viewBox={vb} preserveAspectRatio="none">
              <path d={d} />
            </svg>
          ))}
        </div>
      </header>
      {c && (
        <section className="wrap section-sm w-builder">
          <div className="w-builder-form">
            <h2 className="h3">Pick your city</h2>
            <div className="chips d-sky-chips" role="radiogroup" aria-label="City">
              {cities.map((t) => (
                <button key={t.id} type="button" role="radio" className="chip" aria-checked={!own && t.id === c.id} onClick={() => (setCid(t.id), setOwn(''))}>
                  {def(t, 'name')}
                </button>
              ))}
            </div>
            <label className="w-field">
              Not on the list? Type any city or town
              <input className="input" value={own} maxLength={16} placeholder="e.g. Madhubani" onChange={(e) => setOwn(e.target.value)} />
            </label>
            <Link to={fill(c, texts)} className="btn btn-gold">
              Personalise {texts.name} · from {money(MIN_PRICE)} <Icon name="arrow" size={16} />
            </Link>
            <p className="small muted">Edit the tagline and add coordinates or a special date on the next step.</p>
          </div>
          <Preview t={c} texts={texts} label="City frame preview" />
        </section>
      )}
      <section className="wrap section-sm">{items.length ? <ItemGrid items={items} /> : <Soon w={w} />}</section>
    </>
  );
}

/* ── 23 · Alphabet blocks (name boards) ───────────────────────────────── */
function Blocks({ w, items, templates }) {
  const boards = templates.filter((t) => t.decoratives?.includes('name-board'));
  const [bid, setBid] = useState(boards[0]?.id);
  const [name, setName] = useState('');
  const [meaning, setMeaning] = useState('');
  const [born, setBorn] = useState('');
  const b = boards.find((x) => x.id === bid) || boards[0];
  const typed = name.trim();
  const texts = b ? (typed ? { name: typed, meaning, born } : { name: def(b, 'name'), meaning: def(b, 'meaning'), born: def(b, 'born') }) : {};
  const letters = [...(texts.name || 'NAME')].slice(0, 12);
  return (
    <>
      <header className="d-blocks-hero">
        <div className="wrap">
          <span className="eyebrow">{w.kicker}</span>
          <h1 className="display">{w.title}</h1>
          <p className="lead">{w.line}</p>
          <div className="d-blocks-row" aria-hidden="true">
            {letters.map((ch, i) => (
              <span key={`${ch}${i}`} className="d-block" style={{ '--c': (b?.rainbow || ['#e2603f'])[i % 4], '--i': i }}>
                {ch.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </header>
      {b && (
        <section className="wrap section-sm w-builder">
          <div className="w-builder-form">
            <h2 className="h3">Make their name board</h2>
            <label className="w-field">
              Child’s name
              <input className="input" value={name} maxLength={12} placeholder={def(b, 'name')} onChange={(e) => setName(e.target.value)} />
            </label>
            {typed && (
              <>
                <label className="w-field">
                  Meaning (optional)
                  <input className="input" value={meaning} maxLength={40} placeholder="e.g. Light · Joy" onChange={(e) => setMeaning(e.target.value)} />
                </label>
                <label className="w-field">
                  Birth details (optional)
                  <input className="input" value={born} maxLength={40} placeholder="e.g. Born 14 March 2025" onChange={(e) => setBorn(e.target.value)} />
                </label>
              </>
            )}
            <span className="w-field">Colours</span>
            <Swatches list={boards} value={b.id} onChange={setBid} label="Colours" colourOf={(t) => `conic-gradient(${t.rainbow.join(',')})`} nameOf={(t) => `${t.title.replace('Name Board — ', '')} palette`} />
            <Link to={fill(b, texts)} className="btn btn-gold">
              Personalise {texts.name}’s board · from {money(MIN_PRICE)} <Icon name="arrow" size={16} />
            </Link>
          </div>
          <Preview t={b} texts={texts} label="Name board preview" />
        </section>
      )}
      {!b && (
        <section className="wrap section-sm">
          <Soon w={w} />
        </section>
      )}
      {b && items.some((x) => x.kind === 'p') && (
        <section className="wrap section-sm">
          <ItemGrid items={items.filter((x) => x.kind === 'p')} />
        </section>
      )}
    </>
  );
}

const DESIGNS = { manga: Manga, sticker: Sticker, divine: Divine, timeline: Timeline, window: Window, gallery: Gallery, heritage: Heritage, compass: Compass, polaroid: Polaroid, bubbles: Bubbles, paws: Paws, ticker: Ticker, speed: Speed, tree: Tree, invite: Invite, film: Film, chalk: Chalk, swiss: Swiss, ladder: Ladder, map: MapWorld, stadium: Stadium, skyline: Skyline, blocks: Blocks };

/* ── Hub ──────────────────────────────────────────────────────────────── */
function Hub() {
  const counts = useWorldCounts();
  return (
    <>
      <Seo title="Worlds — Anime, Divine, Gen Z Quotes, Scenery & More" description="JHAYRA worlds: anime, Gen Z and desi quotes, divine art for every faith, festivals, scenery, Mithila heritage, Vastu, sports, city love, kids’ name boards and more." path="/worlds" />
      <section className="wrap page-hero">
        <span className="eyebrow">Worlds</span>
        <h1 className="display" style={{ marginTop: 16, maxWidth: '12ch' }}>
          {WORLDS.length} worlds. <em>One for you.</em>
        </h1>
        <p className="lead" style={{ marginTop: 16 }}>
          From anime to Mithila heritage, chai-tapri quotes to the divine — every world has its own look. Wander in.
        </p>
      </section>
      <section className="wrap whub" style={{ paddingBottom: 90 }}>
        {WORLDS.map((w) => (
          <WorldTile key={w.id} w={w} count={counts[w.id]} />
        ))}
      </section>
    </>
  );
}

function WorldPage({ w }) {
  const { data: products } = useProducts();
  const { active } = useTemplates();
  const prods = worldProducts(w, products);
  const tmpls = worldTemplates(w, active);
  const items = toItems(prods, tmpls);
  const Design = DESIGNS[w.design];
  const i = WORLDS.indexOf(w);
  const next = WORLDS[(i + 1) % WORLDS.length];
  const prev = WORLDS[(i + WORLDS.length - 1) % WORLDS.length];
  return (
    <div className={`world w-${w.design}`} style={{ '--wb': w.tone.bg, '--wi': w.tone.ink, '--wa': w.tone.accent }}>
      <Seo title={`${w.title} — Wall Art World`} description={w.line} path={`/worlds/${w.id}`} jsonLd={{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${w.title} | JHAYRA`, description: w.line, url: `${SITE.url}/worlds/${w.id}` }} />
      <Design w={w} items={items} products={products || []} templates={tmpls} />
      <nav className="wrap w-nav" aria-label="More worlds">
        <Link to={`/worlds/${prev.id}`}>
          <Icon name="arrowL" size={16} /> {prev.title}
        </Link>
        <Link to="/worlds">All worlds</Link>
        <Link to={`/worlds/${next.id}`}>
          {next.title} <Icon name="arrow" size={16} />
        </Link>
      </nav>
    </div>
  );
}

export default function Worlds() {
  const { id } = useParams();
  if (!id) return <Hub />;
  const w = WORLD_MAP[id];
  if (!w)
    return (
      <div className="wrap section center">
        <h1 className="h2">World not found</h1>
        <Link to="/worlds" className="btn" style={{ marginTop: 20 }}>
          All worlds
        </Link>
      </div>
    );
  return <WorldPage w={w} />;
}
