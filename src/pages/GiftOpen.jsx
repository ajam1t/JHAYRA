import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import RevealExperience from '../components/RevealExperience';
import { Seo } from '../lib/seo';
import { openReveal } from '../lib/reveal';
import { waLink } from '../lib/site';

// The recipient's page: /gift/<id>#<key>. No account, no header — just the reveal.
const STATES = {
  off: ['This reveal is resting', 'The sender has switched this link off for now. Ask them to turn it back on.'],
  expired: ['This reveal has closed', 'Gift reveal links stay open for a limited time, and this one has ended. The sender can share a new one.'],
  not_found: ['We couldn’t find this reveal', 'The link may be mistyped, or the sender may have removed it.'],
  no_key: ['This link is incomplete', 'The last part of the link (after the “#”) is missing, and it is the key that opens your reveal. Please ask the sender to send the full link or the QR code again.'],
  bad_key: ['This link doesn’t open the reveal', 'The key in the link doesn’t match. Please ask the sender to send the link or the QR code again.'],
  error: ['We couldn’t open this just now', 'Please check your connection and try again in a moment.'],
};

export default function GiftOpen() {
  const { id } = useParams();
  const [res, setRes] = useState(null);

  useEffect(() => {
    let on = true;
    const key = window.location.hash.slice(1);
    openReveal(id, key)
      .then((r) => on && setRes(r))
      .catch(() => on && setRes({ status: 'error' }));
    return () => {
      on = false;
    };
  }, [id]);

  return (
    <>
      <Seo title="A gift reveal for you" description="A private JHAYRA gift reveal." path={`/gift/${id}`} noindex />
      {!res ? (
        <div className="grv grv-t-envelope">
          <section className="grv-stage grv-state" role="status">
            <img className="grv-logo" src="/logo-mark-lg.webp" alt="JHAYRA" />
            <span className="grv-spinner" />
            <p className="grv-line">Unwrapping something for you…</p>
          </section>
        </div>
      ) : res.status === 'ok' ? (
        <RevealExperience data={res.data} loadClip={res.loadClip} />
      ) : (
        <div className="grv grv-t-envelope">
          <section className="grv-stage grv-state">
            <img className="grv-logo" src="/logo-mark-lg.webp" alt="JHAYRA" />
            <h1>{(STATES[res.status] || STATES.error)[0]}</h1>
            <p className="grv-line">{(STATES[res.status] || STATES.error)[1]}</p>
            <div className="grv-actions">
              {res.status === 'error' && (
                <button type="button" className="grv-btn gold" onClick={() => window.location.reload()}>
                  Try again
                </button>
              )}
              <a className="grv-btn" href={waLink('Hi JHAYRA! I received a gift reveal link and need some help opening it.')} target="_blank" rel="noopener noreferrer">
                Ask JHAYRA for help
              </a>
              <Link className="grv-btn" to="/">
                Visit JHAYRA
              </Link>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
