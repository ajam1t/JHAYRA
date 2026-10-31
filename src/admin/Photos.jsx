import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Icon from '../components/Icon';

// Print folder: every customer photo, grouped by order, ready to download in
// full resolution. Files are the customers' original uploads (never resized),
// named after the order so each print can be traced back to it.
const TABS = [
  ['print', 'To print'],
  ['done', 'Shipped & delivered'],
  ['unpaid', 'Not paid'],
  ['all', 'All'],
];
const fileName = (o, itemNo, photoNo, path) => `${o.order_number || `order-${o.id.slice(0, 8)}`}_item${itemNo}_photo${photoNo}.${(path.split('.').pop() || 'jpg').toLowerCase()}`;
const mp = (m) => (m?.width && m?.height ? ((m.width * m.height) / 1e6).toFixed(1) : null);

export default function Photos() {
  const [orders, setOrders] = useState(null);
  const [items, setItems] = useState({});
  const [urls, setUrls] = useState({});
  const [tab, setTab] = useState('print');
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    (async () => {
      const { data: its, error } = await supabase.from('order_items').select('id, order_id, name, product_name, quantity, frame_size, frame_colour, artwork_paths, customization').not('artwork_paths', 'is', null).order('id');
      if (error) return setErr(error.message);
      const withPhotos = (its || []).filter((i) => Array.isArray(i.artwork_paths) && i.artwork_paths.length);
      const ids = [...new Set(withPhotos.map((i) => i.order_id))];
      if (!ids.length) return setOrders([]);
      const { data: ords, error: oe } = await supabase.from('orders').select('id, order_number, customer_name, customer_mobile, created_at, payment_status, order_status').in('id', ids).order('created_at', { ascending: false });
      if (oe) return setErr(oe.message);
      const by = {};
      withPhotos.forEach((i) => (by[i.order_id] = [...(by[i.order_id] || []), i]));
      setItems(by);
      setOrders(ords || []);
      // thumbnails (signed links, valid for an hour)
      const paths = withPhotos.flatMap((i) => i.artwork_paths);
      for (let s = 0; s < paths.length; s += 100) {
        const { data } = await supabase.storage.from('customer-artwork').createSignedUrls(paths.slice(s, s + 100), 3600);
        setUrls((u) => ({ ...u, ...Object.fromEntries((data || []).filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl])) }));
      }
    })();
  }, []);

  const list = useMemo(() => {
    if (!orders) return [];
    const s = q.trim().toLowerCase();
    return orders.filter((o) => {
      const paid = o.payment_status === 'paid';
      const done = ['shipped', 'delivered'].includes(o.order_status);
      if (tab === 'print' && !(paid && !done && o.order_status !== 'cancelled')) return false;
      if (tab === 'done' && !(paid && done)) return false;
      if (tab === 'unpaid' && paid) return false;
      return !s || [o.order_number, o.customer_name, o.customer_mobile].join(' ').toLowerCase().includes(s);
    });
  }, [orders, tab, q]);

  async function download(path, name) {
    const { data, error } = await supabase.storage.from('customer-artwork').createSignedUrl(path, 3600, { download: name });
    if (error || !data?.signedUrl) return setErr(`Could not download: ${error?.message || 'not found'}`);
    const a = document.createElement('a');
    a.href = data.signedUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  async function downloadOrder(o) {
    setBusy(o.id);
    const files = (items[o.id] || []).flatMap((it, i) => it.artwork_paths.map((p, k) => [p, fileName(o, i + 1, k + 1, p)]));
    for (const [p, n] of files) {
      await download(p, n);
      await new Promise((r) => setTimeout(r, 700));
    }
    setBusy('');
  }

  const count = (o) => (items[o.id] || []).reduce((a, i) => a + i.artwork_paths.length, 0);

  return (
    <div className="ph">
      <div className="ph-head">
        <h1 className="ad-h1">Photos</h1>
        <p className="ad-muted">Every customer photo, grouped by order, in the original full resolution the customer uploaded. Downloads are named by order number — e.g. JHY-20261031-756674_item1_photo1.jpg — so each print matches its order.</p>
      </div>
      <div className="ph-bar">
        <div className="ad-toolbar">
          {TABS.map(([k, l]) => (
            <button key={k} className={`ad-chip ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>
              {l}
            </button>
          ))}
        </div>
        <input className="ad-input ph-search" placeholder="Search order number, name or mobile" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {err && <div className="ad-err">{err}</div>}
      {!orders ? (
        <p className="ad-muted">Loading…</p>
      ) : !list.length ? (
        <p className="ad-muted">{tab === 'print' ? 'Nothing waiting to print. New paid orders with photos appear here automatically.' : 'No orders with photos here.'}</p>
      ) : (
        list.map((o) => (
          <section key={o.id} className="ad-card ph-order">
            <div className="ph-order-head">
              <div>
                <b className="ph-num">
                  <Icon name="image" size={16} /> {o.order_number || o.id.slice(0, 8)}
                </b>
                <div className="ad-muted">
                  {o.customer_name} · {new Date(o.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · {count(o)} photo{count(o) === 1 ? '' : 's'}
                </div>
              </div>
              <div className="ph-order-act">
                <span className={`ad-badge s-${o.payment_status}`}>{o.payment_status}</span>
                <span className="ad-badge">{o.order_status}</span>
                <button className="ad-btn ad-btn-primary" disabled={busy === o.id} onClick={() => downloadOrder(o)}>
                  <Icon name="download" size={16} /> {busy === o.id ? 'Downloading…' : 'Download all'}
                </button>
                <Link className="ad-btn" to={`/admin/orders?filter=all&q=${encodeURIComponent(o.order_number || '')}`}>
                  Order
                </Link>
              </div>
            </div>
            {(items[o.id] || []).map((it, i) => (
              <div key={it.id} className="ph-item">
                <div className="ph-item-name">
                  Item {i + 1} · {it.name || it.product_name} × {it.quantity}
                  <span className="ad-muted">
                    {' '}
                    · {[it.frame_size, it.frame_colour].filter(Boolean).join(' · ')}
                    {it.customization?.templateTitle ? ` · ${it.customization.templateTitle}` : ''}
                  </span>
                </div>
                <div className="ph-grid">
                  {it.artwork_paths.map((p, k) => {
                    const meta = it.customization?.artworkMeta?.find((m) => m.path === p);
                    const name = fileName(o, i + 1, k + 1, p);
                    const isPrint = k === 0 && it.customization?.printReady;
                    return (
                      <figure key={p} className="ph-photo">
                        <div className="ph-thumb">{urls[p] ? <img src={urls[p]} alt="" loading="lazy" /> : <span className="ad-muted">…</span>}</div>
                        <figcaption>
                          <b>{isPrint ? 'Print file' : `Photo ${k + 1}`}</b>
                          <small className="ad-muted">{meta?.width ? `${meta.width}×${meta.height} px · ${mp(meta)} MP` : 'Original size'}</small>
                          <button className="ad-btn" onClick={() => download(p, name)}>
                            <Icon name="download" size={15} /> HD
                          </button>
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
