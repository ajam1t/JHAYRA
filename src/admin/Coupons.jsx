import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Icon from '../components/Icon';

// Coupon manager: the payment function and the coupon check read this table,
// so a code works at checkout as soon as it's saved here and active.
const EMPTY = { code: '', percent: 10, active: true, starts_at: '', ends_at: '', note: '' };
const toLocal = (v) => (v ? new Date(new Date(v).getTime() + 5.5 * 36e5).toISOString().slice(0, 16) : '');
const fromLocal = (v) => (v ? new Date(`${v}:00+05:30`).toISOString() : null);

function state(c) {
  const now = Date.now();
  if (!c.active) return ['Off', 'off'];
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return ['Scheduled', 'sched'];
  if (c.ends_at && new Date(c.ends_at).getTime() < now) return ['Ended', 'off'];
  return ['Live', 'live'];
}

export default function Coupons() {
  const [list, setList] = useState(null);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () =>
    supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => (error ? setErr(error.message) : setList(data || [])));
  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    const code = form.code.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,20}$/.test(code)) return setErr('Code: 3–20 letters or numbers, no spaces.');
    const percent = Math.round(Number(form.percent));
    if (!(percent >= 1 && percent <= 90)) return setErr('Discount must be between 1% and 90%.');
    const row = { code, percent, active: !!form.active, starts_at: fromLocal(form.starts_at), ends_at: fromLocal(form.ends_at), note: form.note.trim() || null };
    if (row.starts_at && row.ends_at && row.ends_at <= row.starts_at) return setErr('The end must be after the start.');
    setBusy(true);
    const { error } = form.original && form.original !== code ? await supabase.from('coupons').update(row).eq('code', form.original) : await supabase.from('coupons').upsert(row);
    setBusy(false);
    if (error) return setErr(error.message);
    setForm(null);
    load();
  };
  const toggle = async (c) => {
    const { error } = await supabase.from('coupons').update({ active: !c.active }).eq('code', c.code);
    if (error) return setErr(error.message);
    load();
  };
  const remove = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}? Customers won’t be able to use it.`)) return;
    const { error } = await supabase.from('coupons').delete().eq('code', c.code);
    if (error) return setErr(error.message);
    load();
  };

  return (
    <div className="cp">
      <div className="cp-head">
        <h1 className="ad-h1">Coupons</h1>
        <button className="ad-btn ad-btn-primary" onClick={() => setForm({ ...EMPTY })}>
          <Icon name="plus" size={16} /> New coupon
        </button>
      </div>
      <p className="ad-muted">A code works at checkout as soon as it’s saved and live. The discount is a percentage of the items’ price, applied and checked on the server.</p>
      {err && <div className="ad-err">{err}</div>}

      {form && (
        <form className="ad-card cp-form" onSubmit={save}>
          <h2>{form.original ? `Edit ${form.original}` : 'New coupon'}</h2>
          <label>
            Code
            <input className="ad-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, '') })} placeholder="DIWALI10" maxLength={20} required autoFocus />
          </label>
          <label>
            Discount %
            <input className="ad-input" type="number" min={1} max={90} value={form.percent} onChange={(e) => setForm({ ...form, percent: e.target.value })} required />
          </label>
          <label>
            Starts (India time, optional)
            <input className="ad-input" type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
          </label>
          <label>
            Ends (India time, optional)
            <input className="ad-input" type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
          </label>
          <label className="cp-wide">
            Note (only you see this)
            <input className="ad-input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Diwali offer for Instagram followers" />
          </label>
          <label className="cp-check">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Switched on
          </label>
          <div className="cp-actions">
            <button className="ad-btn ad-btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save coupon'}
            </button>
            <button type="button" className="ad-btn" onClick={() => setForm(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {!list ? (
        <p className="ad-muted">Loading…</p>
      ) : !list.length ? (
        <p className="ad-muted">No coupons yet.</p>
      ) : (
        <div className="cp-list">
          {list.map((c) => {
            const [label, tone] = state(c);
            return (
              <div key={c.code} className="ad-card cp-item">
                <div className="cp-top">
                  <b className="cp-code">{c.code}</b>
                  <span className={`cp-st ${tone}`}>{label}</span>
                </div>
                <div className="cp-pct">{c.percent}% off</div>
                <small className="ad-muted">
                  {c.starts_at || c.ends_at ? `${c.starts_at ? new Date(c.starts_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Now'} → ${c.ends_at ? new Date(c.ends_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'no end'}` : 'No end date'}
                  {c.note ? ` · ${c.note}` : ''}
                </small>
                <div className="cp-actions">
                  <button className="ad-btn" onClick={() => toggle(c)}>
                    {c.active ? 'Switch off' : 'Switch on'}
                  </button>
                  <button className="ad-btn" onClick={() => setForm({ code: c.code, original: c.code, percent: c.percent, active: c.active, starts_at: toLocal(c.starts_at), ends_at: toLocal(c.ends_at), note: c.note || '' })}>
                    Edit
                  </button>
                  <button className="ad-btn cp-del" onClick={() => remove(c)} aria-label={`Delete ${c.code}`}>
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
