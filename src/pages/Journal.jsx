import { Fragment, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import RoomScene, { WALLS } from '../components/RoomScene';
import Icon from '../components/Icon';
import Reveal from '../components/Reveal';
import { Seo } from '../lib/seo';
import { useProducts } from '../lib/catalog';
import { ARTICLES, ARTICLE_MAP } from '../lib/journal';
import { PRESETS, presetFrames } from './WallPlanner';
import { SITE } from '../lib/site';

const WALL = Object.fromEntries(WALLS.map((w) => [w.id, w]));

export function ArticleCover({ article, offset = 0, className = '' }) {
  const { data: products } = useProducts();
  const preset = PRESETS.find((p) => p.id === article.cover.preset) || PRESETS[0];
  const frames = useMemo(() => {
    const art = (products || []).filter((p) => p.thumbnail && p.is_bestseller);
    const pick = preset.slots.map((_, i) => art[(i + offset * 3) % Math.max(1, art.length)]);
    return presetFrames(preset, pick, 'Black');
  }, [products, preset, offset]);
  return <RoomScene wall={WALL[article.cover.wall]} furniture={article.cover.furniture} frames={frames} groupHeightIn={preset.groupH} zoom={1.25} tone="gallery" className={`journal-cover ${className}`} />;
}

export function JournalCard({ a, i }) {
  return (
    <Link to={`/journal/${a.slug}`} className="jcard">
      <ArticleCover article={a} offset={i} />
      <span className="jcard-tag">
        {a.tag} · {a.mins} min read
      </span>
      <b>{a.title}</b>
      <p>{a.dek}</p>
    </Link>
  );
}

function Index() {
  return (
    <>
      <Seo title="Inspiration Journal — Wall Art Ideas & Guides" description="Gallery wall planning, how high to hang art, styling by room, personalised gift ideas and framed art care — practical guides from JHAYRA." path="/journal" />
      <section className="wrap page-hero">
        <span className="eyebrow">The JHAYRA Journal</span>
        <h1 className="display" style={{ marginTop: 16, maxWidth: '14ch' }}>
          Ideas for walls <em>worth living with.</em>
        </h1>
      </section>
      <section className="wrap journal-grid" style={{ paddingBottom: 90 }}>
        {ARTICLES.map((a, i) => (
          <Reveal key={a.slug} delay={i * 0.05}>
            <JournalCard a={a} i={i} />
          </Reveal>
        ))}
      </section>
    </>
  );
}

function Article({ a }) {
  const i = ARTICLES.indexOf(a);
  const next = ARTICLES[(i + 1) % ARTICLES.length];
  return (
    <>
      <Seo
        title={a.title}
        description={a.dek}
        path={`/journal/${a.slug}`}
        jsonLd={{ '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.dek, author: { '@type': 'Organization', name: 'JHAYRA' }, publisher: { '@type': 'Organization', name: 'JHAYRA', logo: { '@type': 'ImageObject', url: SITE.ogImage } }, mainEntityOfPage: `${SITE.url}/journal/${a.slug}` }}
      />
      <article className="article">
        <header className="wrap wrap-narrow article-head">
          <Link to="/journal" className="crumbs" style={{ display: 'inline-flex' }}>
            <Icon name="arrowL" size={15} /> Journal
          </Link>
          <span className="eyebrow">
            {a.tag} · {a.mins} min read
          </span>
          <h1 className="h1">{a.title}</h1>
          <p className="lead">{a.dek}</p>
        </header>
        <div className="wrap article-cover">
          <ArticleCover article={a} offset={i} />
        </div>
        <div className="wrap wrap-narrow article-body">
          {a.body.map(([kind, val], k) => (
            <Fragment key={k}>
              {kind === 'p' && <p>{val}</p>}
              {kind === 'h' && <h2 className="h3">{val}</h2>}
              {kind === 'list' && (
                <ul>
                  {val.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              )}
              {kind === 'tip' && (
                <aside className="article-tip">
                  <b>Tip</b> {val}
                </aside>
              )}
              {kind === 'links' && (
                <div className="article-links">
                  {val.map(([label, to]) => (
                    <Link key={to} to={to} className="link">
                      {label} <Icon name="arrow" size={15} />
                    </Link>
                  ))}
                </div>
              )}
            </Fragment>
          ))}
          <Link to={`/journal/${next.slug}`} className="article-next">
            <small>Next read</small>
            <b>{next.title}</b>
          </Link>
        </div>
      </article>
    </>
  );
}

export default function Journal() {
  const { slug } = useParams();
  if (!slug) return <Index />;
  const a = ARTICLE_MAP[slug];
  if (!a)
    return (
      <div className="wrap section center">
        <h1 className="h2">Article not found</h1>
        <Link to="/journal" className="btn" style={{ marginTop: 20 }}>
          All articles
        </Link>
      </div>
    );
  return <Article a={a} />;
}
