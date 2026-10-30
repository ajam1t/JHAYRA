import { useEffect, useMemo, useState } from 'react';
import { useProducts } from '../lib/catalog';
import { optimized } from '../lib/img';
import { DECOR_OPTIONS, EVENT_THEMES, LAYOUT_OPTIONS, PARTICLE_OPTIONS, themeFor } from '../lib/eventThemes';
import { DEFAULT_CAMPAIGNS, PREVIEW_KEY, TARGETS, campaignFromTheme, guessTheme, campaignStatus, findConflicts, liveCampaigns, loadCampaigns, nowIST, resolveCampaign, saveCampaigns, uploadCampaignImage } from '../lib/campaigns';
import { EventBanner, EventStrip, eventThumb } from '../components/EventExperience';

const STATUS = { live: 'Live now', scheduled: 'Scheduled', expired: 'Ended', paused: 'Paused' };
const INTENSITY = [
  [0.6, 'Subtle'],
  [1, 'Balanced'],
  [1.5, 'Rich'],
];
const DURATION = [
  [0, 'Always on'],
  [8, '8 seconds, then stop'],
  [20, '20 seconds, then stop'],
];
const fmt = (s) => (s ? s.replace('T', ' · ') : '—');
const csv = (v) => (Array.isArray(v) ? v.join(', ') : v || '');
const list = (s) =>
  s
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

export default function Campaigns() {
  const { data: products } = useProducts();
  const [all, setAll] = useState(null);
  const [sel, setSel] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState('all');
  const [newTheme, setNewTheme] = useState('');

  useEffect(() => {
    loadCampaigns(true).then((saved) => {
      // Older campaigns get their theme; seeded annual events that aren't in
      // the saved list yet are added (paused) for review.
      const l = saved.map((x) => ({ ...x, theme: guessTheme(x) }));
      const missing = DEFAULT_CAMPAIGNS.filter((d) => !l.some((x) => x.id === d.id || (x.theme === d.theme && (x.start || '').slice(0, 4) === d.start.slice(0, 4))));
      setAll([...l, ...missing]);
      if (missing.length && saved !== DEFAULT_CAMPAIGNS) {
        setDirty(true);
        setMsg(`${missing.length} ready-made annual events were added (paused). Review them and press Save.`);
      }
      setSel((liveCampaigns(l)[0] || l[0])?.id || null);
    });
  }, []);
  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const fn = (e) => (e.preventDefault(), (e.returnValue = ''));
    window.addEventListener('beforeunload', fn);
    return () => window.removeEventListener('beforeunload', fn);
  }, [dirty]);

  const now = nowIST();
  const sorted = useMemo(() => [...(all || [])].sort((a, b) => (a.start || '').localeCompare(b.start || '')), [all]);
  if (!all) return <div className="ad-muted">Loading…</div>;

  const c = all.find((x) => x.id === sel);
  const r = c && resolveCampaign(c);
  const t = c && themeFor(c.theme);
  const featured = liveCampaigns(all)[0];
  const conflicts = findConflicts(all);
  const shown = sorted.filter((x) => filter === 'all' || campaignStatus(x, now) === filter);

  const up = (patch) => {
    setAll((l) => l.map((x) => (x.id === sel ? { ...x, ...patch } : x)));
    setDirty(true);
    setMsg('');
  };
  const add = (themeId) => {
    if (!themeId) return;
    const n = campaignFromTheme(themeId, { start: `${now.slice(0, 10)}T00:00`, end: '' });
    setAll((l) => [...l, n]);
    setSel(n.id);
    setDirty(true);
    setNewTheme('');
  };
  // Make one event the homepage event: switch it on, put it first, start it
  // now if it hasn't started, and pause any other event that is live now.
  const showNow = (id) => {
    setAll((l) =>
      l.map((x) => {
        if (x.id === id) {
          const start = x.start && campaignStatus({ ...x, enabled: true }, now) === 'scheduled' ? `${now.slice(0, 10)}T00:00` : x.start;
          return { ...x, enabled: true, priority: 1, start };
        }
        return campaignStatus(x, now) === 'live' ? { ...x, enabled: false } : x;
      }),
    );
    setDirty(true);
    setMsg('Done — press “Save changes” to publish. The site updates within a minute.');
  };
  const duplicate = () => {
    const n = { ...c, id: `${c.theme}-${Date.now().toString(36)}`, title: `${c.title} (copy)`, enabled: false };
    setAll((l) => [...l, n]);
    setSel(n.id);
    setDirty(true);
  };
  const remove = () => {
    if (!confirm(`Delete “${c.title}”?`)) return;
    const next = all.filter((x) => x.id !== sel);
    setAll(next);
    setSel(next[0]?.id || null);
    setDirty(true);
  };
  const applyTheme = (id) => {
    const th = themeFor(id);
    up({ theme: id, kicker: th.copy.kicker, headline: th.copy.title, em: th.copy.em, subtitle: th.copy.subtitle, cta: th.copy.cta, target: th.copy.target, palette: null, decor: null, particles: undefined, layout: '', categories: undefined, keywords: undefined });
  };
  const save = async () => {
    setBusy(true);
    setErr('');
    try {
      const bad = all.find((x) => x.start && x.end && x.end < x.start);
      if (bad) throw new Error(`“${bad.title}” ends before it starts.`);
      await saveCampaigns(all);
      setDirty(false);
      setMsg('Saved — the site updates within a few minutes.');
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  };
  const upload = async (file, key) => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      up({ [key]: await uploadCampaignImage(file) });
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  };
  const preview = () => {
    try {
      localStorage.setItem(PREVIEW_KEY, JSON.stringify(c));
    } catch {}
    window.open('/?campaign-preview=1', '_blank', 'noopener');
  };
  const field = (k, label, props = {}) => (
    <label className="ad-field">
      {label}
      <input className="ad-input" value={c[k] ?? ''} onChange={(e) => up({ [k]: e.target.value })} {...props} />
    </label>
  );
  const toggle = (k, label) => (
    <label className="toggle">
      <input type="checkbox" checked={c[k] !== false} onChange={(e) => up({ [k]: e.target.checked })} /> <span className="sw" /> {label}
    </label>
  );
  const status = c && campaignStatus(c, now);

  return (
    <>
      <div className="ad-row-between">
        <h1 className="ad-h1">Events & Campaigns</h1>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <select className="ad-input" style={{ width: 'auto' }} value={newTheme} onChange={(e) => add(e.target.value)} aria-label="New campaign from a theme">
            <option value="">+ New campaign from a theme…</option>
            {EVENT_THEMES.map((x) => (
              <option key={x.id} value={x.id}>
                {x.motif} {x.name}
              </option>
            ))}
          </select>
          <button className="ad-btn ad-btn-primary" disabled={!dirty || busy} onClick={save}>
            {busy ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
          </button>
        </div>
      </div>

      <div className="ad-card cm-now">
        <span className={`cm-dot ${featured ? 'on' : ''}`} />
        <div>
          <b>{featured ? `Live on the homepage: ${featured.title}` : 'No campaign live — the homepage shows the default JHAYRA experience (Mithila Art strip).'}</b>
          <p className="ad-muted" style={{ margin: '2px 0 0' }}>
            All times are India time (IST) · now {fmt(now)}. Only active campaigns inside their dates appear; when several are live, the lowest priority number wins, then the one that started most recently. When a campaign ends or is paused, the next eligible one takes over automatically.
          </p>
        </div>
      </div>
      {conflicts.length > 0 && (
        <div className="ad-err">
          {conflicts.map(([a, b]) => (
            <div key={a.id + b.id}>
              ⚠ “{a.title}” and “{b.title}” overlap with the same priority ({a.priority ?? '—'}). Give one a lower number so it’s clear which should show.
            </div>
          ))}
        </div>
      )}
      {err && <div className="ad-err">{err}</div>}
      {msg && <div className="ad-ok">{msg}</div>}

      <div className="cm">
        <div className="cm-side">
          <div className="ad-seg cm-filter" role="group" aria-label="Filter campaigns">
            {['all', 'live', 'scheduled', 'paused', 'expired'].map((f) => (
              <button key={f} type="button" className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : STATUS[f]}
              </button>
            ))}
          </div>
          <ul className="cm-list">
            {shown.map((x) => {
              const st = campaignStatus(x, now);
              const th = themeFor(x.theme);
              const thumb = eventThumb(resolveCampaign(x), products);
              return (
                <li key={x.id}>
                  <button className={x.id === sel ? 'on' : ''} onClick={() => setSel(x.id)} style={{ '--sw': resolveCampaign(x).palette.deep, '--sa': resolveCampaign(x).palette.accent }}>
                    <span className="cm-sw">{thumb ? <img src={optimized(thumb, 120)} alt="" /> : th.motif}</span>
                    <span className="cm-li">
                      <b>{x.title}</b>
                      <small>
                        {fmt(x.start).slice(0, 10)} → {fmt(x.end).slice(0, 10)} · P{x.priority ?? '—'}
                        {x.verify ? ' · verify date' : ''}
                      </small>
                    </span>
                    <span className={`ad-st ad-st-${st}`}>{STATUS[st]}</span>
                  </button>
                </li>
              );
            })}
            {!shown.length && <li className="ad-muted">Nothing here.</li>}
          </ul>
        </div>

        {c && (
          <div className="cm-main">
            <div className="ad-card">
              <div className="ad-row-between">
                <div>
                  <h2 style={{ margin: 0 }}>
                    {t.motif} {c.title}
                  </h2>
                  <span className={`ad-st ad-st-${status}`}>{STATUS[status]}</span>
                </div>
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <button className="ad-btn" onClick={preview}>
                    Preview homepage ↗
                  </button>
                  <button className={`ad-btn ${c.enabled === false ? 'ad-btn-primary' : ''}`} onClick={() => up({ enabled: c.enabled === false })}>
                    {c.enabled === false ? 'Activate' : 'Pause'}
                  </button>
                  {featured?.id !== c.id && (
                    <button className="ad-btn ad-btn-primary" onClick={() => showNow(c.id)}>
                      Show this on the homepage now
                    </button>
                  )}
                </div>
              </div>
              {c.enabled === false && <div className="ad-err cm-paused">This event is paused, so it won’t appear on the site. Press “Show this on the homepage now” (or Activate), then Save changes.</div>}
              {c.enabled !== false && featured && featured.id !== c.id && status === 'live' && <div className="ad-err cm-paused">“{featured.title}” is showing instead — it has a lower priority number. Use “Show this on the homepage now” to switch.</div>}
              <div className="cm-preview" aria-label="Live preview">
                {r.showStrip && <EventStrip c={r} />}
                {r.showBanner ? <EventBanner c={r} products={products} as="div" /> : <p className="ad-muted">The banner is turned off for this campaign.</p>}
              </div>
            </div>

            <div className="ad-card">
              <h3>Schedule</h3>
              <div className="ad-grid2">
                {field('start', 'Starts (IST)', { type: 'datetime-local', value: !c.start ? '' : c.start.length === 10 ? `${c.start}T00:00` : c.start.slice(0, 16) })}
                {field('end', 'Ends (IST)', { type: 'datetime-local', value: !c.end ? '' : c.end.length === 10 ? `${c.end}T23:59` : c.end.slice(0, 16) })}
              </div>
              <div className="ad-grid2">
                {field('priority', 'Priority (1 = shows first)', { type: 'number', min: 1, max: 99, onChange: (e) => up({ priority: Number(e.target.value) || 1 }) })}
                {field('eventDate', 'Event day (for the countdown)', { type: 'date' })}
              </div>
              {c.verify && <p className="ad-muted">This festival follows the lunar calendar — please confirm the dates with a panchang before activating. <button className="ad-link" onClick={() => up({ verify: false })}>Mark as confirmed</button></p>}
            </div>

            <div className="ad-card">
              <h3>Theme & look</h3>
              <div className="ad-grid2">
                <label className="ad-field">
                  Event theme
                  <select className="ad-input" value={c.theme} onChange={(e) => up({ theme: e.target.value })}>
                    {EVENT_THEMES.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.motif} {x.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="ad-field">
                  Banner layout
                  <select className="ad-input" value={c.layout || ''} onChange={(e) => up({ layout: e.target.value })}>
                    <option value="">Theme default ({LAYOUT_OPTIONS.find(([v]) => v === t.layout)?.[1].split(' —')[0]})</option>
                    {LAYOUT_OPTIONS.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button className="ad-btn" onClick={() => applyTheme(c.theme)} style={{ marginBottom: 12 }}>
                Reset text & look to the “{t.name}” theme
              </button>
              <div className="cm-colors">
                {[
                  ['deep', 'Deep (strip, headings, button)'],
                  ['accent', 'Accent (decorations, highlights)'],
                  ['tint', 'Tint (banner background)'],
                  ['ink', 'Text on deep colour'],
                ].map(([k, l]) => (
                  <label key={k} className="cm-color">
                    <input type="color" value={r.palette[k]} onChange={(e) => up({ palette: { ...(c.palette || {}), [k]: e.target.value } })} />
                    <span>{l}</span>
                  </label>
                ))}
                {c.palette && (
                  <button className="ad-link" onClick={() => up({ palette: null })}>
                    Use theme colours
                  </button>
                )}
              </div>
              <span className="ad-label">Decorations</span>
              <div className="cm-chips">
                {DECOR_OPTIONS.map(([v, l]) => {
                  const on = r.decor.includes(v);
                  return (
                    <button key={v} type="button" className={`ad-chip ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => up({ decor: on ? r.decor.filter((d) => d !== v) : [...r.decor, v] })}>
                      {l}
                    </button>
                  );
                })}
              </div>
              <div className="ad-grid2" style={{ marginTop: 12 }}>
                <label className="ad-field">
                  Animation
                  <select className="ad-input" value={r.particles || ''} onChange={(e) => up({ particles: e.target.value })}>
                    {PARTICLE_OPTIONS.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="ad-field">
                  Intensity
                  <select className="ad-input" value={r.intensity} onChange={(e) => up({ intensity: Number(e.target.value) })}>
                    {INTENSITY.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="ad-field">
                  Duration
                  <select className="ad-input" value={r.duration} onChange={(e) => up({ duration: Number(e.target.value) })}>
                    {DURATION.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="ad-muted">Animations are lightweight, pause off-screen and switch off for visitors who prefer reduced motion.</p>
            </div>

            <div className="ad-card">
              <h3>Words & button</h3>
              <div className="ad-grid2">
                {field('title', 'Campaign name (shown in the top strip)')}
                {field('kicker', 'Small heading')}
              </div>
              <div className="ad-grid2">
                {field('headline', 'Headline', { value: r.headline || '' })}
                {field('em', 'Headline accent (in the event colour)')}
              </div>
              <label className="ad-field">
                Description
                <textarea className="ad-input" rows={2} value={c.subtitle || ''} onChange={(e) => up({ subtitle: e.target.value })} />
              </label>
              <div className="ad-grid2">
                {field('cta', 'Button text')}
                <label className="ad-field">
                  Button opens
                  <select className="ad-input" value={c.target} onChange={(e) => up({ target: e.target.value })}>
                    {TARGETS.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {field('coupon', 'Coupon code (optional — must exist in your coupon system; applied automatically at checkout)', { placeholder: 'e.g. DIWALI10', onChange: (e) => up({ coupon: e.target.value.toUpperCase().replace(/\s/g, '') }) })}
            </div>

            <div className="ad-card">
              <h3>Artwork & banners</h3>
              <label className="ad-field">
                Featured artwork in the designed banner
                <select className="ad-input" value={c.imageProduct || ''} onChange={(e) => up({ imageProduct: e.target.value })}>
                  <option value="">Automatic — best matches for this event</option>
                  {(products || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} · {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <p className="ad-muted">Or upload your own creative — it replaces the designed banner (decorations and button stay on top).</p>
              <div className="cm-uploads">
                {[
                  ['image', 'Desktop banner', 'Wide, e.g. 1600 × 600'],
                  ['imageMobile', 'Mobile banner', 'Taller, e.g. 900 × 1000'],
                ].map(([k, l, hint]) => (
                  <div key={k} className="cm-up">
                    {c[k] ? <img src={c[k]} alt="" /> : <span className="ad-muted">{hint}</span>}
                    <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                      <label className="ad-btn">
                        Upload {l.toLowerCase()}
                        <input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0], k)} />
                      </label>
                      {c[k] && (
                        <button className="ad-btn" onClick={() => up({ [k]: '' })}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ad-card">
              <h3>Homepage</h3>
              <div className="cm-toggles">
                {toggle('showStrip', 'Top strip')}
                {toggle('showBanner', 'Campaign banner under the hero')}
                {toggle('showPicks', '“The … edit” product row')}
                {toggle('showCountdown', 'Countdown & order-by date')}
              </div>
              <div className="ad-grid2" style={{ marginTop: 12 }}>
                <label className="ad-field">
                  Product row: categories (comma-separated)
                  <input className="ad-input" value={csv(r.categories)} onChange={(e) => up({ categories: list(e.target.value) })} />
                </label>
                <label className="ad-field">
                  …and name keywords
                  <input className="ad-input" value={csv(r.keywords)} onChange={(e) => up({ keywords: list(e.target.value) })} />
                </label>
              </div>
            </div>

            <div className="row" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <button className="ad-btn" onClick={duplicate}>
                Duplicate
              </button>
              <button className="ad-btn" onClick={remove}>
                Delete campaign
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
