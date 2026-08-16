import { useState } from 'react';
import { useScrollReveal } from '../components/ScrollReveal';
import SEO from '../components/SEO';

const FAQS = [
  {q:'How long does delivery take?',a:'Standard delivery takes 5–7 business days across India. All orders ship free with no minimum order value.'},
  {q:'What if my order arrives damaged or incorrect?',a:'Please photograph the package and product before discarding packaging, then contact us via WhatsApp within 48 hours of delivery with your order number and photos. We will assess your case and arrange a replacement where eligible.'},
  {q:'How do I track my order?',a:'Once your order ships, you\'ll receive a tracking link via WhatsApp and SMS.'},
  {q:'Do you offer custom sizes?',a:'Yes, we can create custom sizes for special requirements. Contact us on WhatsApp with your specifications.'},
  {q:'What material is the frame?',a:'All JHAYRA frames are crafted from premium PS Moulding — a durable, lightweight material used in professional picture framing. Available in Black, Gold, and Brown finishes depending on the frame size.'},
  {q:'Is my payment secure?',a:'All orders are confirmed via WhatsApp and payment happens through secure channels. We never store card details.'},
  {q:'Do you ship internationally?',a:'Currently we ship within India only. International shipping will be available soon.'},
  {q:'Can I get a bulk discount?',a:'Yes! We offer special pricing for bulk orders (10+ units). Visit our Corporate page or WhatsApp us for a quote.'},
];

export default function Support() {
  useScrollReveal();
  const [open, setOpen] = useState(null);

  return (
    <div data-page="support">
      <SEO
        title="Help & Support | JHAYRA"
        description="Get help with your JHAYRA order — track shipment, manage returns, or contact our support team. FAQs, shipping info & WhatsApp support available."
        path="/support"
      />
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow">We're Here to Help</p>
          <h1>Support Center</h1>
          <p>We're here to help — 7 days a week</p>
        </div>
      </div>
      <div className="container">
        {/* Support categories */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'1.5rem',margin:'2.5rem 0'}}>
          {[
            {icon:'📦',title:'Track Order',desc:'Find where your order is right now',link:'https://wa.me/917070728989'},
            {icon:'↩️',title:'Returns',desc:'Start a return or exchange',link:'https://wa.me/917070728989'},
            {icon:'🎨',title:'Customize Help',desc:'Get help with your custom order',link:'https://wa.me/917070728989'},
          ].map((c,i)=>(
            <a key={i} href={c.link} target="_blank" rel="noopener noreferrer" className="s-reveal" style={{display:'block',background:'var(--bg)',borderRadius:'1.25rem',padding:'1.8rem 1.5rem',textAlign:'center',textDecoration:'none',color:'var(--text)',border:'1px solid var(--cream)'}}>
              <div style={{fontSize:'2.5rem',marginBottom:'.75rem'}}>{c.icon}</div>
              <div style={{fontWeight:600,fontFamily:'var(--fd)',marginBottom:'.4rem'}}>{c.title}</div>
              <p style={{fontSize:'.82rem',color:'var(--muted)',lineHeight:1.6}}>{c.desc}</p>
            </a>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="section-header s-reveal" style={{marginTop:'3rem'}}>
          <p className="eyebrow">FAQ</p>
          <h2 className="display-3">Frequently Asked Questions</h2>
          <div className="divider"></div>
        </div>
        <div style={{maxWidth:'720px',margin:'2rem auto 3rem'}}>
          {FAQS.map((faq, i) => (
            <div key={i} className="s-reveal" style={{borderBottom:'1px solid var(--cream)'}}>
              <button onClick={()=>setOpen(open===i?null:i)} style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'1.1rem 0',background:'none',border:'none',cursor:'pointer',textAlign:'left',fontWeight:600,fontSize:'.9rem',color:'var(--text)'}}>
                {faq.q}
                <span style={{color:'var(--gold)',fontSize:'1.2rem',transform:open===i?'rotate(45deg)':'none',transition:'transform .25s',flexShrink:0,marginLeft:'1rem'}}>+</span>
              </button>
              {open === i && (
                <div style={{padding:'0 0 1.1rem',color:'var(--muted)',fontSize:'.88rem',lineHeight:1.75}}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Care guide */}
        <div className="section-header s-reveal">
          <p className="eyebrow">Care Guide</p>
          <h2 className="display-3">Keep It Beautiful</h2>
          <div className="divider"></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'1.5rem',margin:'2rem 0 3rem'}}>
          {[
            {icon:'🌡️',tip:'Avoid direct sunlight and extreme heat'},
            {icon:'💧',tip:'Wipe with a dry or slightly damp cloth only'},
            {icon:'📌',tip:'Use the provided hanging hardware for secure mounting'},
            {icon:'🏠',tip:'Maintain moderate humidity for canvas longevity'},
          ].map((c,i)=>(
            <div key={i} className="s-reveal" style={{background:'#fff',borderRadius:'1rem',padding:'1.5rem',boxShadow:'var(--sh)',textAlign:'center'}}>
              <div style={{fontSize:'2rem',marginBottom:'.75rem'}}>{c.icon}</div>
              <p style={{fontSize:'.84rem',color:'var(--muted)',lineHeight:1.6}}>{c.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
