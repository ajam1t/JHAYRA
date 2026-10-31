import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Icon from '../components/Icon';
import { getMaster, uploadMaster, downloadPrivate, downloadPublic, dpiFor, dpiLabel, dpiTone } from './printMaster';

// Print folder: everything needed to print each order, grouped by order.
// · Personalised orders → the customer's photos, original full resolution.
// · Catalogue artwork (e.g. Radha Krishna) → the website artwork, plus your own
//   HD print file for that product if you've added one (kept private).
// Every download is named after the order so each print matches its order.
// Only confirmed (paid) orders are shown — unpaid or abandoned checkouts never appear.
const TABS = [
  ['print', 'To print'],
  ['done', 'Shipped & delivered'],
];
const ext = (p) => (p.split('?')[0].split('.').pop() || 'jpg').toLowerCase();
const base = (o) => o.order_number || `order-${o.id.slice(0, 8)}`;

function Sized({ src, onSize }) {
  return src ? <img src={src} alt="" loading="lazy" onLoad={(e) => onSize?.(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)} /> : <span className="ad-muted">…</span>;
}

export default function Photos() {
  const [orders, setOrders] = useState(null);
  const [items, setItems] = useState({});
  const [urls, setUrls] = useState({});
  const [art, setArt] = useState({}); // productId → [{url}]
  const [masters, setMasters] = useState({}); // productId → master | null
  const [masterUrls, setMasterUrls] = useState({});
  const [dims, setDims] = useState({});
  const [tab, setTab] = useState('print');
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');

  const loadMaster = async (pid) => {
    const m = await getMaster(pid);
    setMasters((x) => ({ ...x, [pid]: m }));
    if (m) {
      const { data } = await supabase.storage.from('customer-artwork').createSignedUrl(m.path, 3600);
      if (data?.signedUrl) setMasterUrls((x) => ({ ...x, [pid]: data.signedUrl }));
    }
  };

  useEffect(() => {
    (async () => {
      const { data: ords, error: oe } = await supabase.from('orders').select('id, order_number, customer_name, customer_mobile, created_at, payment_status, order_status').eq('payment_status', 'paid').neq('order_status', 'cancelled').order('created_at', { ascending: false }).limit(300);
      if (oe) return setErr(oe.message);
      const ids = (ords || []).map((o) => o.id);
      let its = [];
      for (let s = 0; s < ids.length; s += 100) {
        const { data, error } = await supabase.from('order_items').select('id, order_id, product_id, name, quantity, frame_size, frame_colour, artwork_paths, customization').in('order_id', ids.slice(s, s + 100));
        if (error) return setErr(error.message);
        its = its.concat(data || []);
      }
      const by = {};
      its.forEach((i) => (by[i.order_id] = [...(by[i.order_id] || []), i]));
      setItems(by);
      setOrders((ords || []).filter((o) => by[o.id]?.length));
      // customer photos
      const paths = its.flatMap((i) => (Array.isArray(i.artwork_paths) ? i.artwork_paths : []));
      for (let s = 0; s < paths.length; s += 100) {
        const { data } = await supabase.storage.from('customer-artwork').createSignedUrls(paths.slice(s, s + 100), 3600);
        setUrls((u) => ({ ...u, ...Object.fromEntries((data || []).filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl])) }));
      }
      // catalogue artwork + HD print files
      const pids = [...new Set(its.filter((i) => !(Array.isArray(i.artwork_paths) && i.artwork_paths.length) && i.product_id).map((i) => i.product_id))];
      if (pids.length) {
        const { data: imgs } = await supabase.from('product_images').select('product_id, url, is_primary, display_order').in('product_id', pids);
        const g = {};
        (imgs || []).sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || (a.display_order || 0) - (b.display_order || 0)).forEach((im) => (g[im.product_id] = [...(g[im.product_id] || []), im]));
        setArt(g);
        pids.forEach(loadMaster);
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
      return !s || [o.order_number, o.customer_name, o.customer_mobile].join(' ').toLowerCase().includes(s);
    });
  }, [orders, tab, q]);

  // every file for an order, in print order
  const filesFor = (o) =>
    (items[o.id] || []).flatMap((it, i) => {
      const n = i + 1;
      if (Array.isArray(it.artwork_paths) && it.artwork_paths.length) return it.artwork_paths.map((p, k) => ({ kind: 'private', path: p, name: `${base(o)}_item${n}_photo${k + 1}.${ext(p)}` }));
      const m = masters[it.product_id];
      if (m) return [{ kind: 'private', path: m.path, name: `${base(o)}_item${n}_print-file.${ext(m.path)}` }];
      const a = art[it.product_id]?.[0];
      return a ? [{ kind: 'public', url: a.url, name: `${base(o)}_item${n}_artwork.${ext(a.url)}` }] : [];
    });
  const get = async (f) => {
    try {
      if (f.kind === 'private') await downloadPrivate(f.path, f.name);
      else await downloadPublic(f.url, f.name);
    } catch (e) {
      setErr(`Could not download ${f.name}: ${e?.message || 'error'}`);
    }
  };
  async function downloadOrder(o) {
    setBusy(o.id);
    for (const f of filesFor(o)) {
      await get(f);
      await new Promise((r) => setTimeout(r, 700));
    }
    setBusy('');
  }
  async function addMaster(pid, file) {
    if (!file) return;
    setBusy(pid);
    setErr('');
    try {
      await uploadMaster(pid, file);
      await loadMaster(pid);
    } catch (e) {
      setErr(`Upload failed: ${e.message}`);
    }
    setBusy('');
  }
  const setDim = (key) => (w, h) => setDims((d) => (d[key]?.w === w ? d : { ...d, [key]: { w, h } }));

  return (
    <div className="ph">
      <div className="ph-head">
        <h1 className="ad-h1">Photos &amp; print files</h1>
        <p className="ad-muted">Confirmed (paid) orders only — everything needed to print each one. Personalised orders show the customer’s photos in the original resolution they uploaded. Catalogue artwork (e.g. Radha Krishna) shows the website artwork and your own HD print file, if you’ve added one. Downloads are named by order number, e.g. JHY-20261031-756674_item1_photo1.jpg.</p>
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
        <p className="ad-muted">{tab === 'print' ? 'Nothing waiting to print. As soon as an order is paid and confirmed, its photos appear here.' : 'No shipped orders yet.'}</p>
      ) : (
        list.map((o) => (
          <section key={o.id} className="ad-card ph-order">
            <div className="ph-order-head">
              <div>
                <b className="ph-num">
                  <Icon name="image" size={16} /> {base(o)}
                </b>
                <div className="ad-muted">
                  {o.customer_name} · {new Date(o.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>
              <div className="ph-order-act">
                <span className={`ad-badge s-${o.payment_status}`}>{o.payment_status}</span>
                <span className="ad-badge">{o.order_status}</span>
                <button className="ad-btn ad-btn-primary" disabled={busy === o.id || !filesFor(o).length} onClick={() => downloadOrder(o)}>
                  <Icon name="download" size={16} /> {busy === o.id ? 'Downloading…' : `Download all (${filesFor(o).length})`}
                </button>
                <Link className="ad-btn" to={`/admin/orders?filter=all&q=${encodeURIComponent(o.order_number || '')}`}>
                  Order
                </Link>
              </div>
            </div>
            {(items[o.id] || []).map((it, i) => {
              const n = i + 1;
              const own = Array.isArray(it.artwork_paths) && it.artwork_paths.length;
              const pid = it.product_id;
              const web = art[pid]?.[0];
              const m = masters[pid];
              return (
                <div key={it.id} className="ph-item">
                  <div className="ph-item-name">
                    Item {n} · {it.name} × {it.quantity}
                    <span className="ad-muted">
                      {' '}
                      · {[it.frame_size, it.frame_colour].filter(Boolean).join(' · ') || 'size in order'}
                      {it.customization?.templateTitle ? ` · ${it.customization.templateTitle}` : ''}
                      {own ? ' · customer photos' : pid ? ' · catalogue artwork' : ''}
                    </span>
                  </div>
                  <div className="ph-grid">
                    {own
                      ? it.artwork_paths.map((p, k) => {
                          const meta = it.customization?.artworkMeta?.find((x) => x.path === p);
                          const w = meta?.width || dims[p]?.w;
                          const h = meta?.height || dims[p]?.h;
                          const d = dpiFor(it.frame_size, w, h);
                          return (
                            <figure key={p} className="ph-photo">
                              <div className="ph-thumb">
                                <Sized src={urls[p]} onSize={setDim(p)} />
                              </div>
                              <figcaption>
                                <b>{k === 0 && it.customization?.printReady ? 'Print file' : `Photo ${k + 1}`}</b>
                                <small className="ad-muted">{w ? `${w}×${h} px` : 'Original size'}</small>
                                {d != null && <small className={`ph-dpi ${dpiTone(d)}`}>{dpiLabel(d)}</small>}
                                <button className="ad-btn" onClick={() => get({ kind: 'private', path: p, name: `${base(o)}_item${n}_photo${k + 1}.${ext(p)}` })}>
                                  <Icon name="download" size={15} /> HD
                                </button>
                              </figcaption>
                            </figure>
                          );
                        })
                      : pid && (
                          <>
                            {web && (
                              <figure className="ph-photo">
                                <div className="ph-thumb">
                                  <Sized src={web.url} onSize={setDim(web.url)} />
                                </div>
                                <figcaption>
                                  <b>Website artwork</b>
                                  <small className="ad-muted">{dims[web.url] ? `${dims[web.url].w}×${dims[web.url].h} px` : '…'}</small>
                                  {dims[web.url] && <small className={`ph-dpi ${dpiTone(dpiFor(it.frame_size, dims[web.url].w, dims[web.url].h))}`}>{dpiLabel(dpiFor(it.frame_size, dims[web.url].w, dims[web.url].h))}</small>}
                                  <button className="ad-btn" onClick={() => get({ kind: 'public', url: web.url, name: `${base(o)}_item${n}_artwork.${ext(web.url)}` })}>
                                    <Icon name="download" size={15} /> Download
                                  </button>
                                </figcaption>
                              </figure>
                            )}
                            <figure className={`ph-photo ${m ? '' : 'ph-empty'}`}>
                              <div className="ph-thumb">{m ? <Sized src={masterUrls[pid]} onSize={setDim('m:' + pid)} /> : <Icon name="upload" size={28} />}</div>
                              <figcaption>
                                <b>HD print file</b>
                                {m ? (
                                  <>
                                    <small className="ad-muted">{dims['m:' + pid] ? `${dims['m:' + pid].w}×${dims['m:' + pid].h} px` : 'Loading size…'}</small>
                                    {dims['m:' + pid] && <small className={`ph-dpi ${dpiTone(dpiFor(it.frame_size, dims['m:' + pid].w, dims['m:' + pid].h))}`}>{dpiLabel(dpiFor(it.frame_size, dims['m:' + pid].w, dims['m:' + pid].h))}</small>}
                                    <button className="ad-btn ad-btn-primary" onClick={() => get({ kind: 'private', path: m.path, name: `${base(o)}_item${n}_print-file.${ext(m.path)}` })}>
                                      <Icon name="download" size={15} /> HD
                                    </button>
                                  </>
                                ) : (
                                  <small className="ad-muted">Not added yet — add your original high-resolution artwork once and it’s ready for every future order.</small>
                                )}
                                <label className="ad-btn">
                                  {busy === pid ? 'Uploading…' : m ? 'Replace' : 'Add HD file'}
                                  <input type="file" accept="image/*,.tif,.tiff,.pdf" hidden onChange={(e) => addMaster(pid, e.target.files?.[0])} />
                                </label>
                              </figcaption>
                            </figure>
                          </>
                        )}
                    {!own && !pid && <p className="ad-muted">No photo or artwork attached to this item — see the order for its design details.</p>}
                  </div>
                </div>
              );
            })}
          </section>
        ))
      )}
    </div>
  );
}
