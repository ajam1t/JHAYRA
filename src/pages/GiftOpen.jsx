import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import RevealExperience from '../components/RevealExperience';
import { Seo } from '../lib/seo';
import { openReveal } from '../lib/reveal';
import { waLink } from '../lib/site';

// The recipient's page: /gift/<token>. No account, no header — just the reveal.
// The server checks the real order on every open: a reveal stays closed until
// its scheduled time and ends when the order is delivered, cancelled or refunded.
const STATES = {
  delivered: ['Your gift has arrived', 'This reveal was made to be opened before the gift reached you — and now the real thing is in your hands. We hope you love it.'],
  closed: ['This reveal is no longer available', 'The order it belongs to is no longer active, so this reveal has been closed.'],
  not_found: ['We couldn’t find this reveal', 'The link may be incomplete or mistyped. Please ask the sender to share the link or QR code again.'],
  error: ['We couldn’t open this just now', 'Please check your connection and try again in a moment.'],
};

function Shell({ children, live }) {
  return (
    <div className="grv grv-t-envelope">
      <section className="grv-stage grv-state" role={live ? 'status' : undefined}>
        <img className="grv-logo" src="/logo-mark-lg.webp" alt="JHAYRA" />
        {children}
      </section>
    </div>
  );
}

function Countdown({ at, onDone }) {
  const [now, setNow] = useState(Date.now());
  const target = new Date(at).getTime();
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const left = Math.max(0, target - now);
  useEffect(() => {
    if (left === 0) onDone();
  }, [left === 0]); // eslint-disable-line react-hooks/exhaustive-deps
  const d = Math.floor(left / 864e5);
  const h = Math.floor((left % 864e5) / 36e5);
  const m = Math.floor((left % 36e5) / 6e4);
  const s = Math.floor((left % 6e4) / 1e3);
  const cells = d ? [[d, 'days'], [h, 'hours'], [m, 'min']] : [[h, 'hours'], [m, 'min'], [s, 'sec']];
  return (
    <div className="grv-count" aria-label="Time until it opens">
      {cells.map(([v, l]) => (
        <div key={l}>
          <b>{String(v).padStart(2, '0')}</b>
          <small>{l}</small>
        </div>
      ))}
    </div>
  );
}

export default function GiftOpen() {
  const { token } = useParams();
  const [res, setRes] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let on = true;
    // Old-style links carried a key after "#"; it is not needed and never sent.
    if (window.location.hash) history.replaceState(null, '', window.location.pathname);
    openReveal(token)
      .then((r) => on && setRes(r))
      .catch(() => on && setRes({ status: 'error' }));
    return () => {
      on = false;
    };
  }, [token, tick]);

  const help = (
    <div className="grv-actions">
      {res?.status === 'error' && (
        <button type="button" className="grv-btn gold" onClick={() => setTick((t) => t + 1)}>
          Try again
        </button>
      )}
      <a className="grv-btn" href={waLink('Hi JHAYRA! I received a gift reveal link and need some help with it.')} target="_blank" rel="noopener noreferrer">
        Ask JHAYRA for help
      </a>
      <Link className="grv-btn" to="/">
        Visit JHAYRA
      </Link>
    </div>
  );

  let body;
  if (!res)
    body = (
      <Shell live>
        <span className="grv-spinner" />
        <p className="grv-line">Unwrapping something for you…</p>
      </Shell>
    );
  else if (res.status === 'ok') body = <RevealExperience data={res.data} />;
  else if (res.status === 'scheduled')
    body = (
      <Shell>
        <p className="grv-eyebrow">A gift reveal is waiting</p>
        <h1>Not just yet…</h1>
        <p>Someone has planned something special for you. It opens on</p>
        <p>
          <b>{new Date(res.publish_at).toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })}</b>
        </p>
        <Countdown at={res.publish_at} onDone={() => setTimeout(() => setTick((t) => t + 1), 1500)} />
        <p>Keep this page open, or come back to the same link then.</p>
      </Shell>
    );
  else {
    const [h, p] = STATES[res.status] || STATES.error;
    body = (
      <Shell>
        <h1>{h}</h1>
        <p>{p}</p>
        {help}
      </Shell>
    );
  }

  return (
    <>
      <Seo title="A gift reveal for you" description="A private JHAYRA gift reveal." path="/gift" noindex />
      {body}
    </>
  );
}
