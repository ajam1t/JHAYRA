import { useState } from 'react';
import { useScrollReveal } from '../components/ScrollReveal';
import { Link } from 'react-router-dom';

const ROOMS = [
  { id:'living', label:'Living Room', image:'/Images/personalized.jpg' },
  { id:'bedroom', label:'Bedroom', image:'/Images/nature.jpg' },
  { id:'dining', label:'Dining Room', image:'/Images/modern.jpg' },
  { id:'office', label:'Office', image:'/Images/canvas.jpg' },
  { id:'mandir', label:'Mandir / Pooja', image:'/Images/religious.jpg' },
  { id:'gallery', label:'Gallery Wall', image:'/Images/horses.jpg' },
];

export default function RoomInspiration() {
  useScrollReveal();
  const [active, setActive] = useState('living');
  const room = ROOMS.find(r => r.id === active) || ROOMS[0];

  return (
    <div data-page="room-inspiration">
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow">Get Inspired</p>
          <h1>Room Inspiration</h1>
          <p>See how JHAYRA art transforms every space</p>
        </div>
      </div>
      <div className="container">
        {/* Room tabs */}
        <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap',marginBottom:'2rem',padding:'1rem 0'}}>
          {ROOMS.map(r => (
            <button key={r.id} onClick={()=>setActive(r.id)} className={active===r.id?'btn btn-gold':'btn btn-outline'} style={{fontSize:'.82rem',padding:'.5rem 1.1rem'}}>
              {r.label}
            </button>
          ))}
        </div>

        {/* Room display */}
        <div style={{borderRadius:'1.25rem',overflow:'hidden',marginBottom:'3rem',position:'relative',minHeight:'400px',background:'var(--bg)'}}>
          <img src={room.image} alt={room.label} style={{width:'100%',height:'420px',objectFit:'cover',display:'block'}} />
          <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(transparent,rgba(0,0,0,.6))',padding:'2rem 2rem 1.5rem'}}>
            <h2 style={{color:'#fff',fontFamily:'var(--fd)',marginBottom:'.5rem'}}>{room.label}</h2>
            <Link to="/shop" className="btn btn-gold" style={{fontSize:'.82rem'}}>Shop This Look</Link>
          </div>
        </div>

        {/* Room grid */}
        <div className="section-header s-reveal">
          <p className="eyebrow">Explore Looks</p>
          <h2 className="display-3">Every Room, a Gallery</h2>
          <div className="divider"></div>
        </div>
        <div className="cat-grid" style={{marginTop:'2rem'}}>
          {ROOMS.map((r,i) => (
            <div key={r.id} className="cat-card reveal" onClick={()=>setActive(r.id)} style={{cursor:'pointer'}}>
              <img loading="lazy" src={r.image} alt={r.label} />
              <div className="cat-card-overlay"></div>
              <div className="cat-card-body">
                <div className="cat-card-name">{r.label}</div>
                <div className="cat-card-count">View inspiration</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
