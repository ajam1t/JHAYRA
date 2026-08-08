import { useState } from 'react';
import { useScrollReveal } from '../components/ScrollReveal';
import { Link } from 'react-router-dom';

const SAMPLE_ORDERS = [
  {id:'JH-2024-1042',name:'Personalized Couple Frame',date:'Feb 10, 2024',status:'Delivered',price:'₹1,499',step:4},
  {id:'JH-2024-0986',name:'Divine Ganesha Canvas',date:'Jan 28, 2024',status:'In Transit',price:'₹1,599',step:3},
  {id:'JH-2024-0875',name:'7 Running Horses',date:'Jan 15, 2024',status:'Processing',price:'₹1,399',step:2},
];

const STEPS = ['Order Placed','Processing','Shipped','Delivered'];

export default function Orders() {
  useScrollReveal();
  const [tab, setTab] = useState('all');

  const filtered = tab === 'all' ? SAMPLE_ORDERS :
    tab === 'active' ? SAMPLE_ORDERS.filter(o => o.status !== 'Delivered') :
    SAMPLE_ORDERS.filter(o => o.status === 'Delivered');

  return (
    <div data-page="orders">
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow">Your Account</p>
          <h1>My Orders</h1>
          <p>Track and manage your JHAYRA orders</p>
        </div>
      </div>
      <div className="container">
        {/* Tabs */}
        <div style={{display:'flex',gap:'.5rem',margin:'2rem 0 1.5rem',borderBottom:'2px solid var(--cream)'}}>
          {[{id:'all',label:'All Orders'},{id:'active',label:'Active'},{id:'delivered',label:'Delivered'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'.75rem 1.25rem',border:'none',background:'none',cursor:'pointer',fontWeight:tab===t.id?700:400,color:tab===t.id?'var(--gold)':'var(--muted)',borderBottom:`2px solid ${tab===t.id?'var(--gold)':'transparent'}`,marginBottom:'-2px',fontSize:'.88rem'}}>
              {t.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{textAlign:'center',padding:'4rem 0',color:'var(--muted)'}}>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>📦</div>
            <p style={{marginBottom:'1.5rem'}}>No orders found in this category.</p>
            <Link to="/shop" className="btn btn-gold">Shop Now</Link>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'1.25rem',marginBottom:'3rem'}}>
            {filtered.map(order=>(
              <div key={order.id} className="s-reveal" style={{background:'#fff',borderRadius:'1.25rem',padding:'1.5rem',boxShadow:'var(--sh)',border:'1px solid var(--cream)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'1rem',marginBottom:'1.25rem'}}>
                  <div>
                    <div style={{fontWeight:700,fontFamily:'var(--fd)',fontSize:'1rem',marginBottom:'.3rem'}}>{order.name}</div>
                    <div style={{fontSize:'.78rem',color:'var(--muted)'}}>Order {order.id} · {order.date}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontWeight:700,fontFamily:'var(--fd)',color:'var(--gold)'}}>{order.price}</div>
                    <div style={{fontSize:'.78rem',color:order.status==='Delivered'?'var(--ok)':order.status==='In Transit'?'#3B82F6':'var(--muted)',fontWeight:600}}>{order.status}</div>
                  </div>
                </div>
                {/* Progress */}
                <div style={{display:'flex',alignItems:'center',gap:0}}>
                  {STEPS.map((step, i) => (
                    <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',position:'relative'}}>
                      {i < STEPS.length - 1 && (
                        <div style={{position:'absolute',top:'10px',left:'50%',right:'-50%',height:'2px',background:i < order.step - 1?'var(--gold)':'var(--cream)',zIndex:0}}></div>
                      )}
                      <div style={{width:'20px',height:'20px',borderRadius:'50%',background:i < order.step?'var(--gold)':'var(--cream)',border:`2px solid ${i < order.step?'var(--gold)':'var(--cream)'}`,zIndex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'.6rem',fontWeight:700}}>
                        {i < order.step ? '✓' : i + 1}
                      </div>
                      <div style={{fontSize:'.62rem',color:i < order.step?'var(--gold)':'var(--muted)',marginTop:'.35rem',textAlign:'center',lineHeight:1.2}}>{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
