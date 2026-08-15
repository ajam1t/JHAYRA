import { useScrollReveal } from '../components/ScrollReveal';
import SEO from '../components/SEO';

const REVIEWS = [
  {name:'Amit & Janaki',city:'Patna',rating:5,text:"We got our wedding photo framed for our anniversary and it was beyond anything we expected. The craftsmanship is flawless — every detail is perfect. Our walls finally feel complete!",product:'Personalized Couple Frame'},
  {name:'Resham Chaudhary',city:'Delhi',rating:5,text:"Ordered the 7 Running Horses for our new home. The Vastu art looks magnificent and the canvas quality is truly premium. Received so many compliments from guests!",product:'7 Running Horses'},
  {name:'Jessica James',city:'Mumbai',rating:5,text:"JHAYRA delivered something truly special. The frame quality is outstanding and it arrived beautifully packaged. Will definitely order again for my family!",product:'LED Backlit Memory'},
  {name:'Santosh Sharma',city:'Jaipur',rating:5,text:"The Divine Ganesha canvas is now the centrepiece of our pooja room. The colours are vivid and the details are incredible. Delivered ahead of schedule!",product:'Divine Ganesha Canvas'},
  {name:'Ritu Kumari',city:'Lucknow',rating:5,text:"I gifted a custom couple frame to my sister on her wedding and she was in tears. It looked exactly like the preview and the packaging was so premium. JHAYRA is simply the best!",product:'Personalized Couple Frame'},
  {name:'Sumit Jha',city:'Patna',rating:5,text:"Extremely happy with the quality. The Mahadev canvas print looks absolutely divine in our living room. The wood frame finish is beautiful and delivery was faster than expected.",product:'Mahadev Shiv Ji'},
  {name:'Sandeep Jha',city:'Patna',rating:5,text:"Exceptional quality and service. We ordered multiple frames for our office and each one was perfect. The team was very helpful in customising sizes to our requirement.",product:'Abstract Modern Art'},
  {name:'Babita Jha',city:'Patna',rating:5,text:"The nature canvas brought such a calming energy to our bedroom. Beautiful colours, premium quality, and it arrived safely with great care in packaging.",product:'Serenity Nature Canvas'},
];

export default function CustomerStories() {
  useScrollReveal();
  return (
    <div data-page="stories">
      <SEO
        title="Customer Stories | JHAYRA Reviews"
        description="Read what our customers say about JHAYRA personalized photo frames. Real stories, real memories — see why thousands of happy homes across India love JHAYRA."
        path="/stories"
      />
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow">Happy Homes</p>
          <h1>Customer Stories</h1>
          <p>10,000+ happy homes — hear from them</p>
        </div>
      </div>
      <div className="container">
        {/* Review grid */}
        <section className="section">
          <div className="section-header s-reveal">
            <p className="eyebrow">Reviews</p>
            <h2 className="display-3">What Our Customers Say</h2>
            <div className="divider"></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'1.5rem',marginTop:'2rem'}}>
            {REVIEWS.map((r,i)=>(
              <div key={i} className="s-reveal" style={{background:'#fff',borderRadius:'1.25rem',padding:'1.5rem',boxShadow:'var(--sh)'}}>
                <div style={{display:'flex',gap:'.75rem',alignItems:'center',marginBottom:'.75rem'}}>
                  <div style={{width:'44px',height:'44px',borderRadius:'50%',background:`hsl(${i*50+30},35%,65%)`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:'1rem'}}>{r.name.charAt(0)}</div>
                  <div>
                    <div style={{fontWeight:600,fontSize:'.88rem'}}>{r.name}</div>
                    <div style={{fontSize:'.75rem',color:'var(--muted)'}}>{r.city}</div>
                  </div>
                  <div style={{marginLeft:'auto',color:'#F59E0B',fontSize:'.9rem'}}>{'★'.repeat(r.rating)}</div>
                </div>
                <p style={{fontSize:'.85rem',color:'var(--muted)',lineHeight:1.7,marginBottom:'.75rem'}}>"{r.text}"</p>
                <div style={{fontSize:'.72rem',color:'var(--gold)',fontWeight:600}}>— {r.product}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Before/After section */}
        <section className="section" style={{background:'var(--bg)',borderRadius:'1.5rem',padding:'3rem 2rem',marginBottom:'3rem'}}>
          <div className="section-header s-reveal">
            <p className="eyebrow">Transformations</p>
            <h2 className="display-3">Before &amp; After</h2>
            <div className="divider"></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'1.5rem',marginTop:'2rem'}}>
            {[
              {room:'Living Room',before:'Plain white wall',after:'Gallery of 3 framed canvas prints'},
              {room:'Bedroom',before:'Empty wall above bed',after:'Personalized couple frame centrepiece'},
              {room:'Pooja Room',before:'Simple shelf with idols',after:'Illuminated Divine Ganesha canvas'},
            ].map((b,i)=>(
              <div key={i} className="s-reveal" style={{borderRadius:'1rem',overflow:'hidden',background:'#fff',boxShadow:'var(--sh)'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',height:'180px'}}>
                  <div style={{background:`hsl(${i*60},10%,85%)`,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'.4rem',padding:'1rem'}}>
                    <div style={{fontSize:'.65rem',fontWeight:700,letterSpacing:'.1em',color:'#888',textTransform:'uppercase'}}>Before</div>
                    <div style={{fontSize:'.78rem',color:'#666',textAlign:'center'}}>{b.before}</div>
                  </div>
                  <div style={{background:`hsl(${i*60+20},25%,75%)`,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'.4rem',padding:'1rem'}}>
                    <div style={{fontSize:'.65rem',fontWeight:700,letterSpacing:'.1em',color:'#fff',textTransform:'uppercase'}}>After</div>
                    <div style={{fontSize:'.78rem',color:'#fff',textAlign:'center'}}>{b.after}</div>
                  </div>
                </div>
                <div style={{padding:'.75rem 1rem',fontSize:'.82rem',fontWeight:600}}>{b.room}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
