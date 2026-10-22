import { Link } from 'react-router-dom';
import Icon, { WhatsAppGlyph } from '../components/Icon';
import { Seo } from '../lib/seo';
import { localOrders } from '../state/store';
import { money, waLink, deliveryWindow } from '../lib/site';
import { JOURNEY } from './Checkout';

// Estimated stage from the order date: craft 0–2 days, QC/pack ~2–3, ship 3+, deliver ~9.
function stage(date) {
  const days = (Date.now() - new Date(date)) / 86400000;
  if (days < 1) return 1;
  if (days < 2) return 2;
  if (days < 3) return 3;
  if (days < 9) return 4;
  return 5;
}

export default function Orders() {
  const orders = localOrders();
  return (
    <>
      <Seo title="My Orders" path="/orders" noindex />
      <section className="wrap wrap-narrow page-hero">
        <span className="eyebrow">My orders</span>
        <h1 className="h1" style={{ marginTop: 14 }}>
          {orders.length ? 'Your orders' : 'No orders on this device yet'}
        </h1>
        <p className="lead" style={{ marginTop: 12 }}>
          {orders.length
            ? 'Estimated progress is shown below — we’ll send the exact tracking link on WhatsApp the moment your parcel ships.'
            : 'Ordered on another phone, or on WhatsApp? Message us your name or order number and we’ll update you instantly.'}
        </p>
      </section>
      <section className="wrap wrap-narrow" style={{ paddingBottom: 80 }}>
        {orders.map((o) => {
          const st = stage(o.date);
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
                <span className="pill pill-gold">{JOURNEY[st][0]} (est.)</span>
              </header>
              <ol className="journey journey-light">
                {JOURNEY.map(([label, ic], i) => (
                  <li key={label} className={i < st ? 'done' : i === st ? 'next' : ''}>
                    <span>
                      <Icon name={ic} size={15} />
                    </span>
                    {label}
                  </li>
                ))}
              </ol>
              <ul className="order-items">
                {o.items.map((it, i) => (
                  <li key={i}>
                    {it.name} <span className="muted">— {it.option?.size}, {it.option?.colour} × {it.qty}</span>
                  </li>
                ))}
              </ul>
              <footer>
                <span className="small muted">Expected {win.early} – {win.late}</span>
                <a className="btn btn-wa btn-sm" href={waLink(`Hi JHAYRA! Could you update me on order ${o.orderNumber}?`)} target="_blank" rel="noopener noreferrer">
                  <WhatsAppGlyph size={16} /> Get live status
                </a>
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
