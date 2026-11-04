import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon, { WhatsAppGlyph } from '../components/Icon';
import { Seo } from '../lib/seo';
import { supabase } from '../lib/supabase';
import { localOrders } from '../state/store';
import { money, waLink, deliveryWindow } from '../lib/site';
import { JOURNEY } from './Checkout';

// Real progress from the order's status on our server (the same lookup as
// /track: order number + the mobile used at checkout). Orders saved before the
// mobile was stored on this device link to /track instead of guessing.
const STEP = { pending: 0, confirmed: 0, personalization: 1, processing: 1, shipped: 4, delivered: 5 };

function useLive(orders) {
  const [live, setLive] = useState({});
  useEffect(() => {
    let on = true;
    orders
      .filter((o) => o.mobile && o.orderNumber)
      .forEach((o) => {
        supabase
          .rpc('track_order', { p_order: o.orderNumber, p_mobile: o.mobile })
          .then(({ data }) => on && data && setLive((m) => ({ ...m, [o.orderNumber]: data })))
          .catch(() => {});
      });
    return () => {
      on = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return live;
}

function statusLabel(r) {
  if (!r) return null;
  if (r.order_status === 'cancelled') return ['Cancelled', 'pill'];
  if (r.payment_status !== 'paid') return ['Payment pending', 'pill'];
  if (r.order_status === 'delivered') return ['Delivered', 'pill pill-gold'];
  if (r.order_status === 'shipped') return ['Shipped', 'pill pill-gold'];
  return [STEP[r.order_status] >= 1 ? 'Being crafted' : 'Confirmed', 'pill pill-gold'];
}

export default function Orders() {
  const orders = localOrders();
  const live = useLive(orders);
  return (
    <>
      <Seo title="My Orders" path="/orders" noindex />
      <section className="wrap wrap-narrow page-hero">
        <span className="eyebrow">My orders</span>
        <h1 className="h1" style={{ marginTop: 14 }}>
          {orders.length ? 'Your orders' : 'No orders on this device yet'}
        </h1>
        <p className="lead" style={{ marginTop: 12 }}>
          {orders.length ? 'Live status from our workshop — we also send the tracking link on WhatsApp the moment your parcel ships.' : 'Ordered on another phone or computer? Find any order with its order number and the mobile number used at checkout.'}
        </p>
        <Link to="/track" className="btn btn-ghost" style={{ marginTop: 18 }}>
          <Icon name="truck" size={17} /> Track an order from another device
        </Link>
      </section>
      <section className="wrap wrap-narrow" style={{ paddingBottom: 80 }}>
        {orders.map((o) => {
          const r = live[o.orderNumber];
          const lab = statusLabel(r);
          const paid = r?.payment_status === 'paid' && r.order_status !== 'cancelled';
          const st = paid ? STEP[r.order_status] ?? 0 : -1;
          const win = deliveryWindow(new Date(o.date));
          return (
            <article key={o.orderId} className="card order">
              <header>
                <div>
                  <b>{o.orderNumber}</b>
                  <small>
                    {new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {money(o.amount)}
                  </small>
                </div>
                {lab && <span className={lab[1]}>{lab[0]}</span>}
              </header>
              {paid && (
                <ol className="journey journey-light">
                  {JOURNEY.map(([label, ic], i) => (
                    <li key={label} className={i <= st ? 'done' : i === st + 1 ? 'next' : ''}>
                      <span>
                        <Icon name={ic} size={15} />
                      </span>
                      {label}
                    </li>
                  ))}
                </ol>
              )}
              {r?.tracking_url && (
                <p className="small">
                  {r.courier || 'Courier'}
                  {r.tracking_number ? ` · ${r.tracking_number}` : ''} ·{' '}
                  <a href={r.tracking_url} target="_blank" rel="noopener noreferrer">
                    Live tracking
                  </a>
                </p>
              )}
              <ul className="order-items">
                {o.items.map((it, i) => (
                  <li key={i}>
                    {it.name} <span className="muted">— {it.option?.size}, {it.option?.colour} × {it.qty}</span>
                  </li>
                ))}
              </ul>
              <footer>
                <span className="small muted">{r?.order_status === 'delivered' ? 'Delivered' : `Expected ${win.early} – ${win.late}`}</span>
                {r ? (
                  <a className="btn btn-wa btn-sm" href={waLink(`Hi JHAYRA! A question about order ${o.orderNumber}.`)} target="_blank" rel="noopener noreferrer">
                    <WhatsAppGlyph size={16} /> Ask us
                  </a>
                ) : (
                  <Link className="btn btn-sm" to={`/track?order=${encodeURIComponent(o.orderNumber)}`}>
                    Check live status <Icon name="arrow" size={14} />
                  </Link>
                )}
              </footer>
            </article>
          );
        })}
        {!orders.length && (
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <a className="btn btn-wa" href={waLink('Hi JHAYRA! Could you update me on my order? My name is ')} target="_blank" rel="noopener noreferrer">
              <WhatsAppGlyph size={18} /> Ask on WhatsApp
            </a>
            <Link to="/shop" className="btn btn-ghost">
              Start shopping
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
