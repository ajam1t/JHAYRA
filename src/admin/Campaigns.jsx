import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../lib/catalog';
import { optimized } from '../lib/img';
import { TARGETS, campaignImage, campaignStatus, loadCampaigns, saveCampaigns, todayIST, uploadCampaignImage } from '../lib/campaigns';

const STATUS = { live: 'Live now', scheduled: 'Scheduled', expired: 'Expired — hidden', disabled: 'Disabled' };
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function Campaigns() {
  const { data: products } = useProducts();
  const [list, setList] = useState(null);
  const [sel, setSel] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const today = todayIST();

  useEffect(() => {
    loadCampaigns(true).then((l) => {
      setList(l);
      setSel(l[0]?.id || null);
    });
  }, []);
  if (!list) return <div className="ad-muted">Loading…</div>;

  const c = list.find((x) => x.id === sel);
  const up = (patch) => {
    setList((l) => l.map((x) => (x.id === sel ? { ...x, ...patch } : x)));
    setDirty(true);
    setMsg('');
  };
  const add = () => {
    const id = `campaign-${Date.now().toString(36)}`;
    const end = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    setList((l) => [...l, { id, title: 'New campaign', kicker: 'Festival special', subtitle: '', cta: 'Explore Collection', target: 'page:celebrations', image: '', imageProduct: '', start: today, end, enabled: false, priority: l.length + 1 }]);
    setSel(id);
    setDirty(true);
  };
  const remove = () => {
    if (!confirm(`Delete “${c.title}”?`)) return;
    const next = list.filter((x) => x.id !== sel);
    setList(next);
    setSel(next[0]?.id || null);
    setDirty(true);
  };
  const save = async () => {
    setBusy(true);
    setErr('');
    try {
      const bad = list.find((x) => x.start && x.end && x.end < x.start);
      if (bad) throw new Error(`“${bad.title}” ends before it starts.`);
      await saveCampaigns(list.map((x) => ({ ...x, id: x.id || slug(x.title) })));
      setDirty(false);
      setMsg('Saved — the homepage updates within a few minutes.');
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  };
  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      up({ image: await uploadCampaignImage(file) });
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  };
  const field = (k, label, props = {}) => (
    <label className="ad-field">
      {label}
      <input className="ad-input" value={c[k] ?? ''} onChange={(e) => up({ [k]: e.target.value })} {...props} />
    </label>
  );
  const img = c && campaignImage(c, products);

  return (
    <>
      <h1 className="ad-h1">Campaigns</h1>
      <div className="ad-card">
        <div className="ad-row-between">
          <p className="ad-muted" style={{ margin: 0 }}>
            Banners under the homepage hero and on the <Link to="/celebrations" target="_blank">Celebrations</Link> page. A campaign shows only while enabled and between its start and end dates (India time); expired and scheduled ones are hidden automatically.
          </p>
          <div className="row" style={{ gap: 8 }}>
            <button className="ad-btn" onClick={add}>
              + New campaign
            </button>
            <button className="ad-btn ad-btn-primary" disabled={!dirty || busy} onClick={save}>
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
        {err && <div className="ad-err">{err}</div>}
        {msg && <div className="ad-ok">{msg}</div>}
      </div>
      <div className="ad-camp">
        <ul className="ad-camp-list">
          {[...list]
            .sort((a, b) => (a.priority || 99) - (b.priority || 99))
            .map((x) => {
              const st = campaignStatus(x, today);
              return (
                <li key={x.id}>
                  <button className={x.id === sel ? 'on' : ''} onClick={() => setSel(x.id)}>
                    <b>{x.title}</b>
                    <small>
                      <span className={`ad-st ad-st-${st}`}>{STATUS[st]}</span> {x.start} → {x.end || 'no end'}
                    </small>
                  </button>
                </li>
              );
            })}
        </ul>
        {c && (
          <div className="ad-card ad-camp-form">
            <label className="toggle">
              <input type="checkbox" checked={c.enabled !== false} onChange={(e) => up({ enabled: e.target.checked })} /> <span className="sw" /> Enabled
            </label>
            <div className="ad-grid2">
              {field('title', 'Title')}
              {field('kicker', 'Small heading (e.g. Festival special)')}
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
                  {TARGETS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="ad-grid2">
              {field('start', 'Start date', { type: 'date' })}
              {field('end', 'End date', { type: 'date' })}
            </div>
            <div className="ad-grid2">
              {field('priority', 'Order (1 shows first)', { type: 'number', min: 1 })}
              <label className="ad-field">
                Image from a product (if no banner uploaded)
                <select className="ad-input" value={c.imageProduct || ''} onChange={(e) => up({ imageProduct: e.target.value })}>
                  <option value="">—</option>
                  {(products || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} · {p.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="ad-camp-img">
              {img ? <img src={optimized(img, 320)} alt="" /> : <span className="ad-muted">No image</span>}
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <label className="ad-btn">
                  Upload banner image
                  <input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
                </label>
                {c.image && (
                  <button className="ad-btn" onClick={() => up({ image: '' })}>
                    Remove upload
                  </button>
                )}
              </div>
            </div>
            <div className="row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
              <span className="ad-muted">Status today: {STATUS[campaignStatus(c, today)]}</span>
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
