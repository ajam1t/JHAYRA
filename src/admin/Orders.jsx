import { Fragment, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { money, waLink } from '../lib/site';

const STATUSES = ['pending', 'confirmed', 'personalization', 'processing', 'shipped', 'delivered', 'cancelled'];

function Customization({ c }) {
  if (!c) return null;
  const rows = [];
  if (c.source) rows.push(['Type', c.source === 'template' ? `Template: ${c.templateTitle || c.templateId}` : c.source === 'product-replace' ? `Own photo in “${c.productName}”` : c.source === 'scratch-builder' ? 'Custom photo frame' : c.source === 'living-studio' ? 'Living Art Studio' : c.source]);
  if (c.treatment) rows.push(['Treatment', c.treatment]);
  if (c.printReady) rows.push(['Print file', 'Ready to print — first image is the final cropped, treated, captioned artwork']);
  if (c.material) rows.push(['Finish', c.material]);
  if (c.texts) Object.entries(c.texts).forEach(([k, v]) => v && rows.push([k, v]));
  if (c.design) rows.push(['Design', `${c.design.layout} · ${c.design.photos} photos · ${c.design.palette} · ${(c.design.decorations || []).join(', ')}`]);
  if (c.gift) rows.push(['🎁 Gift', `To: ${c.gift.to || '—'} · From: ${c.gift.from || '—'}${c.gift.hidePrice ? ' · HIDE PRICES' : ''}`], ['Gift note', c.gift.note || '—']);
  if (c.gallerySet) rows.push(['Set', 'Part of a gallery wall']);
  return (
    <dl className="ad-dl">
      {rows.map(([k, v], i) => (
        <Fragment key={i}>
          <dt>{k}</dt>
          <dd>{String(v)}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [open, setOpen] = useState(null);
  const [items, setItems] = useState({});
  const [urls, setUrls] = useState({});
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState('paid');
  const [q, setQ] = useState('');

  useEffect(() => {
    supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300)
      .then(({ data, error }) => {
        if (error) setErr(error.message);
        setOrders(data || []);
      });
  }, []);

  const list = useMemo(() => {
    let l = orders || [];
    if (filter === 'paid') l = l.filter((o) => o.payment_status === 'paid');
    else if (filter === 'toship') l = l.filter((o) => o.payment_status === 'paid' && !['shipped', 'delivered', 'cancelled'].includes(o.order_status));
    if (q) {
      const s = q.toLowerCase();
      l = l.filter((o) => [o.order_number, o.customer_name, o.customer_mobile, o.city, o.pin].join(' ').toLowerCase().includes(s));
    }
    return l;
  }, [orders, filter, q]);

  async function toggle(id) {
    if (open === id) return setOpen(null);
    setOpen(id);
    if (items[id]) return;
    const { data } = await supabase.from('order_items').select('*').eq('order_id', id);
    setItems((x) => ({ ...x, [id]: data || [] }));
    const paths = (data || []).flatMap((i) => (Array.isArray(i.artwork_paths) ? i.artwork_paths : []));
    const signed = await Promise.all(paths.map(async (p) => [p, (await supabase.storage.from('customer-artwork').createSignedUrl(p, 3600)).data?.signedUrl]));
    setUrls((u) => ({ ...u, ...Object.fromEntries(signed.filter(([, s]) => s)) }));
  }

  async function download(path) {
    const { data, error } = await supabase.storage.from('customer-artwork').createSignedUrl(path, 3600, { download: path.split('/').pop() });
    if (error || !data?.signedUrl) return setErr(`Could not download: ${error?.message || 'not found'}`);
    window.location.href = data.signedUrl;
  }

  async function setStatus(id, status) {
    setErr('');
    const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', id);
    if (error) return setErr(`Could not update: ${error.message}`);
    setOrders((l) => l.map((o) => (o.id === id ? { ...o, order_status: status } : o)));
  }

  if (!orders) return <div className="ad-muted">Loading orders…</div>;
  return (
    <>
      <h1 className="ad-h1">Orders</h1>
      {err && <div className="ad-err">{err}</div>}
      <div className="ad-toolbar">
        {[
          ['paid', 'Paid'],
          ['toship', 'To ship'],
          ['all', 'All (incl. unpaid)'],
        ].map(([v, l]) => (
          <button key={v} className={`ad-chip ${filter === v ? 'on' : ''}`} onClick={() => setFilter(v)}>
            {l}
          </button>
        ))}
        <input className="ad-input" placeholder="Search name, phone, order no, pincode" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="ad-card" style={{ padding: 0 }}>
        <table className="ad-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <Fragment key={o.id}>
                <tr className="ad-click" onClick={() => toggle(o.id)}>
                  <td>
                    <b>{o.order_number || o.id.slice(0, 8)}</b>
                  </td>
                  <td>
                    {o.customer_name}
                    <div className="ad-muted">{o.customer_mobile}</div>
                  </td>
                  <td>{money(o.total_amount)}</td>
                  <td>
                    <span className={`ad-badge s-${o.payment_status}`}>{o.payment_status}</span>
                  </td>
                  <td>
                    <span className="ad-badge">{o.order_status}</span>
                  </td>
                  <td className="ad-muted">{new Date(o.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                </tr>
                {open === o.id && (
                  <tr>
                    <td colSpan={6} className="ad-detail">
                      <div className="ad-detail-grid">
                        <div>
                          <h3>Deliver to</h3>
                          <p>
                            {o.customer_name}
                            <br />
                            {o.address}
                            <br />
                            {o.city}
                            {o.state ? `, ${o.state}` : ''} – {o.pin}
                            <br />
                            {o.customer_mobile} {o.customer_email && `· ${o.customer_email}`}
                          </p>
                          <a className="ad-btn" href={waLink(`Hi ${o.customer_name}, this is JHAYRA about your order ${o.order_number || ''}.`).replace('917070728989', '91' + String(o.customer_mobile || '').replace(/\D/g, '').slice(-10))} target="_blank" rel="noreferrer">
                            WhatsApp customer
                          </a>
                          <h3 style={{ marginTop: 18 }}>Payment</h3>
                          <p className="ad-muted">
                            Subtotal {money(o.subtotal)} {o.discount_amount > 0 && `· −${money(o.discount_amount)} (${o.coupon_code})`} · Total {money(o.total_amount)}
                            <br />
                            {o.razorpay_payment_id || o.razorpay_order_id} {o.paid_at && `· paid ${new Date(o.paid_at).toLocaleString('en-IN')}`}
                            {o.failure_reason && <><br />Failure: {o.failure_reason}</>}
                          </p>
                          <h3 style={{ marginTop: 18 }}>Update status</h3>
                          <div className="ad-toolbar">
                            {STATUSES.map((s) => (
                              <button key={s} className={`ad-chip ${o.order_status === s ? 'on' : ''}`} onClick={() => setStatus(o.id, s)}>
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h3>Items</h3>
                          {!items[o.id] && <p className="ad-muted">Loading…</p>}
                          {(items[o.id] || []).map((it) => (
                            <div key={it.id} className="ad-item">
                              <b>
                                {it.name || it.product_name} × {it.quantity}
                              </b>
                              <div className="ad-muted">
                                {it.frame_size} · {it.frame_colour} · {it.frame_orientation} · {money(it.unit_price)} each
                              </div>
                              <Customization c={it.customization} />
                              {Array.isArray(it.artwork_paths) && it.artwork_paths.length > 0 && (
                                <div className="ad-art">
                                  {it.artwork_paths.map((p) => (
                                    <div key={p}>
                                      {urls[p] ? <img src={urls[p]} alt="" /> : <span className="ad-muted">…</span>}
                                      {it.customization?.artworkMeta?.find((m) => m.path === p)?.role && <small className="ad-muted">{it.customization.artworkMeta.find((m) => m.path === p).role}</small>}
                                      <button className="ad-btn" onClick={() => download(p)}>
                                        Download original
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {!list.length && (
              <tr>
                <td colSpan={6} className="ad-muted" style={{ padding: 24 }}>
                  No orders here yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
