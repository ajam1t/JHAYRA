import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useScrollReveal } from '../components/ScrollReveal';
import ProductCard from '../components/ProductCard';
import TemplateCard from '../components/TemplateCard';
import { JHAYRA_DATA } from '../data/products';
import { OCCASIONS, RECIPIENTS } from '../data/occasions';
import { TEMPLATES } from '../data/templates';

const WA_URL = `https://wa.me/917070728989?text=${encodeURIComponent("Hi JHAYRA! I need help finding the perfect gift frame. Can you guide me?")}`;

/* ── Result page rendered when a card is selected ─────────────────────────── */
function GiftResultPage({ type, item, onBack }) {
  useScrollReveal();

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [item.id]);

  const products = item.productIds.map(id => JHAYRA_DATA.get(id)).filter(Boolean);

  const matchedTemplates = TEMPLATES.filter(t => {
    const byGroup = item.templateGroups?.some(g => t.group === g);
    const byField = type === 'occasion'
      ? t.occasion?.includes(item.id)
      : t.recipient?.includes(item.id);
    return byGroup || byField;
  }).slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <div style={{
        background:'linear-gradient(135deg,#1C1408 0%,#2E1A06 100%)',
        padding:'2.5rem 0 2rem',
      }}>
        <div className="container">
          <button
            onClick={onBack}
            style={{
              display:'inline-flex', alignItems:'center', gap:'.4rem',
              background:'none', border:'none', cursor:'pointer',
              color:'rgba(255,255,255,.55)', fontFamily:'var(--fd)', fontSize:'.85rem',
              padding:'.35rem 0', marginBottom:'1.25rem',
            }}
          >
            <svg viewBox="0 0 24 24" style={{width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:2.5}}>
              <polyline points="15,18 9,12 15,6"/>
            </svg>
            Gift Finder
          </button>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'3rem',marginBottom:'.6rem',lineHeight:1}}>{item.emoji}</div>
            <h1 style={{
              color:'#fff', fontFamily:'var(--fd)',
              fontSize:'clamp(1.5rem,3.5vw,2.4rem)',
              margin:'0 0 .6rem',
            }}>
              {item.heading}
            </h1>
            <p style={{
              color:'rgba(255,255,255,.6)', maxWidth:'460px',
              margin:'0 auto', lineHeight:1.75, fontSize:'.95rem',
            }}>
              {item.subheading}
            </p>
          </div>
        </div>
      </div>

      <div className="container" style={{paddingBottom:'4rem'}}>

        {/* Recommended Frames */}
        {products.length > 0 && (
          <section className="section">
            <div className="section-header s-reveal">
              <p className="eyebrow">Curated for {item.label}</p>
              <h2 className="display-3">Recommended Frames</h2>
              <div className="divider"/>
            </div>
            <div className="products-grid">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* Custom Frame Ideas */}
        {item.customIdeas?.length > 0 && (
          <section className="section">
            <div className="section-header s-reveal">
              <p className="eyebrow">Inspire Your Design</p>
              <h2 className="display-3">Custom Frame Ideas</h2>
              <div className="divider"/>
            </div>
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',
              gap:'1rem',
              marginTop:'1.5rem',
            }}>
              {item.customIdeas.map((idea, i) => (
                <Link
                  key={i}
                  to="/customize"
                  style={{
                    display:'block',
                    background:'var(--bg)',
                    borderRadius:'1rem',
                    padding:'1.25rem 1.5rem',
                    border:'1px solid rgba(182,141,64,.2)',
                    textDecoration:'none',
                    transition:'box-shadow .2s,transform .2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '';
                    e.currentTarget.style.transform = '';
                  }}
                >
                  <div style={{fontSize:'1.2rem',marginBottom:'.5rem'}}>✨</div>
                  <p style={{margin:'0 0 .5rem',color:'var(--ink)',lineHeight:1.65,fontSize:'.88rem'}}>
                    {idea}
                  </p>
                  <span style={{color:'var(--gold)',fontSize:'.8rem',fontWeight:600}}>
                    Customise this →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Matching Templates */}
        {matchedTemplates.length > 0 && (
          <section className="section">
            <div className="section-header s-reveal">
              <p className="eyebrow">Ready-Made Designs</p>
              <h2 className="display-3">Start with a Template</h2>
              <div className="divider"/>
            </div>
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))',
              gap:'1.5rem',
              marginTop:'1.5rem',
            }}>
              {matchedTemplates.map(t => <TemplateCard key={t.id} template={t} />)}
            </div>
            <div style={{textAlign:'center',marginTop:'2rem'}}>
              <Link to="/customize" className="btn btn-outline">Browse All Templates</Link>
            </div>
          </section>
        )}

        {/* Create Your Own CTA */}
        <section className="section">
          <div className="s-reveal" style={{
            background:'linear-gradient(140deg,#1A1208,#2C1A06)',
            borderRadius:'1.5rem',
            padding:'3rem 2rem',
            textAlign:'center',
            color:'#fff',
          }}>
            <h2 className="display-3" style={{color:'#fff',marginBottom:'.75rem'}}>
              Create Something Truly Unique
            </h2>
            <p style={{
              color:'rgba(255,255,255,.6)',
              maxWidth:'420px',
              margin:'0 auto 1.75rem',
              lineHeight:1.75,
            }}>
              Upload your photo and personalise every detail — name, date, quote, font, size and colour.
            </p>
            <div style={{display:'flex',gap:'.875rem',justifyContent:'center',flexWrap:'wrap'}}>
              <Link to="/customize" className="btn btn-gold btn-lg">
                Start Customizing
              </Link>
              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:'inline-flex', alignItems:'center', gap:'.45rem',
                  padding:'.7rem 1.5rem',
                  borderRadius:'999px',
                  border:'1px solid rgba(255,255,255,.3)',
                  background:'rgba(255,255,255,.06)',
                  color:'#fff',
                  fontFamily:'var(--fd)',
                  fontSize:'.9rem',
                  textDecoration:'none',
                  fontWeight:600,
                  transition:'background .2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}
              >
                <svg viewBox="0 0 24 24" style={{width:17,height:17,fill:'#25D366',flexShrink:0}}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat with Our Team
              </a>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

/* ── Main Gift Finder page ────────────────────────────────────────────────── */
export default function GiftFinder() {
  useScrollReveal();
  const [tab, setTab] = useState('occasion');
  const [result, setResult] = useState(null);

  const list = tab === 'occasion' ? OCCASIONS : RECIPIENTS;

  const handleTab = t => { setTab(t); setResult(null); };
  const handleSelect = item => setResult({ type: tab, item });
  const handleBack = () => {
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (result) {
    return <GiftResultPage type={result.type} item={result.item} onBack={handleBack} />;
  }

  return (
    <div data-page="gift-finder">
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow">Find the Perfect Gift</p>
          <h1>Gift Finder</h1>
          <p>Discover the ideal JHAYRA gift — browse by occasion or by who you're shopping for.</p>
        </div>
      </div>

      <div className="container" style={{paddingTop:'2.5rem',paddingBottom:'4rem'}}>

        {/* Tab bar */}
        <div className="gift-tab-bar">
          <button
            className={`gift-tab${tab==='occasion'?' active':''}`}
            onClick={() => handleTab('occasion')}
          >
            By Occasion
          </button>
          <button
            className={`gift-tab${tab==='recipient'?' active':''}`}
            onClick={() => handleTab('recipient')}
          >
            By Recipient
          </button>
        </div>

        {/* Card grid */}
        <div className="gift-cards">
          {list.map(x => (
            <div
              key={x.id}
              role="button"
              tabIndex={0}
              className="gift-card"
              style={{background:x.bg, color:x.tc, cursor:'pointer'}}
              onClick={() => handleSelect(x)}
              onKeyDown={e => e.key === 'Enter' && handleSelect(x)}
            >
              <div className="gift-card-emoji">{x.emoji}</div>
              <div className="gift-card-label" style={{color:x.tc}}>{x.label}</div>
              <div className="gift-card-desc" style={{color:x.tc}}>{x.description}</div>
            </div>
          ))}
        </div>

        <div style={{textAlign:'center',padding:'3rem 0',color:'#9A8A6A'}}>
          <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🎁</div>
          <p style={{fontSize:'1rem'}}>
            {tab === 'occasion'
              ? 'Select an occasion above to see curated gift ideas'
              : 'Select a recipient to see the perfect gift suggestions'}
          </p>
        </div>

      </div>
    </div>
  );
}
