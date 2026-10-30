import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon, { WhatsAppGlyph } from '../components/Icon';
import { Seo } from '../lib/seo';
import { supabase } from '../lib/supabase';
import { waLink, mobile10, deliveryWindow } from '../lib/site';

// Customers find their order with its number and the mobile used at checkout.
const STEPS = [
  ['confirmed', 'Order confirmed', 'check'],
  ['processing', 'Being crafted', 'brush'],
  ['shipped', 'Shipped', 'truck'],
  ['delivered', 'Delivered', 'home'],
];
const RANK = { pending: 0, confirmed: 0, processing: 1, shipped: 2, delivered: 3 };

export default function Track() {
  const [sp] = useSearchParams();
  const [num, setNum] = useState(sp.get('order') || '');
  const [mob, setMob] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');

  const find = async (e) => {
    e.preventDefault();
    setErr('');
    setRes(null);
    if (!num.trim()) return setErr('Please enter your order number.');
    if (!/^[6-9]\d{9}$/.test(mobile10(mob))) return setErr('Please enter the 10-digit mobile number used for the order.');
    setBusy(true);
    const { data, error } = await supabase.rpc('track_order', { p_order: num.trim(), p_mobile: mobile10(mob) });
    setBusy(false);
    if (error) return setErr('Something went wrong. Please try again, or WhatsApp us.');
    if (!data) return setErr('We couldn’t find an order with that number and mobile. Please check both — the order number is in your confirmation message.');
    setRes(data);
  };

  const paid = res?.payment_status === 'paid';
  const cancelled = res?.order_status === 'cancelled';
  const at = paid ? RANK[res.order_status] ?? 0 : -1;
  const win = res ? deliveryWindow(new Date(res.placed_at)) : null;

  return (
    <>
      <Seo title="Track Your Order" description="Track your JHAYRA order with your order number and mobile number." path="/track" noindex />
      <section className="wrap wrap-narrow page-hero trk">
        <span className="eyebrow">Track my order</span>
        <h1 className="h1" style={{ marginTop: 14 }}>
          Where’s my frame?
        </h1>
        <p className="lead" style={{ marginTop: 10 }}>
          Enter your order number and the mobile number you used at checkout.
        </p>
        <form className="trk-form" onSubmit={find}>
          <label>
            <span>Order number</span>
            <input className="input" value={num} onChange={(e) => setNum(e.target.value.toUpperCase())} placeholder="JHY-20261030-123456" autoCapitalize="characters" spellCheck={false} />
          </label>
          <label>
            <span>Mobile number</span>
            <input className="input" type="tel" inputMode="tel" maxLength={16} value={mob} onChange={(e) => setMob(e.target.value)} autoComplete="tel-national" />
          </label>
          <button className="btn btn-gold btn-lg" disabled={busy}>
            {busy ? 'Finding your order…' : 'Track order'} <Icon name="arrow" size={17} />
          </button>
        </form>
        {err && (
          <p className="trk-err" role="alert">
            {err}
          </p>
        )}

        {res && (
          <div className="trk-card" aria-live="polite">
            <div className="trk-top">
              <div>
                <small>Order</small>
                <b>{res.order_number}</b>
              </div>
              <span className={`trk-badge ${cancelled ? 'bad' : paid ? 'ok' : 'wait'}`}>{cancelled ? 'Cancelled' : paid ? (res.order_status === 'delivered' ? 'Delivered' : res.order_status === 'shipped' ? 'On its way' : 'In progress') : 'Payment pending'}</span>
            </div>
            {!paid && !cancelled && <p className="muted">We haven’t received payment for this order yet. If money was deducted, please WhatsApp us with your order number.</p>}
            {paid && !cancelled && (
              <ol className="trk-steps">
                {STEPS.map(([k, l, ic], i) => (
                  <li key={k} className={i <= at ? 'done' : ''} style={{ '--i': i }}>
                    <i>
                      <Icon name={i <= at ? 'check' : ic} size={15} />
                    </i>
                    <span>{l}</span>
                  </li>
                ))}
              </ol>
            )}
            {paid && !cancelled && res.order_status !== 'delivered' && res.order_status !== 'shipped' && (
              <p className="trk-eta">
                <Icon name="truck" size={16} /> Estimated delivery <b>{win.early} – {win.late}</b>
              </p>
            )}
            {(res.tracking_url || res.tracking_number) && (
              <div className="trk-ship">
                <span>
                  {res.courier || 'Courier'}
                  {res.tracking_number ? ` · ${res.tracking_number}` : ''}
                </span>
                {res.tracking_url && (
                  <a className="btn btn-sm" href={res.tracking_url} target="_blank" rel="noopener noreferrer">
                    Live tracking <Icon name="arrow" size={14} />
                  </a>
                )}
              </div>
            )}
            {res.items?.length > 0 && (
              <ul className="trk-items">
                {res.items.map((it, i) => (
                  <li key={i}>
                    {it.name} <small className="muted">{[it.size, it.colour].filter(Boolean).join(' · ')} × {it.qty}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="trk-help">
          <a className="btn btn-ghost" href={waLink(`Hi JHAYRA! Could you update me on my order${num ? ` ${num}` : ''}?`)} target="_blank" rel="noopener noreferrer">
            <WhatsAppGlyph size={18} /> Ask us on WhatsApp
          </a>
          <Link to="/orders" className="link">
            Orders placed on this device
          </Link>
        </div>
      </section>
    </>
  );
}
