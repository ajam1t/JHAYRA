import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabase';
import { money } from '../lib/site';
import SETUP_SQL from '../../docs/sql/analytics.sql?raw';

const DAY = 86400000;
const IST = 5.5 * 3600000;
// Midnight India time, as a Date.
const istMidnight = (t = Date.now()) => new Date(Math.floor((t + IST) / DAY) * DAY - IST);
const istDay = (d) => new Date(new Date(d).getTime() + IST).toISOString().slice(0, 10);
const PERIODS = [
  ['today', 'Today', 1],
  ['7d', '7 days', 7],
  ['30d', '30 days', 30],
  ['90d', '90 days', 90],
];
const num = (n) => Math.round(Number(n) || 0).toLocaleString('en-IN');
const pct = (a, b) => (b ? `${((a / b) * 100).toFixed(1)}%` : '—');

function range(days) {
  const to = new Date(istMidnight().getTime() + DAY);
  const from = new Date(to.getTime() - days * DAY);
  const prev = new Date(from.getTime() - days * DAY);
  return { from, to, prev };
}

function Delta({ now, before }) {
  if (before === undefined || before === null) return null;
  if (!before) return now ? <span className="db-delta up">new</span> : null;
  const d = ((now - before) / before) * 100;
  if (Math.abs(d) < 0.5) return <span className="db-delta">±0%</span>;
  return (
    <span className={`db-delta ${d > 0 ? 'up' : 'down'}`}>
      {d > 0 ? '▲' : '▼'} {Math.abs(d).toFixed(0)}%
    </span>
  );
}

function Kpi({ icon, label, value, now, before, hint, tone }) {
  return (
    <div className={`db-kpi ${tone || ''}`}>
      <span className="db-kpi-ic">
        <Icon name={icon} size={18} />
      </span>
      <span className="db-kpi-label">{label}</span>
      <b className="db-kpi-val">{value}</b>
      <span className="db-kpi-foot">
        <Delta now={now} before={before} />
        {hint && <small>{hint}</small>}
      </span>
    </div>
  );
}

// Column chart for daily series, with a value bubble on hover/tap.
function Columns({ days, series, format = num, label }) {
  const [hi, setHi] = useState(null);
  const max = Math.max(1, ...days.map((d) => Math.max(...series.map((s) => d[s.key] || 0))));
  const total = days.reduce((a, d) => a + (d[series[0].key] || 0), 0);
  return (
    <div className="db-chart" role="img" aria-label={`${label}: ${format(total)} in total over ${days.length} days`}>
      <div className="db-cols" style={{ '--n': days.length }} onMouseLeave={() => setHi(null)}>
        {days.map((d, i) => (
          <button type="button" key={d.day} className={`db-col ${hi === i ? 'on' : ''}`} onMouseEnter={() => setHi(i)} onFocus={() => setHi(i)} onClick={() => setHi(i)} aria-label={`${d.label}: ${series.map((s) => `${format(d[s.key] || 0)} ${s.name}`).join(', ')}`}>
            {series.map((s) => (
              <span key={s.key} className={`db-bar ${s.cls}`} style={{ height: `${((d[s.key] || 0) / max) * 100}%` }} />
            ))}
          </button>
        ))}
      </div>
      <div className="db-axis">
        <span>{days[0]?.label}</span>
        {days.length > 2 && <span>{days[Math.floor(days.length / 2)]?.label}</span>}
        <span>{days[days.length - 1]?.label}</span>
      </div>
      <div className="db-chart-tip" aria-hidden="true">
        {hi !== null ? (
          <>
            <b>{days[hi].label}</b>
            {series.map((s) => (
              <span key={s.key}>
                <i className={s.cls} /> {format(days[hi][s.key] || 0)} {s.name}
              </span>
            ))}
          </>
        ) : (
          <span className="ad-muted">Tap a day for details</span>
        )}
      </div>
    </div>
  );
}

function Bars({ rows, value, label, render, empty = 'No data yet' }) {
  const max = Math.max(1, ...rows.map(value));
  if (!rows.length) return <p className="ad-muted db-empty">{empty}</p>;
  return (
    <ul className="db-bars">
      {rows.map((r, i) => (
        <li key={i}>
          <span className="db-bars-fill" style={{ width: `${(value(r) / max) * 100}%` }} />
          <span className="db-bars-label">{render ? render(r) : label(r)}</span>
          <b>{num(value(r))}</b>
        </li>
      ))}
    </ul>
  );
}

// Google's Core Web Vitals thresholds: [good up to, poor above].
const VITALS = [
  ['lcp', 'Largest paint', 'How fast the main content appears', [2500, 4000], (v) => `${(v / 1000).toFixed(2)} s`],
  ['inp', 'Interaction', 'How quickly taps and clicks respond', [200, 500], (v) => `${Math.round(v)} ms`],
  ['cls', 'Layout shift', 'How much the page jumps while loading', [0.1, 0.25], (v) => v.toFixed(3)],
  ['fcp', 'First paint', 'When anything first shows on screen', [1800, 3000], (v) => `${(v / 1000).toFixed(2)} s`],
  ['ttfb', 'Server response', 'Time for the server’s first byte', [800, 1800], (v) => `${Math.round(v)} ms`],
];
const grade = (v, [g, p]) => (v == null ? '' : v <= g ? 'good' : v <= p ? 'ok' : 'poor');
const GRADE = { good: 'Good', ok: 'Needs work', poor: 'Poor' };

function PageSpeed() {
  const [strategy, setStrategy] = useState('mobile');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [res, setRes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('jh_psi') || 'null');
    } catch {
      return null;
    }
  });
  const run = async () => {
    setBusy(true);
    setErr('');
    try {
      const url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(`${location.origin}/`)}&strategy=${strategy}&category=performance`;
      const r = await fetch(url);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error?.message || `Google returned ${r.status}`);
      const a = j.lighthouseResult.audits;
      const out = {
        strategy,
        at: Date.now(),
        score: Math.round(j.lighthouseResult.categories.performance.score * 100),
        m: [
          ['First paint', a['first-contentful-paint']?.displayValue],
          ['Largest paint', a['largest-contentful-paint']?.displayValue],
          ['Blocking time', a['total-blocking-time']?.displayValue],
          ['Layout shift', a['cumulative-layout-shift']?.displayValue],
          ['Speed index', a['speed-index']?.displayValue],
        ],
        field: j.loadingExperience?.overall_category || null,
      };
      setRes(out);
      try {
        localStorage.setItem('jh_psi', JSON.stringify(out));
      } catch {}
    } catch (x) {
      setErr(/quota|429/i.test(x.message) ? 'Google’s free test limit was reached — try again in a minute.' : x.message);
    } finally {
      setBusy(false);
    }
  };
  const tone = res ? (res.score >= 90 ? 'good' : res.score >= 50 ? 'ok' : 'poor') : '';
  return (
    <div className="db-psi">
      <div className="db-psi-head">
        <div className="ad-seg" role="group" aria-label="Device to test">
          {['mobile', 'desktop'].map((s) => (
            <button key={s} type="button" className={strategy === s ? 'on' : ''} onClick={() => setStrategy(s)}>
              {s === 'mobile' ? 'Phone' : 'Computer'}
            </button>
          ))}
        </div>
        <button className="ad-btn ad-btn-primary" onClick={run} disabled={busy}>
          {busy ? 'Testing… (about 30 s)' : 'Run Google speed test'}
        </button>
      </div>
      {err && <div className="ad-err">{err}</div>}
      {res && (
        <div className="db-psi-body">
          <div className={`db-gauge ${tone}`} style={{ '--v': res.score }}>
            <b>{res.score}</b>
            <small>{res.strategy === 'mobile' ? 'Phone' : 'Computer'}</small>
          </div>
          <dl>
            {res.m.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v || '—'}</dd>
              </div>
            ))}
          </dl>
          <p className="ad-muted db-psi-note">
            Google Lighthouse lab test of the homepage · {new Date(res.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            {res.field && ` · Chrome users: ${res.field.toLowerCase().replace('_', ' ')}`}
          </p>
        </div>
      )}
    </div>
  );
}

function Setup() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="ad-card db-setup">
      <h2>Turn on visitor & speed stats</h2>
      <p className="ad-muted">
        One-time step: open <a className="ad-link" href="https://supabase.com/dashboard/project/gwxdzemazqontjobqnyy/sql/new" target="_blank" rel="noreferrer">Supabase → SQL Editor</a>, paste this script and press <b>Run</b>. Visitors are counted from that moment — anonymously, with no names, emails or IP addresses.
      </p>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <button
          className="ad-btn ad-btn-primary"
          onClick={() => {
            navigator.clipboard?.writeText(SETUP_SQL).then(() => setCopied(true));
          }}
        >
          {copied ? '✓ Copied' : 'Copy setup script'}
        </button>
        <button className="ad-btn" onClick={() => location.reload()}>
          I’ve run it — refresh
        </button>
      </div>
      <details>
        <summary className="ad-muted">Show script</summary>
        <pre className="db-sql">{SETUP_SQL}</pre>
      </details>
    </div>
  );
}

// Daily visitors for one page: pick from the top pages or type any path.
const PAGE_PICKS = ['/', '/shop', '/customize', '/gift-finder', '/cart', '/signature-experience', '/celebrations'];
function PageVisitors({ from, to, top }) {
  const options = [...new Set([...PAGE_PICKS, ...(top || []).map((p) => p.path)])];
  const [path, setPath] = useState('/');
  const [draft, setDraft] = useState('/');
  const [rows, setRows] = useState(null);
  useEffect(() => {
    let stop = false;
    setRows(null);
    (async () => {
      const all = [];
      for (let page = 0; page < 10; page++) {
        const { data, error } = await supabase
          .from('site_events')
          .select('created_at,visitor')
          .eq('kind', 'view')
          .eq('path', path)
          .gte('created_at', from.toISOString())
          .lt('created_at', to.toISOString())
          .range(page * 1000, page * 1000 + 999);
        if (error || !data) break;
        all.push(...data);
        if (data.length < 1000) break;
      }
      if (!stop) setRows(all);
    })();
    return () => {
      stop = true;
    };
  }, [path, from, to]);
  const days = useMemo(() => {
    const by = {};
    (rows || []).forEach((r) => {
      const d = istDay(r.created_at);
      (by[d] ||= { views: 0, v: new Set() }).views++;
      by[d].v.add(r.visitor);
    });
    const out = [];
    for (let t = from.getTime(); t < to.getTime(); t += DAY) {
      const day = istDay(t);
      out.push({ day, label: new Date(t + IST).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }), views: by[day]?.views || 0, visitors: by[day]?.v.size || 0 });
    }
    return out;
  }, [rows, from, to]);
  const unique = new Set((rows || []).map((r) => r.visitor)).size;
  const today = days[days.length - 1];
  return (
    <div className="ad-card db-span2">
      <div className="db-card-head">
        <h2>Daily visitors by page</h2>
        <span className="db-legend">
          <i className="b-views" /> Page views <i className="b-visitors" /> Visitors
        </span>
      </div>
      <form
        className="db-page-pick"
        onSubmit={(e) => {
          e.preventDefault();
          const v = draft.trim();
          if (v) setPath(v.startsWith('/') ? v.replace(/^https?:\/\/[^/]+/, '') : `/${v}`);
        }}
      >
        <select className="ad-input" value={options.includes(path) ? path : ''} onChange={(e) => e.target.value && (setPath(e.target.value), setDraft(e.target.value))} aria-label="Page">
          {!options.includes(path) && <option value="">{path}</option>}
          {options.map((p) => (
            <option key={p} value={p}>
              {p === '/' ? 'Homepage' : p}
            </option>
          ))}
        </select>
        <input className="ad-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="/product/p018" aria-label="Page path" />
        <button className="ad-btn">Show</button>
      </form>
      {rows === null ? (
        <p className="ad-muted db-empty">Loading…</p>
      ) : (
        <>
          <p className="db-page-sum">
            <b>{num(unique)}</b> visitors · <b>{num(rows.length)}</b> views in this period · today <b>{num(today?.visitors)}</b> visitors
          </p>
          <Columns
            label={`Daily visitors for ${path}`}
            days={days}
            series={[
              { key: 'views', name: 'page views', cls: 'b-views' },
              { key: 'visitors', name: 'visitors', cls: 'b-visitors' },
            ]}
          />
        </>
      )}
    </div>
  );
}

// Phones: the money and the to-dos first, in one glance.
function Spark({ values }) {
  const max = Math.max(1, ...values);
  const n = values.length;
  if (n < 2) return null;
  const pts = values.map((v, i) => `${(i / (n - 1)) * 100},${36 - (v / max) * 32}`).join(' ');
  return (
    <svg className="dbm-spark" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="dbmFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e7cf9c" stopOpacity=".45" />
          <stop offset="1" stopColor="#e7cf9c" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,40 ${pts} 100,40`} fill="url(#dbmFill)" />
      <polyline points={pts} fill="none" stroke="#e7cf9c" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

function MobileHero({ o, series, live, period, setPeriod }) {
  const h = new Date(Date.now() + IST).getUTCHours();
  const hello = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const label = PERIODS.find((p) => p[0] === period)?.[1];
  return (
    <section className="dbm-hero">
      <div className="dbm-hello">
        <img src="/founder/sandeep-jha.webp" alt="" width="44" height="44" />
        <div>
          <small>{hello}</small>
          <b>Sandeep</b>
        </div>
        {live !== null && (
          <span className="db-live dbm-live">
            <i /> {live} live
          </span>
        )}
      </div>
      <div className="dbm-seg" role="group" aria-label="Period">
        {PERIODS.map(([k, l]) => (
          <button key={k} type="button" className={period === k ? 'on' : ''} onClick={() => setPeriod(k)}>
            {l}
          </button>
        ))}
      </div>
      <p className="dbm-label">Revenue · {label === 'Today' ? 'today' : `last ${label}`}</p>
      <div className="dbm-rev">
        <b>{o ? money(o.rev) : '…'}</b>
        <Delta now={o?.rev} before={o?.revPrev} />
      </div>
      <Spark values={series.map((d) => d.revenue)} />
      <div className="dbm-mini">
        <span>
          <b>{o ? num(o.paid) : '…'}</b>
          <small>Paid orders</small>
        </span>
        <span>
          <b>{o ? money(o.aov) : '…'}</b>
          <small>Avg. order</small>
        </span>
        <span className={o?.toShip ? 'warn' : ''}>
          <b>{o ? num(o.toShip) : '…'}</b>
          <small>To ship</small>
        </span>
      </div>
    </section>
  );
}

function Attention({ o, catalog }) {
  const items = [];
  if (o?.toShip) items.push(['truck', `${o.toShip} order${o.toShip > 1 ? 's' : ''} to ship`, 'Paid and waiting — pack & dispatch', '/admin/orders', 'gold']);
  if (o?.unpaid) items.push(['bag', `${o.unpaid} unpaid checkout${o.unpaid > 1 ? 's' : ''}`, 'Started but not paid — follow up on WhatsApp', '/admin/orders', '']);
  if (catalog?.noImage?.length) items.push(['image', `${catalog.noImage.length} product${catalog.noImage.length > 1 ? 's' : ''} without a photo`, 'Hidden from the shop until a photo is added', '/admin/products', '']);
  if (!o) return null;
  return (
    <section className="dbm-att" aria-label="Needs attention">
      <h2>Needs attention</h2>
      {items.length ? (
        items.map(([ic, t, sub, to, tone], i) => (
          <Link key={t} to={to} className={`dbm-att-row ${tone}`} style={{ '--i': i }}>
            <i>
              <Icon name={ic} size={19} />
            </i>
            <span>
              <b>{t}</b>
              <small>{sub}</small>
            </span>
            <Icon name="chevron" size={18} />
          </Link>
        ))
      ) : (
        <p className="dbm-att-ok">
          <Icon name="check" size={18} /> All caught up — nothing waiting.
        </p>
      )}
    </section>
  );
}

const QUICK = [
  ['/admin/products/new', 'Add product', 'plus'],
  ['/admin/orders', 'Orders', 'box'],
  ['/admin/campaigns', 'Campaign', 'calendar'],
  ['/admin/signature', 'Signature', 'star'],
  ['/admin/templates', 'Templates', 'sparkle'],
];
function MobileQuick() {
  return (
    <nav className="dbm-quick" aria-label="Quick actions">
      {QUICK.map(([to, l, ic]) => (
        <Link key={to} to={to}>
          <i>
            <Icon name={ic} size={19} />
          </i>
          {l}
        </Link>
      ))}
      <a href="/" target="_blank" rel="noreferrer">
        <i>
          <Icon name="arrow" size={19} />
        </i>
        Store
      </a>
    </nav>
  );
}

// Visitors by state (approximate, from the visitor's network); tap a state
// to see its top cities.
function States({ from, to }) {
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState('');
  useEffect(() => {
    let stop = false;
    setRows(null);
    supabase.rpc('site_geo', { p_from: from.toISOString(), p_to: to.toISOString() }).then(({ data, error }) => !stop && setRows(error ? [] : data || []));
    return () => {
      stop = true;
    };
  }, [from, to]);
  const max = Math.max(1, ...(rows || []).map((r) => r.visitors));
  return (
    <div className="ad-card db-states">
      <h2>Top states</h2>
      {rows === null ? (
        <p className="ad-muted db-empty">Loading…</p>
      ) : !rows.length ? (
        <p className="ad-muted db-empty">Locations appear as new visitors arrive.</p>
      ) : (
        <ul className="db-bars">
          {rows.slice(0, 12).map((r) => (
            <li key={r.state} className={open === r.state ? 'open' : ''}>
              <button type="button" onClick={() => setOpen(open === r.state ? '' : r.state)} aria-expanded={open === r.state}>
                <span className="db-bars-fill" style={{ width: `${(r.visitors / max) * 100}%` }} />
                <span className="db-bars-label">{r.state}</span>
                <b>{num(r.visitors)}</b>
              </button>
              {open === r.state && (
                <div className="db-cities">
                  {(r.cities || []).length ? (
                    r.cities.map((c) => (
                      <span key={c.city}>
                        {c.city} <b>{num(c.visitors)}</b>
                      </span>
                    ))
                  ) : (
                    <small className="ad-muted">No city detail yet</small>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="ad-muted db-note">Approximate, from each visitor’s network. No IP addresses are stored.</p>
    </div>
  );
}

export default function Dashboard() {
  const [period, setPeriod] = useState(() => {
    try {
      return localStorage.getItem('jh_db_period') || '7d';
    } catch {
      return '7d';
    }
  });
  const [traffic, setTraffic] = useState(null);
  const [trafficPrev, setTrafficPrev] = useState(null);
  const [noTraffic, setNoTraffic] = useState(false);
  const [orders, setOrders] = useState(null);
  const [items, setItems] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [live, setLive] = useState(null);
  const days = PERIODS.find((p) => p[0] === period)[2];
  const { from, to, prev } = useMemo(() => range(days), [days]);

  useEffect(() => {
    try {
      localStorage.setItem('jh_db_period', period);
    } catch {}
    let stop = false;
    setTraffic(null);
    setOrders(null);
    (async () => {
      const [cur, before, ord] = await Promise.all([
        supabase.rpc('site_stats', { p_from: from.toISOString(), p_to: to.toISOString() }),
        supabase.rpc('site_stats', { p_from: prev.toISOString(), p_to: from.toISOString() }),
        supabase.from('orders').select('id,order_number,customer_name,total_amount,payment_status,order_status,created_at,city,state').gte('created_at', prev.toISOString()).order('created_at', { ascending: false }).limit(3000),
      ]);
      if (stop) return;
      if (cur.error) setNoTraffic(true);
      else {
        setNoTraffic(false);
        setTraffic(cur.data);
        setLive(cur.data.live);
        setTrafficPrev(before.data || null);
      }
      const list = ord.data || [];
      setOrders(list);
      const ids = list.filter((o) => o.payment_status === 'paid' && new Date(o.created_at) >= from).map((o) => o.id);
      const rows = [];
      for (let i = 0; i < ids.length; i += 150) {
        const { data } = await supabase.from('order_items').select('*').in('order_id', ids.slice(i, i + 150));
        rows.push(...(data || []));
      }
      if (!stop) setItems(rows);
    })();
    return () => {
      stop = true;
    };
  }, [period, from, to, prev]);

  useEffect(() => {
    (async () => {
      const [{ data: prods }, { data: imgs }, { data: opts }] = await Promise.all([
        supabase.from('products').select('id,name,active,is_bestseller,homepage_visible,category_slug'),
        supabase.from('product_images').select('product_id'),
        supabase.from('product_options').select('product_id'),
      ]);
      const withImg = new Set((imgs || []).map((i) => i.product_id));
      const withOpt = new Set((opts || []).map((i) => i.product_id));
      const p = prods || [];
      setCatalog({
        total: p.length,
        live: p.filter((x) => x.active).length,
        hidden: p.filter((x) => !x.active).length,
        bestsellers: p.filter((x) => x.active && x.is_bestseller).length,
        noImage: p.filter((x) => x.active && !withImg.has(x.id)),
        noOptions: p.filter((x) => x.active && !withOpt.has(x.id)),
        categories: new Set(p.filter((x) => x.active).map((x) => x.category_slug)).size,
      });
    })();
  }, []);

  // Live visitors refresh every 30 s while the dashboard is open.
  useEffect(() => {
    if (noTraffic) return;
    const t = setInterval(async () => {
      const { data } = await supabase.rpc('site_stats', { p_from: new Date(Date.now() - 600000).toISOString(), p_to: new Date(Date.now() + 60000).toISOString() });
      if (data) setLive(data.live);
    }, 30000);
    return () => clearInterval(t);
  }, [noTraffic]);

  const o = useMemo(() => {
    if (!orders) return null;
    const inCur = orders.filter((x) => new Date(x.created_at) >= from);
    const inPrev = orders.filter((x) => new Date(x.created_at) < from && new Date(x.created_at) >= prev);
    const paid = inCur.filter((x) => x.payment_status === 'paid');
    const paidPrev = inPrev.filter((x) => x.payment_status === 'paid');
    const rev = paid.reduce((a, x) => a + (+x.total_amount || 0), 0);
    const revPrev = paidPrev.reduce((a, x) => a + (+x.total_amount || 0), 0);
    const byDay = {};
    paid.forEach((x) => {
      const d = istDay(x.created_at);
      byDay[d] = byDay[d] || { revenue: 0, orders: 0 };
      byDay[d].revenue += +x.total_amount || 0;
      byDay[d].orders += 1;
    });
    const status = {};
    orders.filter((x) => x.payment_status === 'paid').forEach((x) => (status[x.order_status] = (status[x.order_status] || 0) + 1));
    const cities = {};
    paid.forEach((x) => x.city && (cities[x.city.trim()] = (cities[x.city.trim()] || 0) + 1));
    return {
      paid: paid.length,
      paidPrev: paidPrev.length,
      rev,
      revPrev,
      aov: paid.length ? rev / paid.length : 0,
      aovPrev: paidPrev.length ? revPrev / paidPrev.length : 0,
      unpaid: inCur.filter((x) => x.payment_status !== 'paid').length,
      toShip: orders.filter((x) => x.payment_status === 'paid' && !['shipped', 'delivered', 'cancelled'].includes(x.order_status)).length,
      byDay,
      status: Object.entries(status).sort((a, b) => b[1] - a[1]),
      cities: Object.entries(cities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8),
      latest: orders.slice(0, 6),
    };
  }, [orders, from, prev]);

  const top = useMemo(() => {
    const m = {};
    items.forEach((i) => {
      const k = i.name || i.product_name || 'Item';
      m[k] = m[k] || { name: k, qty: 0, revenue: 0 };
      m[k].qty += +i.quantity || 1;
      m[k].revenue += (+i.unit_price || 0) * (+i.quantity || 1);
    });
    return Object.values(m)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
  }, [items]);

  // One entry per day in the period, so empty days still show.
  const series = useMemo(() => {
    const out = [];
    const tv = Object.fromEntries((traffic?.daily || []).map((d) => [d.day, d]));
    for (let t = from.getTime(); t < to.getTime(); t += DAY) {
      const day = istDay(t);
      const dt = new Date(t + IST);
      out.push({ day, label: dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }), views: tv[day]?.views || 0, visitors: tv[day]?.visitors || 0, revenue: o?.byDay[day]?.revenue || 0, orders: o?.byDay[day]?.orders || 0 });
    }
    return out;
  }, [traffic, o, from, to]);

  const vit = (traffic?.vitals || []).find((v) => v.device === 'all') || null;
  const vitMobile = (traffic?.vitals || []).find((v) => v.device === 'mobile') || null;
  const hours = Array.from({ length: 24 }, (_, h) => (traffic?.hours || []).find((x) => x.hour === h)?.views || 0);
  const hourMax = Math.max(1, ...hours);
  const busiest = hours.indexOf(Math.max(...hours));
  const visitors = traffic?.visitors || 0;
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="db">
      <MobileHero o={o} series={series} live={live} period={period} setPeriod={setPeriod} />
      <Attention o={o} catalog={catalog} />
      <MobileQuick />
      <header className="db-head">
        <div>
          <p className="ad-muted">{today}</p>
          <h1 className="ad-h1">Dashboard</h1>
        </div>
        <div className="db-head-right">
          {live !== null && (
            <span className="db-live" title="Visitors in the last 5 minutes">
              <i /> {live} on site now
            </span>
          )}
          <div className="ad-seg" role="group" aria-label="Period">
            {PERIODS.map(([k, l]) => (
              <button key={k} type="button" className={period === k ? 'on' : ''} onClick={() => setPeriod(k)}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="db-kpis">
        <Kpi icon="rupee" label="Revenue" value={o ? money(o.rev) : '…'} now={o?.rev} before={o?.revPrev} tone="gold" />
        <Kpi icon="box" label="Paid orders" value={o ? num(o.paid) : '…'} now={o?.paid} before={o?.paidPrev} hint={o?.unpaid ? `${o.unpaid} unpaid` : ''} />
        <Kpi icon="bag" label="Avg. order value" value={o ? money(o.aov) : '…'} now={o?.aov} before={o?.aovPrev} />
        <Kpi icon="truck" label="Waiting to ship" value={o ? num(o.toShip) : '…'} hint="paid, not yet shipped" tone={o?.toShip ? 'alert' : ''} />
        <Kpi icon="users" label="Visitors" value={noTraffic ? '—' : traffic ? num(visitors) : '…'} now={visitors} before={trafficPrev?.visitors} hint={traffic?.new_visitors ? `${num(traffic.new_visitors)} new` : ''} />
        <Kpi icon="search" label="Page views" value={noTraffic ? '—' : traffic ? num(traffic.views) : '…'} now={traffic?.views} before={trafficPrev?.views} hint={traffic?.sessions ? `${(traffic.views / traffic.sessions).toFixed(1)} per visit` : ''} />
        <Kpi icon="sparkle" label="Conversion" value={noTraffic || !traffic ? '—' : pct(o?.paid || 0, visitors)} hint="paid orders ÷ visitors" />
        <Kpi icon="refresh" label="Bounce rate" value={noTraffic || !traffic ? '—' : pct(traffic.bounce_sessions, traffic.sessions)} hint="left after one page" />
      </section>

      {noTraffic && <Setup />}

      <section className="db-grid">
        <div className="ad-card db-span2">
          <div className="db-card-head">
            <h2>Visitors</h2>
            <span className="db-legend">
              <i className="b-views" /> Page views <i className="b-visitors" /> Visitors
            </span>
          </div>
          {noTraffic ? (
            <p className="ad-muted db-empty">Run the setup script above to start counting visitors.</p>
          ) : (
            <Columns
              label="Daily visitors"
              days={series}
              series={[
                { key: 'views', name: 'page views', cls: 'b-views' },
                { key: 'visitors', name: 'visitors', cls: 'b-visitors' },
              ]}
            />
          )}
        </div>
        <div className="ad-card db-span2">
          <div className="db-card-head">
            <h2>Sales</h2>
            <span className="db-legend">
              <i className="b-rev" /> Revenue
            </span>
          </div>
          <Columns label="Daily revenue" days={series} format={(v) => money(v)} series={[{ key: 'revenue', name: 'revenue', cls: 'b-rev' }]} />
        </div>

        {!noTraffic && <PageVisitors from={from} to={to} top={traffic?.pages} />}

        <div className="ad-card">
          <h2>Top pages</h2>
          <Bars rows={traffic?.pages || []} value={(r) => r.views} render={(r) => <a href={r.path} target="_blank" rel="noreferrer">{r.path === '/' ? 'Homepage' : r.path}</a>} />
        </div>
        {!noTraffic && <States from={from} to={to} />}
        <div className="ad-card">
          <h2>Where visitors come from</h2>
          <Bars rows={traffic?.sources || []} value={(r) => r.sessions} label={(r) => r.source} />
        </div>
        <div className="ad-card">
          <h2>Devices</h2>
          {traffic?.devices?.length ? (
            <div className="db-devices">
              {traffic.devices.map((d) => (
                <div key={d.device}>
                  <b>{pct(d.visitors, traffic.devices.reduce((a, x) => a + x.visitors, 0))}</b>
                  <span>{d.device === 'mobile' ? 'Phone' : d.device === 'tablet' ? 'Tablet' : d.device === 'desktop' ? 'Computer' : d.device}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="ad-muted db-empty">No data yet</p>
          )}
          <h3>Busiest hours (India time)</h3>
          <div className="db-hours" aria-label={traffic?.views ? `Busiest hour ${busiest}:00` : 'No data yet'}>
            {hours.map((v, h) => (
              <span key={h} title={`${h}:00 — ${v} views`} style={{ '--a': v / hourMax }} />
            ))}
          </div>
          <div className="db-axis">
            <span>12 am</span>
            <span>6 am</span>
            <span>12 pm</span>
            <span>6 pm</span>
            <span>11 pm</span>
          </div>
        </div>

        <div className="ad-card">
          <h2>Best sellers</h2>
          <Bars rows={top} value={(r) => r.qty} render={(r) => `${r.name} · ${money(r.revenue)}`} empty="No paid orders in this period" />
        </div>
        <div className="ad-card">
          <h2>Top cities</h2>
          <Bars rows={o?.cities || []} value={(r) => r[1]} label={(r) => r[0]} empty="No paid orders in this period" />
        </div>
        <div className="ad-card">
          <h2>Order pipeline</h2>
          <Bars rows={o?.status || []} value={(r) => r[1]} render={(r) => <span className="ad-badge">{r[0]}</span>} empty="No paid orders yet" />
          <Link to="/admin/orders" className="ad-link db-more">
            Manage orders →
          </Link>
        </div>

        <div className="ad-card db-span2">
          <div className="db-card-head">
            <h2>Site speed — real visitors</h2>
            <span className="ad-muted">{vit ? `${num(vit.samples)} page loads · 75th percentile` : ''}</span>
          </div>
          {vit ? (
            <>
              <div className="db-vitals">
                {VITALS.map(([k, name, desc, th, fmt]) => {
                  const v = vit[k];
                  const g = grade(v, th);
                  return (
                    <div key={k} className={`db-vital ${g}`}>
                      <span>{name}</span>
                      <b>{v == null ? '—' : fmt(v)}</b>
                      <small>{g ? GRADE[g] : 'No data'}</small>
                      <p>{desc}</p>
                    </div>
                  );
                })}
              </div>
              {vitMobile && <p className="ad-muted">On phones: largest paint {vitMobile.lcp ? `${(vitMobile.lcp / 1000).toFixed(2)} s` : '—'}, server response {vitMobile.ttfb ? `${Math.round(vitMobile.ttfb)} ms` : '—'}.</p>}
              {traffic?.slow_pages?.length > 0 && (
                <>
                  <h3>Slowest pages</h3>
                  <Bars rows={traffic.slow_pages} value={(r) => r.lcp} render={(r) => `${r.path === '/' ? 'Homepage' : r.path} · ${(r.lcp / 1000).toFixed(2)} s`} />
                </>
              )}
            </>
          ) : (
            <p className="ad-muted db-empty">{noTraffic ? 'Run the setup script to measure real visitors’ page speed.' : 'Speed data appears after the first visits.'}</p>
          )}
        </div>
        <div className="ad-card db-span2">
          <h2>Speed test</h2>
          <PageSpeed />
        </div>

        <div className="ad-card">
          <h2>Catalogue health</h2>
          {catalog ? (
            <ul className="db-checks">
              <li>
                <b>{catalog.live}</b> live products · {catalog.categories} categories
              </li>
              <li>
                <b>{catalog.hidden}</b> hidden products
              </li>
              <li>
                <b>{catalog.bestsellers}</b> marked bestseller
              </li>
              <li className={catalog.noImage.length ? 'warn' : 'ok'}>
                <b>{catalog.noImage.length}</b> live without a photo
                {catalog.noImage.slice(0, 3).map((p) => (
                  <Link key={p.id} to={`/admin/products/${p.id}`}>
                    {p.name}
                  </Link>
                ))}
              </li>
              <li className={catalog.noOptions.length ? 'warn' : 'ok'}>
                <b>{catalog.noOptions.length}</b> live without sizes/frames
                {catalog.noOptions.slice(0, 3).map((p) => (
                  <Link key={p.id} to={`/admin/products/${p.id}`}>
                    {p.name}
                  </Link>
                ))}
              </li>
            </ul>
          ) : (
            <p className="ad-muted">Loading…</p>
          )}
        </div>
        <div className="ad-card db-latest">
          <div className="db-card-head">
            <h2>Latest orders</h2>
            <Link to="/admin/orders" className="ad-link">
              All orders →
            </Link>
          </div>
          <ul className="db-orders">
            {(o?.latest || []).map((x) => (
              <li key={x.id}>
                <span>
                  <b>{x.customer_name || '—'}</b>
                  <small>
                    {x.order_number || x.id.slice(0, 8)} · {x.city || ''} · {new Date(x.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                  </small>
                </span>
                <span className="db-orders-r">
                  <b>{money(x.total_amount)}</b>
                  <span className={`ad-badge s-${x.payment_status}`}>{x.payment_status === 'paid' ? x.order_status : x.payment_status}</span>
                </span>
              </li>
            ))}
            {o && !o.latest.length && <li className="ad-muted">No orders yet — they’ll appear here the moment someone pays.</li>}
          </ul>
        </div>
        <div className="ad-card db-quick-card">
          <h2>Quick actions</h2>
          <div className="db-quick">
            <Link to="/admin/products/new">
              <Icon name="plus" size={18} /> Add product
            </Link>
            <Link to="/admin/campaigns">
              <Icon name="calendar" size={18} /> Campaigns
            </Link>
            <Link to="/admin/festivals">
              <Icon name="gift" size={18} /> Offers
            </Link>
            <Link to="/admin/templates">
              <Icon name="sparkle" size={18} /> Templates
            </Link>
            <Link to="/admin/homepage">
              <Icon name="home" size={18} /> Homepage
            </Link>
            <a href="/" target="_blank" rel="noreferrer">
              <Icon name="arrow" size={18} /> View store
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
