import { useEffect, useState } from 'react';
import { FESTIVALS, loadFestivals, saveFestivals, festivalList, activeFestival } from '../lib/festivals';

const PARTICLES = [
  ['diya', 'Rising diya embers'],
  ['sparkle', 'Twinkling sparkles'],
  ['petals', 'Falling petals'],
  ['snow', 'Snow'],
  ['colour', 'Holi colour clouds'],
];
const csv = (a) => (a || []).join(', ');
const uncsv = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

export default function Festivals() {
  const [list, setList] = useState(festivalList());
  const [sel, setSel] = useState(list[0]?.id);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    loadFestivals(true).then((l) => {
      setList(l);
      setSel((s) => s || l[0]?.id);
    });
  }, []);

  const f = list.find((x) => x.id === sel);
  const live = activeFestival();
  const up = (patch) => {
    setList((l) => l.map((x) => (x.id === sel ? { ...x, ...patch } : x)));
    setDirty(true);
  };
  const theme = (k, v) => up({ theme: { ...f.theme, [k]: v } });
  const input = (k, label, props = {}) => (
    <label className="ad-field">
      {label}
      <input className="ad-input" value={f[k] ?? ''} onChange={(e) => up({ [k]: e.target.value })} {...props} />
    </label>
  );

  const publish = async () => {
    setErr('');
    try {
      await saveFestivals(list);
      setDirty(false);
      setMsg('Published — the site will use these festivals right away.');
      setTimeout(() => setMsg(''), 4000);
    } catch (x) {
      setErr(`Could not publish: ${x.message}`);
    }
  };

  return (
    <>
      <div className="ad-row-between">
        <h1 className="ad-h1">Festivals & offers</h1>
        <div className="ad-toolbar" style={{ margin: 0 }}>
          <button
            className="ad-btn"
            onClick={() => {
              const base = f || FESTIVALS[0];
              const id = `festival-${Date.now().toString(36)}`;
              setList((l) => [...l, { ...JSON.parse(JSON.stringify(base)), id, name: 'New festival', enabled: false }]);
              setSel(id);
              setDirty(true);
            }}
          >
            + New festival
          </button>
          <button className="ad-btn ad-btn-primary" disabled={!dirty} onClick={publish}>
            {dirty ? 'Publish changes' : 'All changes live'}
          </button>
        </div>
      </div>
      <p className="ad-muted">
        While a festival’s window is open, the homepage turns into its theme and its coupon applies at checkout automatically. {live ? <b>Live now: {live.name}.</b> : 'No festival is live right now.'} The coupon code must also exist in your coupon system.
      </p>
      {msg && <div className="ad-ok">{msg}</div>}
      {err && <div className="ad-err">{err}</div>}
      <div className="ad-tmpl">
        <aside className="ad-card ad-tmpl-list">
          <ul>
            {list
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((x) => (
                <li key={x.id} className={x.id === sel ? 'on' : ''} onClick={() => setSel(x.id)}>
                  <b>
                    <span className="ad-dot" style={{ background: x.theme?.accent }} /> {x.name}
                  </b>
                  <small>
                    {x.from} → {x.to} {x.enabled === false && '· off'} {x.verify && '· check date'}
                  </small>
                </li>
              ))}
          </ul>
        </aside>
        {f && (
          <div className="ad-card ad-form">
            <div className="ad-row-between">
              <h2>{f.name}</h2>
              <a className="ad-btn" href={`/?festival=${f.id}`} target="_blank" rel="noreferrer">
                Preview homepage ↗
              </a>
            </div>
            {dirty && <p className="ad-muted">Preview shows the last published version — publish first to preview edits.</p>}
            <div className="ad-toolbar">
              <label className="ad-check">
                <input type="checkbox" checked={f.enabled !== false} onChange={(e) => up({ enabled: e.target.checked })} /> Enabled
              </label>
              <label className="ad-check">
                <input type="checkbox" checked={!!f.verify} onChange={(e) => up({ verify: e.target.checked })} /> Date still needs checking
              </label>
            </div>
            <div className="ad-grid2">
              {input('name', 'Festival name')}
              {input('eyebrow', 'Small heading')}
              {input('date', 'Festival date', { type: 'date' })}
              <span />
              {input('from', 'Theme starts', { type: 'date' })}
              {input('to', 'Theme ends', { type: 'date' })}
            </div>
            <h3>Hero</h3>
            <div className="ad-grid2">
              {[0, 1, 2].map((i) => (
                <label key={i} className="ad-field">
                  Headline line {i + 1}
                  {i === 2 && ' (gold italic)'}
                  <input className="ad-input" value={f.title?.[i] || ''} onChange={(e) => up({ title: [0, 1, 2].map((j) => (j === i ? e.target.value : f.title?.[j] || '')).filter((x, j) => x || j < 2) })} />
                </label>
              ))}
            </div>
            <label className="ad-field">
              Paragraph
              <textarea className="ad-input" rows={2} value={f.lead || ''} onChange={(e) => up({ lead: e.target.value })} />
            </label>
            <h3>Offer</h3>
            <div className="ad-grid2">
              <label className="ad-field">
                Coupon code (auto-applied)
                <input className="ad-input" value={f.coupon || ''} onChange={(e) => up({ coupon: e.target.value.toUpperCase() || null })} placeholder="e.g. KARVA10" />
              </label>
              {input('offer', 'Offer text (e.g. 10% off couple frames)')}
              <label className="ad-field">
                Top banner text
                <input className="ad-input" value={f.banner || ''} onChange={(e) => up({ banner: e.target.value })} />
              </label>
            </div>
            <h3>Buttons</h3>
            <div className="ad-grid2">
              <label className="ad-field">
                Main button text
                <input className="ad-input" value={f.cta?.label || ''} onChange={(e) => up({ cta: { ...f.cta, label: e.target.value } })} />
              </label>
              <label className="ad-field">
                Main button link
                <input className="ad-input" value={f.cta?.to || ''} onChange={(e) => up({ cta: { ...f.cta, to: e.target.value } })} />
              </label>
              <label className="ad-field">
                Second button text
                <input className="ad-input" value={f.cta2?.label || ''} onChange={(e) => up({ cta2: { ...f.cta2, label: e.target.value } })} />
              </label>
              <label className="ad-field">
                Second button link
                <input className="ad-input" value={f.cta2?.to || ''} onChange={(e) => up({ cta2: { ...f.cta2, to: e.target.value } })} />
              </label>
            </div>
            <h3>Look & feel</h3>
            <div className="ad-toolbar">
              {[
                ['bg', 'Background'],
                ['bg2', 'Glow'],
                ['ink', 'Text'],
                ['accent', 'Accent'],
              ].map(([k, l]) => (
                <label key={k} className="ad-check">
                  <input type="color" value={f.theme?.[k] || '#000000'} onChange={(e) => theme(k, e.target.value)} /> {l}
                </label>
              ))}
              <label className="ad-check">
                <input type="checkbox" checked={!!f.theme?.moon} onChange={(e) => theme('moon', e.target.checked)} /> Moon
              </label>
              <label className="ad-check">
                <input type="checkbox" checked={!!f.theme?.rangoli} onChange={(e) => theme('rangoli', e.target.checked)} /> Rangoli
              </label>
              <select className="ad-input" style={{ width: 'auto' }} value={f.particles} onChange={(e) => up({ particles: e.target.value })}>
                {PARTICLES.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="ad-fx-preview" style={{ background: `radial-gradient(circle at 70% 20%, ${f.theme?.bg2}, ${f.theme?.bg})`, color: f.theme?.ink }}>
              <small style={{ color: f.theme?.accent }}>{f.eyebrow}</small>
              <b>
                {(f.title || []).slice(0, -1).join(' ')} <em style={{ color: f.theme?.accent }}>{(f.title || []).slice(-1)}</em>
              </b>
              {f.coupon && <span style={{ background: f.theme?.accent, color: f.theme?.bg }}>{f.coupon}</span>}
            </div>
            <h3>What to feature</h3>
            <div className="ad-grid2">
              <label className="ad-field">
                Product categories (slugs, comma separated)
                <input className="ad-input" value={csv(f.categories)} onChange={(e) => up({ categories: uncsv(e.target.value) })} />
              </label>
              <label className="ad-field">
                Template groups (comma separated)
                <input className="ad-input" value={csv(f.templateGroups)} onChange={(e) => up({ templateGroups: uncsv(e.target.value) })} />
              </label>
              <label className="ad-field">
                Product name keywords
                <input className="ad-input" value={csv(f.keywords)} onChange={(e) => up({ keywords: uncsv(e.target.value) })} />
              </label>
            </div>
            <button
              className="ad-btn"
              style={{ marginTop: 18 }}
              onClick={() => {
                if (!confirm(`Delete ${f.name}?`)) return;
                setList((l) => l.filter((x) => x.id !== f.id));
                setSel(list.find((x) => x.id !== f.id)?.id);
                setDirty(true);
              }}
            >
              Delete festival
            </button>
          </div>
        )}
      </div>
    </>
  );
}
