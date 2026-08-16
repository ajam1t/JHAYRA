import { useScrollReveal } from '../components/ScrollReveal';
import SEO from '../components/SEO';

const REVIEWS = [
  {name:'Priya Menon',city:'Mumbai',rating:5,text:"JHAYRA turned our wedding memory into a wall centrepiece that stops every guest in their tracks. The frame finish is flawless, the packaging was luxurious, and delivery was right on time. Absolutely worth every rupee!",product:'Personalized Couple Frame'},
  {name:'Resham Chaudhary',city:'Delhi',rating:5,text:"Ordered the 7 Running Horses for our new home. The Vastu art looks magnificent and the canvas quality is truly premium. Received so many compliments from guests — it's the first thing everyone notices!",product:'7 Running Horses'},
  {name:'Ananya Krishnan',city:'Bengaluru',rating:5,text:"We renovated our apartment and needed art that suits a contemporary aesthetic. JHAYRA's abstract canvas is stunning — the colours work perfectly against our grey accent wall. Highly recommended for modern homes!",product:'Abstract Modern Art'},
  {name:'Venkat Suresh Reddy',city:'Hyderabad',rating:5,text:"Ordered the Mahadev canvas for our new home's pooja corner and we're absolutely in love. The print quality is exceptional — you can feel the devotion in every detail. Packaging was gorgeous and arrived safely.",product:'Mahadev Shiv Ji'},
  {name:'Karthik Subramanian',city:'Chennai',rating:5,text:"The nature canvas has transformed our home office completely. The colours are calming and the print quality is top-notch. Even my colleagues noticed it on video calls and asked where I got it from!",product:'Serenity Nature Canvas'},
  {name:'Debarati Banerjee',city:'Kolkata',rating:5,text:"Got a personalized frame for my parents' golden anniversary — the emotion on their faces was priceless. JHAYRA truly crafts memories. The photo quality and walnut frame finish exceeded every expectation.",product:'Personalized Couple Frame'},
  {name:'Sneha Patil',city:'Pune',rating:5,text:"Ordered a custom wedding frame as a gift for close friends. It arrived beautifully packaged and looked exactly as shown in the preview. The couple was overjoyed. JHAYRA's attention to detail is remarkable!",product:'LED Backlit Memory'},
  {name:'Mihir Shah',city:'Ahmedabad',rating:5,text:"The 7 Running Horses canvas looks spectacular in our drawing room. The colour vibrancy is incredible and it's exactly what our Vastu consultant recommended. Fast shipping and the quality is far beyond what I expected.",product:'7 Running Horses'},
  {name:'Santosh Sharma',city:'Jaipur',rating:5,text:"The Divine Ganesha canvas is now the centrepiece of our pooja room. The colours are vivid and the details are incredible. Delivered ahead of schedule — truly a premium experience from order to delivery!",product:'Divine Ganesha Canvas'},
  {name:'Palak Mehta & Ritu Chaudhary',city:'Umargam',rating:5,text:"We ordered a best friends collage to celebrate 10 years of our friendship and it turned out absolutely perfect! Every photo was placed so beautifully and the frame quality is truly premium. A memory we will cherish forever — thank you JHAYRA!",product:'Best Friends Collage'},
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
