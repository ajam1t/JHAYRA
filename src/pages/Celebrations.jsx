import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import Reveal from '../components/Reveal';
import { EventBanner } from '../components/EventExperience';
import { Seo } from '../lib/seo';
import { useProducts } from '../lib/catalog';
import { liveCampaigns, resolveCampaign, useCampaigns, campaignStatus } from '../lib/campaigns';
import { orderBy, waLink } from '../lib/site';

// Every occasion links to an existing collection, category, world or set of
// personalised designs.
const OCCASIONS = [
  ['rings', 'Weddings', 'Keepsakes and gifts for the big day', '/worlds/wedding'],
  ['calendar', 'Anniversaries', 'Your names, your date, your photos', '/customize?moment=anniversary'],
  ['cake', 'Birthdays', 'Personalised frames they’ll keep', '/customize?moment=birthday'],
  ['diya', 'Festivals', 'Diwali, Rakhi, Christmas and more', '/worlds/festivals'],
  ['home', 'Housewarming', 'Vastu favourites and divine art', '/shop?room=pooja'],
  ['gift', 'Gifting', 'Art chosen for giving', '/collections/art-for-gifting'],
];

export default function Celebrations() {
  const all = useCampaigns();
  const { data: products } = useProducts();
  const live = liveCampaigns(all);
  // Festivals the team has scheduled, soonest first (admin → Festivals).
  const upcoming = all
    .filter((c) => campaignStatus(c) === 'scheduled')
    .sort((a, b) => String(a.start).localeCompare(String(b.start)))
    .slice(0, 4)
    .map(resolveCampaign);
  return (
    <>
      <Seo title="Celebrations — Festival, Wedding & Gifting Collections" description="Festive art, wedding keepsakes and personalised gifts for every celebration — curated JHAYRA collections, delivered free across India." path="/celebrations" />
      <section className="wrap page-hero">
        <span className="eyebrow">Celebrations</span>
        <h1 className="display" style={{ marginTop: 16, maxWidth: '14ch' }}>
          Every occasion, <em>beautifully framed.</em>
        </h1>
        <p className="lead" style={{ marginTop: 16, maxWidth: 620 }}>
          Festivals, weddings, anniversaries and housewarmings — art and personalised gifts made for the moments you celebrate.
        </p>
      </section>
      {live.length > 0 && (
        <section className="cel-live">
          {live.map((c) => (
            <EventBanner key={c.id} c={resolveCampaign(c)} products={products} as="div" />
          ))}
        </section>
      )}
      <section className="wrap section-sm">
        <h2 className="h3" style={{ marginBottom: 20 }}>
          Shop by occasion
        </h2>
        <div className="cel-grid">
          {OCCASIONS.map(([ic, t, d, to], i) => (
            <Reveal key={t} as={Link} to={to} className="cel-occ" delay={(i % 3) * 0.05}>
              <span className="cel-ic">
                <Icon name={ic} size={22} />
              </span>
              <b>{t}</b>
              <small>{d}</small>
              <span className="cel-go">
                Explore <Icon name="arrow" size={14} />
              </span>
            </Reveal>
          ))}
        </div>
      </section>
      {upcoming.length > 0 && (
        <section className="wrap section-sm">
          <h2 className="h3" style={{ marginBottom: 20 }}>
            Coming up
          </h2>
          <div className="cel-grid">
            {upcoming.map((c) => {
              const ev = c.eventDate && !c.verify ? new Date(`${c.eventDate}T12:00`) : null;
              return (
                <div key={c.id} className="cel-occ cel-next">
                  <b>{c.title || c.themeName}</b>
                  <small>{ev ? ev.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' }) : `From ${fmt(new Date(String(c.start).slice(0, 10) + 'T12:00'))}`}</small>
                  {ev && orderBy(ev) > new Date() && <span className="cel-by">Order by {fmt(orderBy(ev))} for delivery in time</span>}
                </div>
              );
            })}
          </div>
        </section>
      )}
      <GiftPlanner />
    </>
  );
}

const fmt = (d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

// "When do I need to order?" — the same delivery rule used at checkout.
function GiftPlanner() {
  const [date, setDate] = useState('');
  const d = date ? new Date(`${date}T12:00`) : null;
  const by = d ? orderBy(d) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const late = by && by < today;
  return (
    <section className="wrap section-sm" style={{ paddingBottom: 80 }}>
      <div className="cel-plan">
        <div>
          <h2 className="h3">Ordering for a date?</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            Every piece is made to order — 1–2 business days to craft, then 5–7 to reach you. Pick the day and we’ll tell you when to order.
          </p>
        </div>
        <label className="cel-plan-in">
          <span>Celebration date</span>
          <input className="input" type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
        </label>
        {by && (
          <p className="cel-plan-out" role="status">
            {late ? (
              <>
                That’s a tight one —{' '}
                <a href={waLink(`Hi JHAYRA! I need a frame delivered by ${fmt(d)}. Can you make it?`)} target="_blank" rel="noopener noreferrer">
                  WhatsApp us
                </a>{' '}
                and we’ll tell you honestly whether we can make your date.
              </>
            ) : (
              <>
                Order by <b>{fmt(by)}</b> for delivery by {fmt(d)}.
              </>
            )}
          </p>
        )}
      </div>
    </section>
  );
}
