import { useEffect, useMemo, useState } from 'react';
import { useProducts } from '../lib/catalog';
import { optimized } from '../lib/img';
import { money } from '../lib/site';
import { SIZES } from '../lib/frames';
import { DEFAULT_SIGNATURE, PREVIEW_KEY, SIGNATURE_MULTIPLIER, loadSignature, pincodeRules, saveSignature, signaturePrice, uploadSignatureImage } from '../lib/signature';

const lines = (v) => (Array.isArray(v) ? v.join('\n') : v || '');
const toList = (s) =>
  s
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);

export default function SignatureManager() {
  const { data: products } = useProducts();
  const [s, setS] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');

  useEffect(() => {
    loadSignature(true).then((x) => setS(JSON.parse(JSON.stringify(x))));
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const fn = (e) => (e.preventDefault(), (e.returnValue = ''));
    addEventListener('beforeunload', fn);
    return () => removeEventListener('beforeunload', fn);
  }, [dirty]);

  const byId = useMemo(() => Object.fromEntries((products || []).map((p) => [p.id, p])), [products]);
  const cats = useMemo(() => [...new Set((products || []).map((p) => p.category))].filter(Boolean).sort(), [products]);
  if (!s) return <div className="ad-muted">Loading…</div>;

  const up = (patch) => {
    setS((x) => ({ ...x, ...patch }));
    setDirty(true);
    setMsg('');
  };
  const upIn = (key, patch) => up({ [key]: { ...s[key], ...patch } });
  const items = s.items || [];
  const inSet = new Set(items.map((i) => i.productId));
  const setItems = (next) => up({ items: next });
  const add = (id) => setItems([...items, { productId: id, enabled: true, featured: false, note: '' }]);
  const removeItem = (id) => {
    setItems(items.filter((i) => i.productId !== id));
    if (s.hero.productId === id) upIn('hero', { productId: '' });
  };
  const patchItem = (id, patch) => setItems(items.map((i) => (i.productId === id ? { ...i, ...patch } : i)));
  const move = (idx, d) => {
    const n = [...items];
    const j = idx + d;
    if (j < 0 || j >= n.length) return;
    [n[idx], n[j]] = [n[j], n[idx]];
    setItems(n);
  };
  const browse = (products || []).filter((p) => p.thumbnail && !inSet.has(p.id) && (!cat || p.category === cat) && (!q || `${p.name} ${p.id} ${p.category}`.toLowerCase().includes(q.toLowerCase())));
  const save = async () => {
    setBusy(true);
    setErr('');
    try {
      await saveSignature(s);
      setDirty(false);
      setMsg('Published — the Signature page updates within a few minutes.');
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  };
  const preview = () => {
    try {
      localStorage.setItem(PREVIEW_KEY, JSON.stringify(s));
    } catch {}
    window.open('/signature-experience?preview=1', '_blank', 'noopener');
  };
  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      upIn('packaging', { images: [await uploadSignatureImage(file)] });
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  };
  const rules = pincodeRules(s.founder.pincodes);
  const live = items.filter((i) => i.enabled !== false && byId[i.productId]);

  return (
    <>
      <div className="ad-row-between">
        <h1 className="ad-h1">Signature Collection</h1>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="ad-btn" onClick={preview}>
            Preview page ↗
          </button>
          <button className="ad-btn ad-btn-primary" disabled={!dirty || busy} onClick={save}>
            {busy ? 'Saving…' : dirty ? 'Publish changes' : 'Published'}
          </button>
        </div>
      </div>
      {err && <div className="ad-err">{err}</div>}
      {msg && <div className="ad-ok">{msg}</div>}

      <div className="ad-card sgm-top">
        <label className="toggle">
          <input type="checkbox" checked={s.enabled !== false} onChange={(e) => up({ enabled: e.target.checked })} /> <span className="sw" /> Signature Experience is {s.enabled !== false ? 'on' : 'off'}
        </label>
        <p className="ad-muted" style={{ margin: '6px 0 0' }}>
          {live.length} piece{live.length === 1 ? '' : 's'} live in the collection. Only products you add <b>and</b> enable here appear — the rest of the catalogue never does. When off, the invitation strip hides and the page shows “Returning soon”.
        </p>
      </div>

      <div className="ad-card">
        <h3>Pricing rule</h3>
        <label className="toggle">
          <input type="checkbox" checked={s.pricing.enabled !== false} onChange={(e) => upIn('pricing', { enabled: e.target.checked })} /> <span className="sw" /> Signature price = regular price × {SIGNATURE_MULTIPLIER}
        </label>
        <p className="ad-muted">
          Calculated live from each product’s regular size price — e.g. {SIZES.map((z) => `${money(z.price)} → ${money(signaturePrice(z.price, s))}`).join(' · ')}. Regular shop prices never change. Premium packaging is included in the Signature price.
        </p>
        <label className="toggle">
          <input type="checkbox" checked={!!s.checkout.online} onChange={(e) => upIn('checkout', { online: e.target.checked })} /> <span className="sw" /> Take online payment for Signature orders
        </label>
        <p className="ad-muted">
          Turn this on <b>only after</b> the payment function applies Signature pricing on the server (see docs/SIGNATURE.md). While off, customers review their Signature bag at checkout and confirm the order with your concierge on WhatsApp at the same prices.
        </p>
      </div>

      <div className="sgm">
        <div className="ad-card">
          <h3>Selected for Signature · {items.length}</h3>
          {!items.length && <p className="ad-muted">Nothing selected yet. Add artwork from the catalogue.</p>}
          <ol className="sgm-sel">
            {items.map((it, idx) => {
              const p = byId[it.productId];
              return (
                <li key={it.productId} className={it.enabled === false ? 'off' : ''}>
                  <div className="sgm-row">
                    <span className="sgm-ord">
                      <button className="ad-btn" aria-label="Move up" onClick={() => move(idx, -1)} disabled={!idx}>
                        ↑
                      </button>
                      <button className="ad-btn" aria-label="Move down" onClick={() => move(idx, 1)} disabled={idx === items.length - 1}>
                        ↓
                      </button>
                    </span>
                    {p?.thumbnail ? <img src={optimized(p.thumbnail, 120)} alt="" /> : <span className="sgm-missing">?</span>}
                    <span className="sgm-info">
                      <b>{p?.name || `${it.productId} (not in catalogue)`}</b>
                      <small>
                        {it.productId} · regular {money(p?.price)} → Signature {money(signaturePrice(p?.price, s))}
                      </small>
                    </span>
                  </div>
                  <div className="sgm-ctl">
                    <label className="toggle">
                      <input type="checkbox" checked={it.enabled !== false} onChange={(e) => patchItem(it.productId, { enabled: e.target.checked })} /> <span className="sw" /> Live
                    </label>
                    <label className="toggle">
                      <input type="checkbox" checked={!!it.featured} onChange={(e) => patchItem(it.productId, { featured: e.target.checked })} /> <span className="sw" /> Featured
                    </label>
                    <label className="toggle">
                      <input type="radio" name="sgm-hero" checked={s.hero.productId === it.productId} onChange={() => upIn('hero', { productId: it.productId })} /> Hero artwork
                    </label>
                    <button className="ad-link" onClick={() => removeItem(it.productId)}>
                      Remove
                    </button>
                  </div>
                  <input className="ad-input" placeholder="Signature note (editorial line shown on the card)" value={it.note || ''} onChange={(e) => patchItem(it.productId, { note: e.target.value })} />
                </li>
              );
            })}
          </ol>
        </div>

        <div className="ad-card">
          <h3>Browse catalogue</h3>
          <div className="ad-toolbar">
            <input className="ad-input" placeholder="Search name or code" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="ad-input" style={{ width: 'auto' }} value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">All categories</option>
              {cats.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <ul className="sgm-browse">
            {browse.map((p) => (
              <li key={p.id}>
                <img src={optimized(p.thumbnail, 120)} alt="" />
                <span className="sgm-info">
                  <b>{p.name}</b>
                  <small>
                    {p.id} · {p.category} · {money(p.price)}
                  </small>
                </span>
                <button className="ad-btn" onClick={() => add(p.id)}>
                  + Add
                </button>
              </li>
            ))}
            {!browse.length && <li className="ad-muted">No more products match.</li>}
          </ul>
        </div>
      </div>

      <div className="ad-card">
        <h3>Page text</h3>
        <div className="ad-grid2">
          <label className="ad-field">
            Small heading
            <input className="ad-input" value={s.hero.kicker} onChange={(e) => upIn('hero', { kicker: e.target.value })} />
          </label>
          <label className="ad-field">
            Title
            <input className="ad-input" value={s.hero.title} onChange={(e) => upIn('hero', { title: e.target.value })} />
          </label>
        </div>
        <label className="ad-field">
          Subtitle
          <input className="ad-input" value={s.hero.subtitle} onChange={(e) => upIn('hero', { subtitle: e.target.value })} />
        </label>
        <label className="ad-field">
          Introduction
          <textarea className="ad-input" rows={2} value={s.hero.lead} onChange={(e) => upIn('hero', { lead: e.target.value })} />
        </label>
      </div>

      <div className="ad-card">
        <h3>Packaging presentation</h3>
        <label className="toggle">
          <input type="checkbox" checked={s.packaging.enabled !== false} onChange={(e) => upIn('packaging', { enabled: e.target.checked })} /> <span className="sw" /> Show packaging section
        </label>
        <label className="ad-field">
          Title
          <input className="ad-input" value={s.packaging.title} onChange={(e) => upIn('packaging', { title: e.target.value })} />
        </label>
        <label className="ad-field">
          Text
          <textarea className="ad-input" rows={2} value={s.packaging.text} onChange={(e) => upIn('packaging', { text: e.target.value })} />
        </label>
        <label className="ad-field">
          Points (one per line — only describe what you actually provide)
          <textarea className="ad-input" rows={4} value={lines(s.packaging.points)} onChange={(e) => upIn('packaging', { points: toList(e.target.value) })} />
        </label>
        <div className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {s.packaging.images?.[0] && <img src={s.packaging.images[0]} alt="" style={{ width: 120, borderRadius: 8 }} />}
          <label className="ad-btn">
            Upload packaging photo
            <input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
          </label>
          {s.packaging.images?.[0] && (
            <button className="ad-btn" onClick={() => upIn('packaging', { images: [] })}>
              Remove photo
            </button>
          )}
          <span className="ad-muted">Without a photo, an illustrated Signature box is shown.</span>
        </div>
      </div>

      <div className="ad-card">
        <h3>Founder delivery</h3>
        <label className="toggle">
          <input type="checkbox" checked={s.founder.enabled !== false} onChange={(e) => upIn('founder', { enabled: e.target.checked })} /> <span className="sw" /> Offer “Delivered personally by the founder”
        </label>
        <div className="ad-grid2">
          <label className="ad-field">
            Fee (₹)
            <input className="ad-input" type="number" min={0} value={s.founder.fee} onChange={(e) => upIn('founder', { fee: Math.max(0, Number(e.target.value) || 0) })} />
          </label>
          <label className="ad-field">
            Service areas (comma-separated)
            <input className="ad-input" value={s.founder.areas.join(', ')} onChange={(e) => upIn('founder', { areas: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} />
          </label>
        </div>
        <label className="ad-field">
          Eligible pincodes — single codes or ranges, e.g. 400001-400104, 400601 ({rules.length} rule{rules.length === 1 ? '' : 's'})
          <textarea className="ad-input" rows={3} value={s.founder.pincodes} onChange={(e) => upIn('founder', { pincodes: e.target.value })} />
        </label>
        <label className="ad-field">
          Delivery slots (one per line)
          <textarea className="ad-input" rows={4} value={lines(s.founder.slots)} onChange={(e) => upIn('founder', { slots: toList(e.target.value) })} />
        </label>
        <label className="ad-field">
          Description
          <textarea className="ad-input" rows={2} value={s.founder.note} onChange={(e) => upIn('founder', { note: e.target.value })} />
        </label>
      </div>

      <div className="ad-card">
        <h3>FAQ</h3>
        {s.faq.map(([qq, a], i) => (
          <div key={i} className="ad-grid2" style={{ alignItems: 'start' }}>
            <input className="ad-input" value={qq} onChange={(e) => up({ faq: s.faq.map((x, j) => (j === i ? [e.target.value, x[1]] : x)) })} />
            <textarea className="ad-input" rows={2} value={a} onChange={(e) => up({ faq: s.faq.map((x, j) => (j === i ? [x[0], e.target.value] : x)) })} />
          </div>
        ))}
        <div className="row" style={{ gap: 8, marginTop: 8 }}>
          <button className="ad-btn" onClick={() => up({ faq: [...s.faq, ['New question', 'Answer']] })}>
            + Add question
          </button>
          {s.faq.length > 1 && (
            <button className="ad-btn" onClick={() => up({ faq: s.faq.slice(0, -1) })}>
              Remove last
            </button>
          )}
          <button className="ad-btn" onClick={() => up({ faq: DEFAULT_SIGNATURE.faq })}>
            Reset to defaults
          </button>
        </div>
      </div>
    </>
  );
}
