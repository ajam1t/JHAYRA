import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useScrollReveal } from '../components/ScrollReveal';

export default function Contact() {
  useScrollReveal();
  const { toast } = useToast();
  const [form, setForm] = useState({name:'',email:'',subject:'',message:''});

  const set = f => e => setForm(prev => ({...prev, [f]: e.target.value}));

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { toast('Please fill all required fields'); return; }
    const msg = `Hello JHAYRA!\n\nName: ${form.name}\nEmail: ${form.email}\nSubject: ${form.subject}\n\nMessage:\n${form.message}`;
    window.open(`https://wa.me/917070728989?text=${encodeURIComponent(msg)}`, '_blank');
    toast('Opening WhatsApp — tap Send to complete');
    setForm({name:'',email:'',subject:'',message:''});
  };

  return (
    <div data-page="contact">
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow">Reach Out</p>
          <h1>Contact Us</h1>
          <p>We'd love to hear from you</p>
        </div>
      </div>
      <div className="container">
        <div className="contact-wrap">
          <div className="contact-info">
            <h3 style={{fontFamily:'var(--fd)',fontSize:'1.3rem',marginBottom:'1.2rem'}}>Get in Touch</h3>
            {[
              {icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.82A2 2 0 0 1 3.6 1.61h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.5a16 16 0 0 0 5.55 5.55l.61-.61a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>, label:'WhatsApp', value:'+91 70707 28989', href:'https://wa.me/917070728989'},
              {icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, label:'Email', value:'hello@jhayra.in', href:'mailto:hello@jhayra.in'},
              {icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, label:'Location', value:'India', href:'#'},
            ].map((item, i) => (
              <a key={i} href={item.href} target="_blank" rel="noopener noreferrer" style={{display:'flex',gap:'.75rem',alignItems:'center',padding:'.9rem 1rem',borderRadius:'.75rem',border:'1px solid var(--cream)',textDecoration:'none',color:'var(--text)',marginBottom:'.75rem'}}>
                <span style={{color:'var(--gold)'}}>{item.icon}</span>
                <div>
                  <div style={{fontSize:'.72rem',color:'var(--muted)',marginBottom:'.1rem'}}>{item.label}</div>
                  <div style={{fontSize:'.88rem',fontWeight:500}}>{item.value}</div>
                </div>
              </a>
            ))}
            <div style={{marginTop:'1.5rem',padding:'1.2rem',background:'var(--bg)',borderRadius:'.75rem'}}>
              <div style={{fontWeight:600,marginBottom:'.4rem',fontSize:'.88rem'}}>Business Hours</div>
              <div style={{fontSize:'.82rem',color:'var(--muted)',lineHeight:1.7}}>Mon – Sat: 9:00 AM – 7:00 PM<br />Sunday: 10:00 AM – 4:00 PM</div>
            </div>
          </div>
          <div className="box">
            <h3 style={{fontFamily:'var(--fd)',fontSize:'1.3rem',marginBottom:'1.2rem'}}>Send a Message</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input type="text" className="form-input" placeholder="Your name" value={form.name} onChange={set('name')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" className="form-input" placeholder="you@email.com" value={form.email} onChange={set('email')} />
                </div>
                <div className="form-group full">
                  <label className="form-label">Subject</label>
                  <input type="text" className="form-input" placeholder="How can we help?" value={form.subject} onChange={set('subject')} />
                </div>
                <div className="form-group full">
                  <label className="form-label">Message *</label>
                  <textarea className="form-textarea" rows={4} placeholder="Tell us more..." value={form.message} onChange={set('message')} />
                </div>
              </div>
              <button type="submit" className="btn btn-gold btn-lg" style={{width:'100%',marginTop:'.5rem'}}>Send Message via WhatsApp</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
