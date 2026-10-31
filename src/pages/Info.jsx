import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon, { WhatsAppGlyph } from '../components/Icon';
import Reveal from '../components/Reveal';
import { Seo } from '../lib/seo';
import { SITE, waLink } from '../lib/site';
import { BRAND } from '../lib/brand';
import { FAQ } from '../lib/faq';
import { LEGAL } from '../lib/policies';
import Founder from '../components/Founder';

const UPDATED = 'October 2026';

function Faq({ items }) {
  return (
    <div className="acc">
      {items.map(([q, a]) => (
        <details key={q}>
          <summary>
            {q}
            <span className="ic">
              <Icon name="plus" size={16} />
            </span>
          </summary>
          <div className="acc-body">{a}</div>
        </details>
      ))}
    </div>
  );
}



function Legal({ title, sub, sections }) {
  return (
    <article className="wrap wrap-narrow legal">
      <span className="eyebrow">Policies</span>
      <h1 className="h1" style={{ margin: '14px 0 8px' }}>
        {title}
      </h1>
      <p className="muted">{sub || `Last updated: ${UPDATED}`}</p>
      {sections.map(([h, body]) => (
        <section key={h}>
          <h2 className="h3">{h}</h2>
          {Array.isArray(body) ? (
            <ul>
              {body.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          ) : (
            <p>{body}</p>
          )}
        </section>
      ))}
      <div className="legal-help">
        Questions? <a href={waLink()}>WhatsApp {SITE.phoneDisplay}</a> or <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </div>
    </article>
  );
}

function About() {
  return (
    <>
      <section className="page-hero about-hero">
        <div className="wrap about-grid">
          <div>
            <span className="eyebrow">Our story</span>
            <h1 className="display" style={{ marginTop: 16 }}>
              Memories deserve <em>better than a phone.</em>
            </h1>
            <p className="lead" style={{ marginTop: 20 }}>
              JHAYRA began in {BRAND.since} with a simple belief: the photos we love most shouldn’t live only on a screen. Since then we have crafted frames for families across India — {BRAND.homes} homes, {BRAND.gifts} gifts and {BRAND.corporates} corporate clients — each one made to order in our workshop and delivered to your wall.
            </p>
          </div>
          <div className="about-art">
            <img src="/logo-mark-lg.webp" alt="The JHAYRA monogram" width="360" height="320" />
          </div>
        </div>
      </section>
      <section className="section-sm">
        <div className="wrap stats stats-light">
          {[
            [String(BRAND.since), 'Crafting since'],
            [BRAND.homes, 'Happy homes'],
            [BRAND.gifts, 'Gifts delivered'],
            [BRAND.corporates, 'Corporate clients'],
          ].map(([n, l]) => (
            <div key={l}>
              <b>{n}</b>
              <span>{l}</span>
            </div>
          ))}
        </div>
      </section>
      <Founder variant="about" />
      <section className="section surface-cream">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="eyebrow">What we stand for</span>
              <h2 className="h2">
                Small workshop. <em>Big care.</em>
              </h2>
            </div>
          </div>
          <div className="values">
            {[
              ['brush', 'Craftsmanship', 'Every piece is printed, framed and finished by hand, and checked before it leaves us.'],
              ['heart', 'Personal', 'No two orders are alike. We read every name and date as carefully as if it were ours.'],
              ['shield', 'Honest promises', 'Free delivery across India and straight answers on WhatsApp.'],
              ['home', 'Made in India', 'Designed and produced in India, supporting local artisans and suppliers.'],
            ].map(([ic, t, d], i) => (
              <Reveal key={t} delay={i * 0.06} className="value">
                <Icon name={ic} size={26} />
                <b>{t}</b>
                <p>{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="section-sm center">
        <div className="wrap">
          <h2 className="h2">
            Ready to <em>make yours?</em>
          </h2>
          <div className="row" style={{ justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
            <Link to="/customize" className="btn btn-gold btn-lg">
              Start personalising
            </Link>
            <Link to="/shop" className="btn btn-ghost btn-lg">
              Shop designs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Contact() {
  const [f, setF] = useState({ name: '', subject: '', message: '' });
  const text = `Hi JHAYRA! I'm ${f.name || '…'}.${f.subject ? `\nSubject: ${f.subject}` : ''}\n\n${f.message}`;
  return (
    <section className="wrap page-hero contact">
      <div>
        <span className="eyebrow">Contact</span>
        <h1 className="h1" style={{ margin: '14px 0 16px' }}>
          Talk to a <em>real person.</em>
        </h1>
        <p className="lead">We reply on WhatsApp within minutes during working hours — usually faster than email.</p>
        <ul className="contact-list">
          <li>
            <WhatsAppGlyph />
            <span>
              <b>WhatsApp</b>
              <a href={waLink()}>{SITE.phoneDisplay}</a>
            </span>
          </li>
          <li>
            <Icon name="mail" />
            <span>
              <b>Email</b>
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </span>
          </li>
          <li>
            <Icon name="instagram" />
            <span>
              <b>Instagram</b>
              <a href={SITE.instagram} target="_blank" rel="noopener noreferrer">
                @thejhayra
              </a>
            </span>
          </li>
          <li>
            <Icon name="clock" />
            <span>
              <b>Hours</b>
              {SITE.hours.map(([d, h]) => (
                <span key={d} className="muted">
                  {d}: {h}
                </span>
              ))}
            </span>
          </li>
        </ul>
      </div>
      <form
        className="card contact-form"
        onSubmit={(e) => {
          e.preventDefault();
          window.open(waLink(text), '_blank', 'noopener');
        }}
      >
        <h2 className="h3">Send a message</h2>
        <div className="field">
          <label htmlFor="c-name">Your name</label>
          <input id="c-name" className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="c-sub">Subject</label>
          <input id="c-sub" className="input" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="Order, bulk enquiry, custom size…" />
        </div>
        <div className="field">
          <label htmlFor="c-msg">Message</label>
          <textarea id="c-msg" className="textarea" required value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
        </div>
        <button className="btn btn-wa btn-block">
          <WhatsAppGlyph size={18} /> Send on WhatsApp
        </button>
        <a className="btn btn-ghost btn-block" href={`mailto:${SITE.email}?subject=${encodeURIComponent(f.subject || 'Hello JHAYRA')}&body=${encodeURIComponent(f.message)}`}>
          Or send by email
        </a>
      </form>
    </section>
  );
}

function Support() {
  return (
    <>
      <section className="wrap page-hero">
        <span className="eyebrow">Help</span>
        <h1 className="h1" style={{ marginTop: 14 }}>
          How can we <em>help?</em>
        </h1>
        <div className="help-cards">
          <Link to="/orders" className="cz-start">
            <span className="cz-start-ic">
              <Icon name="truck" />
            </span>
            <span>
              <b>Track an order</b>
              <small>See your recent orders</small>
            </span>
            <Icon name="arrow" />
          </Link>
          <Link to="/replacement-policy" className="cz-start">
            <span className="cz-start-ic">
              <Icon name="refresh" />
            </span>
            <span>
              <b>Damaged or wrong?</b>
              <small>Damaged or incorrect order? Here’s what to do</small>
            </span>
            <Icon name="arrow" />
          </Link>
          <a href={waLink('Hi JHAYRA! I need help with personalising my frame.')} className="cz-start">
            <span className="cz-start-ic">
              <Icon name="brush" />
            </span>
            <span>
              <b>Help personalising</b>
              <small>We’ll design it with you</small>
            </span>
            <Icon name="arrow" />
          </a>
        </div>
      </section>
      <section className="wrap wrap-narrow section-sm">
        <h2 className="h2" style={{ marginBottom: 20 }}>
          Frequently asked
        </h2>
        <Faq items={FAQ} />
        <h2 className="h3" style={{ margin: '48px 0 16px' }}>
          Caring for your frame
        </h2>
        <ul className="care">
          <li>Keep away from direct sunlight and heat</li>
          <li>Wipe with a dry or slightly damp soft cloth</li>
          <li>Use the hook provided for secure hanging</li>
          <li>Avoid damp walls and bathrooms</li>
        </ul>
      </section>
    </>
  );
}

function Corporate() {
  const [f, setF] = useState({ company: '', name: '', mobile: '', qty: '', occasion: '' });
  const send = (e) => {
    e.preventDefault();
    window.open(waLink(`Corporate enquiry\nCompany: ${f.company}\nName: ${f.name}\nMobile: ${f.mobile}\nQuantity: ${f.qty}\nOccasion: ${f.occasion}`), '_blank', 'noopener');
  };
  return (
    <>
      <section className="page-hero surface-night corp-hero">
        <div className="wrap">
          <span className="eyebrow">Corporate gifting</span>
          <h1 className="display" style={{ marginTop: 16, maxWidth: '16ch' }}>
            Gifts people <em>actually keep.</em>
          </h1>
          <p className="lead" style={{ marginTop: 18 }}>
            Personalised, branded wall art for employee milestones, client thank-yous and festive gifting — trusted by {BRAND.corporates} companies.
          </p>
          <div className="stats" style={{ marginTop: 40 }}>
            {[
              [BRAND.corporates, 'Corporates served'],
              [BRAND.gifts, 'Gifts delivered'],
              ['48 hrs', 'Bulk turnaround'],
              ['100%', 'Custom branding'],
            ].map(([n, l]) => (
              <div key={l}>
                <b>{n}</b>
                <span>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <div className="tiers tiers-2">
            {[
              ['Business', '10+ units', '₹449', 'per unit', ['Custom branding', 'Choice of sizes', 'Priority packaging', '5-day delivery'], true],
              ['Enterprise', '200+ units', 'Custom', 'pricing', ['Full customisation', 'Dedicated manager', 'Logo integration', 'Express delivery']],
            ].map(([t, q, p, u, feats, hot]) => (
              <div key={t} className={`tier ${hot ? 'hot' : ''}`}>
                {hot && <span className="pill pill-gold">Most popular</span>}
                <b className="tier-name">{t}</b>
                <small>{q}</small>
                <div className="tier-price">
                  {p} <span>{u}</span>
                </div>
                <ul>
                  {feats.map((x) => (
                    <li key={x}>
                      <Icon name="check" size={16} /> {x}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <form className="card corp-form" onSubmit={send}>
            <h2 className="h3">Get a quote in minutes</h2>
            <div className="ck-grid">
              <div className="field">
                <label htmlFor="co-c">Company</label>
                <input id="co-c" className="input" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="co-n">Your name</label>
                <input id="co-n" className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="co-m">Mobile</label>
                <input id="co-m" className="input" required inputMode="tel" value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="co-q">Quantity</label>
                <input id="co-q" className="input" inputMode="numeric" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} />
              </div>
              <div className="field span2">
                <label htmlFor="co-o">Occasion</label>
                <input id="co-o" className="input" placeholder="Diwali gifting, work anniversaries, client thank-you…" value={f.occasion} onChange={(e) => setF({ ...f, occasion: e.target.value })} />
              </div>
            </div>
            <button className="btn btn-wa btn-lg" style={{ marginTop: 18 }}>
              <WhatsAppGlyph size={18} /> Send enquiry on WhatsApp
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

const PAGES = {
  about: { title: 'About JHAYRA — Our Story Since 2017', desc: `From a small workshop to ${BRAND.homes} homes: the story of JHAYRA, handcrafted photo frames and wall art made in India since ${BRAND.since}.`, el: About },
  contact: { title: 'Contact JHAYRA', desc: 'WhatsApp, email or Instagram — talk to a real person at JHAYRA.', el: Contact },
  support: { title: 'Help & FAQ', desc: 'Delivery times, orders, photo quality, payments — answers to common questions.', el: Support },
  corporate: { title: 'Corporate Gifting — Personalised Wall Art in Bulk', desc: `Branded, personalised frames for employees and clients. Volume pricing from ₹449/unit for 10+ units. Trusted by ${BRAND.corporates} companies.`, el: Corporate },
};

export default function Info({ page }) {
  const legal = LEGAL[page];
  if (legal)
    return (
      <>
        <Seo title={legal.title} description={legal.desc} path={`/${page}`} />
        <Legal {...legal} />
      </>
    );
  const p = PAGES[page];
  const El = p.el;
  return (
    <>
      <Seo title={p.title} description={p.desc} path={`/${page}`} jsonLd={page === 'support' ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) } : undefined} />
      <El />
    </>
  );
}
