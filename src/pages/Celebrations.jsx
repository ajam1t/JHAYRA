import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import Reveal from '../components/Reveal';
import { CampaignSlide } from '../components/CampaignBanner';
import { Seo } from '../lib/seo';
import { useProducts } from '../lib/catalog';
import { liveCampaigns, useCampaigns } from '../lib/campaigns';

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
        <section className="wrap cel-live">
          {live.map((c) => (
            <Reveal key={c.id} className="cb cel-card">
              <CampaignSlide c={c} products={products} />
            </Reveal>
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
    </>
  );
}
