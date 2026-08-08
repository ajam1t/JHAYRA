import { useScrollReveal } from '../components/ScrollReveal';
import { Link } from 'react-router-dom';

export default function About() {
  useScrollReveal();
  return (
    <div data-page="about">
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow">Our Story</p>
          <h1>About JHAYRA</h1>
          <p>Crafting memories into art, one frame at a time</p>
        </div>
      </div>
      <div className="container">
        <section className="section">
          <div className="section-header s-reveal">
            <p className="eyebrow">Our Story</p>
            <h2 className="display-3">Born from a Belief</h2>
            <div className="divider"></div>
          </div>
          <div style={{maxWidth:'720px',margin:'0 auto',textAlign:'center'}}>
            <p className="s-reveal" style={{color:'var(--muted)',lineHeight:1.9,fontSize:'1rem',marginBottom:'1.5rem'}}>
              JHAYRA was founded with a single belief — that your most cherished memories deserve to be displayed with beauty and intention. What began as a small workshop in India has grown into a brand trusted by over 10,000 homes across the country.
            </p>
            <p className="s-reveal" style={{color:'var(--muted)',lineHeight:1.9,fontSize:'1rem',marginBottom:'1.5rem'}}>
              Every frame we craft is made to order — because your memory is unique, and so should be the way it is displayed. We use museum-grade materials, precision printing, and artisan craftsmanship to ensure each piece lasts a lifetime.
            </p>
          </div>
        </section>

        <section className="section" style={{background:'var(--bg)',borderRadius:'1.5rem',padding:'3rem 2rem'}}>
          <div className="section-header s-reveal">
            <p className="eyebrow">Our Values</p>
            <h2 className="display-3">What We Stand For</h2>
            <div className="divider"></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'2rem',marginTop:'2rem'}}>
            {[
              {emoji:'🎨',title:'Craftsmanship',desc:'Every piece is hand-finished with care. We believe in quality over quantity.'},
              {emoji:'💝',title:'Personalization',desc:"No two frames are alike. We craft each order uniquely for you."},
              {emoji:'🌿',title:'Sustainability',desc:'We source eco-friendly materials and minimize waste in our process.'},
              {emoji:'🤝',title:'Community',desc:'We partner with local artisans and give back to the communities we serve.'},
            ].map((v,i)=>(
              <div key={i} className="why-card s-reveal" style={{textAlign:'center'}}>
                <div style={{fontSize:'2.5rem',marginBottom:'.75rem'}}>{v.emoji}</div>
                <div className="why-title">{v.title}</div>
                <p className="why-desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-header s-reveal">
            <p className="eyebrow">Behind the Brand</p>
            <h2 className="display-3">The Team</h2>
            <div className="divider"></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'2rem',marginTop:'2rem'}}>
            {[
              {name:'Sandeep Jha',role:'Founder & CEO'},
              {name:'Amit Jha',role:'IT Infrastructure & Developer Head'},
              {name:'Sumit Jha',role:'Production Head'},
              {name:'Babita Jha & Manoj Jha',role:'Creative Mentors'},
              {name:'Janaki Jha',role:'Finance Head'},
            ].map((m,i)=>(
              <div key={i} className="s-reveal" style={{textAlign:'center',background:'var(--bg)',borderRadius:'1.25rem',padding:'2rem 1.5rem'}}>
                <div style={{width:'80px',height:'80px',borderRadius:'50%',background:`hsl(${i*60+25},35%,58%)`,margin:'0 auto 1rem',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.6rem',color:'#fff',fontFamily:'var(--fd)',fontWeight:700}}>
                  {m.name.charAt(0)}
                </div>
                <div style={{fontWeight:600,fontFamily:'var(--fd)',marginBottom:'.3rem'}}>{m.name}</div>
                <div style={{fontSize:'.82rem',color:'var(--muted)'}}>{m.role}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="section" style={{textAlign:'center'}}>
          <div className="s-reveal" style={{background:'linear-gradient(140deg,#1A1208,#2C1A06)',borderRadius:'1.5rem',padding:'4rem 3rem',color:'#fff'}}>
            <h2 className="display-3" style={{color:'#fff',marginBottom:'1rem'}}>Ready to Create?</h2>
            <p style={{color:'rgba(255,255,255,.65)',marginBottom:'2rem',maxWidth:'420px',margin:'0 auto 2rem'}}>Turn your favourite memory into a premium framed print.</p>
            <Link to="/customize" className="btn btn-gold btn-lg">Start Customizing</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
