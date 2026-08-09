import { useState } from 'react';
import { useScrollReveal } from '../components/ScrollReveal';
import { useToast } from '../context/ToastContext';

export default function Corporate() {
  useScrollReveal();
  const { toast } = useToast();
  const [form, setForm] = useState({company:'',name:'',email:'',mobile:'',qty:'',occasion:''});

  const set = f => e => setForm(p => ({...p, [f]: e.target.value}));

  const handleEnquiry = e => {
    e.preventDefault();
    if (!form.name || !form.mobile) { toast('Please fill required fields'); return; }
    const msg = `Hello JHAYRA! Corporate Enquiry:\n\nCompany: ${form.company}\nContact: ${form.name}\nEmail: ${form.email}\nMobile: ${form.mobile}\nQuantity: ${form.qty}\nOccasion: ${form.occasion}\n\nPlease share pricing for bulk order.`;
    window.open(`https://wa.me/917070728989?text=${encodeURIComponent(msg)}`, '_blank');
    toast('Enquiry sent ✓');
  };

  return (
    <div data-page="corporate">
      {/* Hero */}
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow">Corporate Gifting</p>
          <h1>Memorable Gifts for Every Milestone</h1>
          <p>From employee appreciation to client gifts — JHAYRA creates premium, personalised wall art for corporates across India.</p>
        </div>
      </div>

      <div className="container">
        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'1.5rem',margin:'3rem 0',textAlign:'center'}}>
          {[
            {num:'500+',label:'Corporates Served'},
            {num:'50,000+',label:'Gifts Delivered'},
            {num:'48 hrs',label:'Bulk Turnaround'},
            {num:'100%',label:'Custom Branding'},
          ].map((s,i)=>(
            <div key={i} className="s-reveal" style={{background:'var(--bg)',borderRadius:'1rem',padding:'1.5rem 1rem'}}>
              <div style={{fontFamily:'var(--fd)',fontSize:'2rem',fontWeight:700,color:'var(--gold)',marginBottom:'.3rem'}}>{s.num}</div>
              <div style={{fontSize:'.8rem',color:'var(--muted)'}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Pricing tiers */}
        <div className="section-header s-reveal">
          <p className="eyebrow">Bulk Pricing</p>
          <h2 className="display-3">Choose Your Volume</h2>
          <div className="divider"></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:'1.5rem',margin:'2rem 0 3rem'}}>
          {[
            {tier:'Starter',qty:'10–49 units',price:'₹999/unit',desc:'Basic personalization, standard frame, delivery in 7 days.',highlight:false},
            {tier:'Business',qty:'50–199 units',price:'₹799/unit',desc:'Custom branding, choice of sizes, priority packaging, 5-day delivery.',highlight:true},
            {tier:'Enterprise',qty:'200+ units',price:'Custom pricing',desc:'Full customization, dedicated account manager, logo integration, express delivery.',highlight:false},
          ].map((p,i)=>(
            <div key={i} className="s-reveal" style={{borderRadius:'1.25rem',padding:'2rem',border:`2px solid ${p.highlight?'var(--gold)':'var(--cream)'}`,background:p.highlight?'rgba(182,141,64,.04)':'#fff',position:'relative'}}>
              {p.highlight && <div style={{position:'absolute',top:'-12px',left:'50%',transform:'translateX(-50%)',background:'var(--gold)',color:'#fff',padding:'.25rem 1rem',borderRadius:'var(--pill)',fontSize:'.72rem',fontWeight:700,letterSpacing:'.08em'}}>MOST POPULAR</div>}
              <div style={{fontFamily:'var(--fd)',fontSize:'1.25rem',marginBottom:'.3rem'}}>{p.tier}</div>
              <div style={{fontSize:'.82rem',color:'var(--muted)',marginBottom:'.75rem'}}>{p.qty}</div>
              <div style={{fontFamily:'var(--fd)',fontSize:'1.5rem',fontWeight:700,color:'var(--gold)',marginBottom:'.75rem'}}>{p.price}</div>
              <p style={{fontSize:'.82rem',color:'var(--muted)',lineHeight:1.65,marginBottom:'1.2rem'}}>{p.desc}</p>
              <a href="#corpForm" onClick={e=>{e.preventDefault();document.getElementById('corpForm')?.scrollIntoView({behavior:'smooth'})}} className={`btn ${p.highlight?'btn-gold':'btn-outline'}`} style={{width:'100%',display:'block',textAlign:'center',fontSize:'.82rem'}}>Get Quote</a>
            </div>
          ))}
        </div>

        {/* Enquiry form */}
        <section id="corpForm">
          <div className="section-header s-reveal">
            <p className="eyebrow">Get in Touch</p>
            <h2 className="display-3">Corporate Enquiry</h2>
            <div className="divider"></div>
          </div>
          <div className="box" style={{maxWidth:'680px',margin:'2rem auto'}}>
            <form onSubmit={handleEnquiry}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input type="text" className="form-input" placeholder="Acme Corp" value={form.company} onChange={set('company')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Name *</label>
                  <input type="text" className="form-input" placeholder="Your name" value={form.name} onChange={set('name')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" placeholder="you@company.com" value={form.email} onChange={set('email')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile *</label>
                  <input type="tel" className="form-input" placeholder="+91 98765 43210" value={form.mobile} onChange={set('mobile')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity Required</label>
                  <input type="number" className="form-input" placeholder="e.g. 50" value={form.qty} onChange={set('qty')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Occasion</label>
                  <input type="text" className="form-input" placeholder="Diwali, Employee Day..." value={form.occasion} onChange={set('occasion')} />
                </div>
              </div>
              <button type="submit" className="btn btn-gold btn-lg" style={{width:'100%',marginTop:'.5rem'}}>🟢 Send Enquiry on WhatsApp</button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
