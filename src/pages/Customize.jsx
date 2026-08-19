import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useScrollReveal } from '../components/ScrollReveal';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { TEMPLATES, TEMPLATE_GROUPS, filterTemplatesWithSearch, getTemplateById } from '../data/templates';
import TemplateCard from '../components/TemplateCard';
import TemplateRenderer from '../components/TemplateRenderer';
import FramedArt from '../components/FramedArt';
import PhotoEditModal from '../components/PhotoEditModal';
import { FRAME_SIZES, coloursForSize, getFrameOption, MIN_FRAME_PRICE, frameGeometry } from '../data/frameOptions';
import { uploadCustomerArtwork } from '../lib/artwork';
import SEO from '../components/SEO';

/* ── WhatsApp design-service shared helpers ──────────────────────────────── */
const WA_TEAM_URL = `https://wa.me/917070728989?text=${encodeURIComponent("Hi JHAYRA! I'd like your team to design a custom frame for me. I'll share my photo and ideas here 🎨")}`;

function WaIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" style={{width:size,height:size,fill:'currentColor',flexShrink:0}}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

/* ── Template Gallery ─────────────────────────────────────────────────────── */
function TemplateGallery() {
  useScrollReveal();
  const [group,       setGroup]       = useState('all');
  const [photoCount,  setPhotoCount]  = useState('all');
  const [onlyPopular, setOnlyPopular] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = filterTemplatesWithSearch({ group, photoSlots: photoCount, onlyPopular, query: searchQuery });

  // Detect fuzzy fallback: query is non-empty but no result has a direct substring match
  const q = searchQuery.trim().toLowerCase();
  const isFuzzyFallback = q.length > 0 && filtered.length > 0 && !filtered.some(t => {
    const hay = [t.title, t.subtitle, t.description, t.group, ...(t.occasion||[]), ...(t.recipient||[])].join(' ').toLowerCase();
    return hay.includes(q);
  });

  const photoOpts = [
    {value:'all',    label:'Any photos'},
    {value:'0',      label:'No photo needed'},
    {value:'1',      label:'1 photo'},
    {value:'2-3',    label:'2–3 photos'},
    {value:'4-6',    label:'4–6 photos'},
    {value:'7+',     label:'7+ photos'},
  ];

  return (
    <div data-page="customize">
      <SEO
        title="Customize Your Photo Frame | JHAYRA"
        description="Create your own personalized photo frame with JHAYRA. Choose a design template, upload your photos, add names & dates — we craft and deliver it across India."
        path="/customize"
      />
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow s-reveal">Make It Yours</p>
          <h1 className="s-reveal">
            Choose a{' '}
            <span style={{background:'linear-gradient(135deg,#E8B84C 0%,#F5D888 50%,#C8961E 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>Template</span>
          </h1>
          <p className="s-reveal">Pick a design, upload your photos, personalise the text — we craft it by hand and deliver it to your doorstep.</p>
        </div>
      </div>

      <div className="container" style={{paddingTop:'2rem',paddingBottom:'4rem'}}>

        {/* Build From Scratch — primary CTA at the top */}
        <div style={{marginBottom:'2rem',padding:'2rem',background:'#F8F4EE',borderRadius:'16px',textAlign:'center',border:'1px solid #EAE4D8'}}>
          <p className="eyebrow" style={{marginBottom:'.5rem'}}>Just want a simple custom print?</p>
          <p style={{color:'#7A6E60',fontSize:'.9rem',marginBottom:'1.2rem'}}>Upload any photo and choose your frame size, material, and colour.</p>
          <Link to="/customize/scratch" className="btn btn-gold">Build From Scratch</Link>
        </div>

        {/* WhatsApp design service */}
        <div style={{
          marginBottom:'2rem',
          background:'linear-gradient(135deg,#F0FAF2 0%,#E6F7EA 100%)',
          border:'1.5px solid #B8E6C4',
          borderRadius:'16px',
          padding:'1.75rem 2rem',
          display:'flex',alignItems:'center',gap:'1.5rem',flexWrap:'wrap',
        }}>
          <div style={{
            width:'54px',height:'54px',borderRadius:'50%',flexShrink:0,
            background:'#25D366',
            display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:'0 4px 18px rgba(37,211,102,.35)',
            color:'#fff',
          }}>
            <WaIcon size={28}/>
          </div>
          <div style={{flex:1,minWidth:'200px'}}>
            <div style={{fontWeight:700,fontSize:'1rem',color:'#0F2A1A',marginBottom:'.3rem'}}>
              Let our team design for you
            </div>
            <div style={{fontSize:'.85rem',color:'#3A6A4A',lineHeight:1.5}}>
              Share your photo, idea or reference on WhatsApp — our designers will craft the perfect custom frame for you.
            </div>
          </div>
          <a href={WA_TEAM_URL} target="_blank" rel="noopener noreferrer"
            style={{
              display:'inline-flex',alignItems:'center',gap:'.45rem',
              padding:'.7rem 1.5rem',borderRadius:'var(--pill)',flexShrink:0,
              background:'#25D366',color:'#fff',
              fontWeight:700,fontSize:'.88rem',textDecoration:'none',
              boxShadow:'0 4px 16px rgba(37,211,102,.35)',
              whiteSpace:'nowrap',
            }}>
            <WaIcon size={17}/>
            Chat on WhatsApp
          </a>
        </div>

        {/* Search box — visible on both mobile and desktop */}
        <div className="cz-search-wrap">
          <svg className="cz-search-icon" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="cz-search-input"
            placeholder="Search designs, occasions or memories..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="cz-search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">✕</button>
          )}
        </div>

        {/* Mobile-only: horizontal category pills */}
        <div className="cz-mobile-bar">
          <div className="cz-mobile-pills">
            <button className={`cz-pill${group==='all'?' active':''}`} onClick={()=>setGroup('all')}>
              All <span className="cz-pill-cnt">{TEMPLATES.filter(t=>t.status==='active').length}</span>
            </button>
            {TEMPLATE_GROUPS.map(g => {
              const cnt = TEMPLATES.filter(t=>t.group===g.id&&t.status==='active').length;
              return (
                <button key={g.id} className={`cz-pill${group===g.id?' active':''}`} onClick={()=>setGroup(g.id)}>
                  {g.label} <span className="cz-pill-cnt">{cnt}</span>
                </button>
              );
            })}
          </div>
          <div className="cz-mobile-row2">
            <select
              className="cz-mobile-select"
              value={photoCount}
              onChange={e=>setPhotoCount(e.target.value)}
            >
              {photoOpts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button
              className={`cz-mobile-toggle${onlyPopular?' active':''}`}
              onClick={()=>setOnlyPopular(p=>!p)}
            >
              ⭐ Popular
            </button>
          </div>
        </div>

        <div className="cz-layout">

          {/* Sidebar — desktop only */}
          <aside className="cz-sidebar">
            <div className="cz-filters">
              <div>
                <div className="cz-filter-title">Design Type</div>
                <div className="cz-filter-opts">
                  <button
                    className={`cz-filter-opt${group==='all'?' active':''}`}
                    onClick={()=>setGroup('all')}
                  >
                    All Designs
                    <span className="cnt">{TEMPLATES.filter(t=>t.status==='active').length}</span>
                  </button>
                  {TEMPLATE_GROUPS.map(g => {
                    const cnt = TEMPLATES.filter(t => t.group===g.id && t.status==='active').length;
                    return (
                      <button
                        key={g.id}
                        className={`cz-filter-opt${group===g.id?' active':''}`}
                        onClick={()=>setGroup(g.id)}
                      >
                        {g.label}
                        <span className="cnt">{cnt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="cz-filter-title">No. of Photos</div>
                <div className="cz-filter-opts">
                  {photoOpts.map(o => (
                    <button
                      key={o.value}
                      className={`cz-filter-opt${photoCount===o.value?' active':''}`}
                      onClick={()=>setPhotoCount(o.value)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="cz-filter-title">Sort</div>
                <div className="cz-filter-opts">
                  <button
                    className={`cz-filter-opt${!onlyPopular?' active':''}`}
                    onClick={()=>setOnlyPopular(false)}
                  >All</button>
                  <button
                    className={`cz-filter-opt${onlyPopular?' active':''}`}
                    onClick={()=>setOnlyPopular(true)}
                  >Popular &amp; Best Sellers</button>
                </div>
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div style={{flex:1,minWidth:0}}>
            {isFuzzyFallback && (
              <p className="cz-search-note">Showing related designs for '{searchQuery}'</p>
            )}
            <p style={{fontSize:'.85rem',color:'#9A8A6A',marginBottom:'1.2rem'}}>
              {filtered.length} design{filtered.length!==1?'s':''} found
            </p>
            {filtered.length > 0 ? (
              <div className="tmpl-gallery">
                {filtered.map(t => <TemplateCard key={t.id} template={t} />)}
              </div>
            ) : (
              <div style={{textAlign:'center',padding:'4rem 0',color:'#9A8A6A'}}>
                <div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>🖼️</div>
                <p>No templates found with these filters.</p>
                <button className="btn btn-outline" style={{marginTop:'1rem'}} onClick={()=>{setGroup('all');setPhotoCount('all');setOnlyPopular(false);setSearchQuery('');}}>
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Scratch Builder ─────────────────────────────────────────────────────── */
function ScratchBuilder() {
  useScrollReveal();
  const { addToCartWithFrame } = useCart();
  const { toast }              = useToast();
  const [selectedSize,        setSelectedSize]        = useState(FRAME_SIZES[0]);
  const [selectedColour,      setSelectedColour]      = useState(coloursForSize(FRAME_SIZES[0])[0]);
  const [selectedOrientation, setSelectedOrientation] = useState('Vertical');
  const [photo, setPhoto] = useState(null);
  const [photoMeta, setPhotoMeta] = useState(null); // {name,width,height,size,type} of the ORIGINAL upload
  const [photoTransform, setPhotoTransform] = useState({ zoom: 1, panX: 0, panY: 0 }); // crop/zoom/reposition
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [adding, setAdding] = useState(false);
  const czRoomRef = useRef(null);

  const availableColours  = coloursForSize(selectedSize);
  const frameOption       = getFrameOption(selectedSize, selectedColour);

  const isPortrait  = selectedOrientation === 'Vertical';
  const { frameH, actualSize } = frameGeometry(selectedSize, selectedOrientation);
  const sizeLabel   = `${selectedSize} · ${isPortrait ? 'Vertical' : 'Horizontal'} · ${actualSize} · ${selectedColour} · PS Moulding`;

  const handleSizeChange = (size) => {
    setSelectedSize(size);
    const cols = coloursForSize(size);
    if (!cols.includes(selectedColour)) setSelectedColour(cols[0]);
  };

  useEffect(() => {
    const cz = czRoomRef.current;
    if (!cz) return;
    const onMove = e => {
      const r  = cz.getBoundingClientRect();
      const mx = (e.clientX - r.left) / r.width - .5;
      const my = (e.clientY - r.top)  / r.height - .5;
      cz.style.transform = `perspective(900px) rotateX(${(-my*4).toFixed(2)}deg) rotateY(${(mx*4).toFixed(2)}deg)`;
    };
    const onLeave = () => { cz.style.transform = ''; };
    cz.addEventListener('mousemove', onMove);
    cz.addEventListener('mouseleave', onLeave);
    return () => { cz.removeEventListener('mousemove', onMove); cz.removeEventListener('mouseleave', onLeave); };
  }, []);

  const handleUpload = e => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target.result;
      // Capture original-file metadata (filename, size, type + pixel dimensions)
      const img = new Image();
      img.onload = () => {
        setPhoto(dataUrl);
        setPhotoMeta({ name: f.name || null, size: f.size || null, type: f.type || null, width: img.naturalWidth, height: img.naturalHeight });
        setPhotoTransform({ zoom: 1, panX: 0, panY: 0 });
        toast('Photo updated! ✓');
      };
      img.onerror = () => {
        setPhoto(dataUrl);
        setPhotoMeta({ name: f.name || null, size: f.size || null, type: f.type || null, width: null, height: null });
        setPhotoTransform({ zoom: 1, panX: 0, panY: 0 });
        toast('Photo updated! ✓');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(f);
  };

  const MiniCard = ({label, sublabel, active, onClick}) => (
    <div className={`mini-card${active?' active':''}`} onClick={onClick} style={{cursor:'pointer',lineHeight:1.25}}>
      <div>{label}</div>
      {sublabel && <div style={{fontSize:'.65rem',opacity:.75,marginTop:'.1rem'}}>{sublabel}</div>}
    </div>
  );

  return (
    <div data-page="customize">
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow s-reveal">Make It Yours</p>
          <h1 className="s-reveal">
            Your Photo. Your Frame.{' '}
            <span style={{background:'linear-gradient(135deg,#E8B84C 0%,#F5D888 50%,#C8961E 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>Your Wall.</span>
          </h1>
          <p className="s-reveal">Upload a photo, choose your frame size and colour — we craft it by hand and deliver free across India.</p>
        </div>
      </div>
      <section className="cz-tool">
        <div className="container">
          <div className="cz-tool-head s-reveal">
            <p className="eyebrow" style={{textAlign:'center'}}>Customize Your Frame</p>
            <h2 className="display-3" style={{textAlign:'center',marginTop:'.4rem'}}>Build Your Perfect Print</h2>
          </div>
          <div style={{textAlign:'center',marginBottom:'1.5rem'}}>
            <Link to="/customize" style={{fontSize:'.85rem',color:'#9A8A6A',textDecoration:'underline'}}>← Back to Templates</Link>
          </div>
          <div className="customize-wrap">
            <div className="cz-panel">
              <div>
                <div className="cz-step">Step 1 · Upload Photo</div>
                <label className="upload" style={{cursor:'pointer'}}>
                  <input type="file" accept="image/*" style={{display:'none'}} onChange={handleUpload} />
                  <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <div style={{fontWeight:600,marginBottom:'.3rem'}}>Drag &amp; drop your photo</div>
                  <div style={{fontSize:'.8rem',color:'var(--muted)'}}>or click to browse (JPG, PNG)</div>
                </label>
              </div>
              <div>
                <div className="cz-step">Step 2 · Frame Size</div>
                <div className="grid3">
                  {FRAME_SIZES.map(s => {
                    const fo = getFrameOption(s, coloursForSize(s)[0]);
                    return (
                      <MiniCard key={s} label={s}
                        sublabel={fo ? fo.dimensions : ''}
                        active={selectedSize===s}
                        onClick={()=>handleSizeChange(s)}
                      />
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="cz-step">Step 3 · Orientation</div>
                <div style={{display:'flex',gap:'.5rem',marginTop:'.4rem',flexWrap:'wrap'}}>
                  {[{key:'Vertical',icon:'▯',label:'Vertical'},{key:'Horizontal',icon:'▭',label:'Horizontal'}].map(({key,icon,label})=>(
                    <div key={key} className={`mini-card${selectedOrientation===key?' active':''}`}
                      onClick={()=>setSelectedOrientation(key)}
                      style={{cursor:'pointer',display:'flex',alignItems:'center',gap:'.3rem'}}>
                      <span style={{fontSize:'1rem'}}>{icon}</span>{label}
                    </div>
                  ))}
                </div>
                <p style={{fontSize:'.72rem',color:'#9A8A6A',marginTop:'.3rem',margin:'.3rem 0 0'}}>{actualSize}</p>
              </div>
              <div>
                <div className="cz-step">Step 4 · Frame Colour</div>
                <div className="grid3">
                  {availableColours.map(c=>(
                    <MiniCard key={c} label={c} active={selectedColour===c} onClick={()=>setSelectedColour(c)}/>
                  ))}
                </div>
                {availableColours.length === 1 && (
                  <p style={{fontSize:'.72rem',color:'#9A8A6A',marginTop:'.4rem'}}>{selectedSize} is available in Black only.</p>
                )}
              </div>
              <button className="btn btn-gold btn-lg" style={{width:'100%',opacity:adding?0.7:1}} disabled={adding} onClick={async ()=>{
                if (!photo) { toast('Please upload a photo first'); return; }
                if (!frameOption || adding) return;
                setAdding(true);
                try {
                  const up = await uploadCustomerArtwork([{ dataUrl: photo, name: photoMeta?.name, width: photoMeta?.width, height: photoMeta?.height }]);
                  // Failed-upload protection: if persistent storage is available but the
                  // original didn't save, do NOT create an order that references a missing image.
                  if (up.supabaseEnabled && up.uploaded < up.requested) {
                    toast('Photo upload failed — please try again before adding to cart.');
                    return;
                  }
                  addToCartWithFrame('custom', frameOption, 'Custom Photo Frame', 1, isPortrait ? 'Vertical' : 'Horizontal', frameOption.price, {
                    artworkPaths: up.paths,
                    customization: {
                      source: 'scratch-builder',
                      orientation: isPortrait ? 'Vertical' : 'Horizontal',
                      artworkMeta: up.meta,
                      transform: photoTransform,
                    },
                  });
                  toast('Custom frame added to cart ✓');
                } finally {
                  setAdding(false);
                }
              }}>
                {adding ? 'Adding…' : `Add to Cart · ₹${(frameOption?.price ?? MIN_FRAME_PRICE).toLocaleString('en-IN')}`}
              </button>

              {/* WhatsApp alternative */}
              <div style={{marginTop:'.75rem',textAlign:'center'}}>
                <span style={{fontSize:'.75rem',color:'#9A8A6A',display:'block',marginBottom:'.55rem'}}>— or share directly with our team —</span>
                <a href={WA_TEAM_URL} target="_blank" rel="noopener noreferrer"
                  style={{
                    display:'inline-flex',alignItems:'center',gap:'.4rem',
                    padding:'.6rem 1.4rem',borderRadius:'var(--pill)',
                    background:'#25D366',color:'#fff',
                    fontWeight:700,fontSize:'.82rem',textDecoration:'none',
                    boxShadow:'0 3px 14px rgba(37,211,102,.32)',
                  }}>
                  <WaIcon size={16}/>
                  Share on WhatsApp — we'll design for you
                </a>
              </div>
            </div>
            <div className="cz-preview">
              <div ref={czRoomRef} style={{
                background:'var(--bg)',
                height:'clamp(340px,52vh,520px)',
                display:'flex',flexDirection:'column',
                alignItems:'center',justifyContent:'center',
                padding:'1.5rem',gap:'.9rem',
                borderRadius:'1rem 1rem 0 0',
                position:'relative',
                transition:'transform .15s cubic-bezier(.16,1,.3,1)',
                cursor:'crosshair',
                overflow:'hidden',
              }}>
                {/* JHAYRA frame rendered around the customer's clean photo — fitted
                    with object-fit (cover) + the customer's crop/zoom transform,
                    never distorted, never pre-framed. fitContainer scales the frame
                    to fit for every size (incl. 24×36). */}
                <div style={{flex:1,minHeight:0,width:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <FramedArt
                    size={selectedSize}
                    orientation={selectedOrientation}
                    colour={selectedColour}
                    fitContainer
                    fit="cover"
                    src={photo || undefined}
                    transform={photo ? photoTransform : null}
                    background="linear-gradient(160deg,#F5EEE0,#EBE2D0)"
                    alt="Your photo"
                    placeholder={
                      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'.7rem',color:'#B8A080'}}>
                        <svg viewBox="0 0 48 48" style={{width:'38px',height:'38px',opacity:.35,stroke:'#B8A080',fill:'none',strokeWidth:1.5}}><rect x="4" y="4" width="40" height="40" rx="4"/><circle cx="16" cy="16" r="5"/><path d="M4 33l12-13 8 8 6-6 14 14"/></svg>
                        <span style={{fontSize:'.62rem',letterSpacing:'.16em',textTransform:'uppercase',opacity:.5}}>Your Photo Here</span>
                      </div>
                    }
                  />
                </div>
                <div style={{display:'flex',gap:'.5rem',alignItems:'center',flexWrap:'wrap',justifyContent:'center'}}>
                  {photo && (
                    <button type="button" onClick={()=>setEditingPhoto(true)}
                      style={{display:'inline-flex',alignItems:'center',gap:'.35rem',background:'rgba(255,255,255,.9)',border:'1.5px solid var(--cream)',color:'var(--text)',fontSize:'.72rem',fontWeight:700,padding:'.4rem .9rem',borderRadius:'var(--pill)',cursor:'pointer',boxShadow:'0 2px 8px rgba(0,0,0,.08)'}}>
                      <svg viewBox="0 0 24 24" style={{width:'13px',height:'13px',stroke:'currentColor',fill:'none',strokeWidth:2}}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                      Crop · Zoom · Reposition
                    </button>
                  )}
                  <div style={{background:'rgba(26,18,8,.6)',color:'#fff',fontSize:'.68rem',letterSpacing:'.08em',padding:'.35rem 1.1rem',borderRadius:'var(--pill)',backdropFilter:'blur(10px)',textAlign:'center'}}>{sizeLabel}</div>
                </div>
              </div>
              <div style={{background:'#fff',padding:'.9rem 1.4rem',borderRadius:'0 0 1rem 1rem',borderTop:'1px solid rgba(0,0,0,.06)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:'.75rem',fontWeight:600,color:'var(--muted)',marginBottom:'.18rem'}}>Custom Print · PS Moulding</div>
                  <div style={{fontSize:'.7rem',color:'#22873A',fontWeight:600}}>Free Delivery Across India</div>
                </div>
                <span style={{fontFamily:'var(--fd)',fontWeight:700,fontSize:'1.05rem'}}>₹{(frameOption?.price ?? MIN_FRAME_PRICE).toLocaleString('en-IN')}</span>
              </div>
            </div>
            {editingPhoto && photo && (
              <PhotoEditModal
                photo={photo}
                slotLabel="Your Photo"
                initial={photoTransform}
                onConfirm={(t)=>setPhotoTransform(t)}
                onClose={()=>setEditingPhoto(false)}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ── Template Wizard ──────────────────────────────────────────────────────── */
const STEPS = ['Photos','Personalise','Frame','Add to Cart'];

function TemplateWizard({ template }) {
  useScrollReveal();
  const { addToCartWithFrame } = useCart();
  const { toast }              = useToast();

  const STORAGE_KEY = `jhayra_wizard_${template.id}`;

  const [step, setStep]   = useState(0);
  const [photos, setPhotos] = useState({});
  const [texts, setTexts]   = useState(
    Object.fromEntries((template.textFields||[]).map(f=>[f.id, f.defaultValue||'']))
  );
  const [selectedSize,        setSelectedSize]        = useState(FRAME_SIZES[0]);
  const [selectedColour,      setSelectedColour]      = useState(coloursForSize(FRAME_SIZES[0])[0]);
  const [selectedOrientation, setSelectedOrientation] = useState('Vertical');
  const [textScale,      setTextScale]      = useState(1);
  const [textFont,       setTextFont]       = useState('serif-italic');
  const [accentOverride, setAccentOverride] = useState(null);
  const [calMonth,       setCalMonth]       = useState(template.calendar?.month || new Date().getMonth() + 1);
  const [calYear,        setCalYear]        = useState(template.calendar?.year  || new Date().getFullYear());
  const [calHighlight,   setCalHighlight]   = useState(template.calendar?.highlightDate ?? null);

  // New state for photo editing
  const [photoTransforms, setPhotoTransforms] = useState({}); // {slotId: {zoom, panX, panY}}
  const [photoQuality,    setPhotoQuality]    = useState({}); // {slotId: 'excellent'|'good'|'low'}
  const [photoMetas,      setPhotoMetas]      = useState({}); // {slotId: {name,width,height,size,type}} of ORIGINAL upload
  const [editingSlot,     setEditingSlot]     = useState(null);
  const [adding,          setAdding]          = useState(false);

  // sessionStorage restore on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
      if (saved) {
        if (saved.texts) {
          setTexts(prev => {
            const merged = {...prev};
            Object.keys(saved.texts).forEach(k => { if (k in merged) merged[k] = saved.texts[k]; });
            return merged;
          });
        }
        if (saved.selectedSize && FRAME_SIZES.includes(saved.selectedSize)) {
          setSelectedSize(saved.selectedSize);
          const cols = coloursForSize(saved.selectedSize);
          if (saved.selectedColour && cols.includes(saved.selectedColour)) {
            setSelectedColour(saved.selectedColour);
          }
        }
        if (saved.selectedOrientation) setSelectedOrientation(saved.selectedOrientation);
        if (saved.textScale) setTextScale(saved.textScale);
        if (saved.textFont) setTextFont(saved.textFont);
        if (saved.accentOverride !== undefined) setAccentOverride(saved.accentOverride);
        if (saved.calMonth) setCalMonth(saved.calMonth);
        if (saved.calYear) setCalYear(saved.calYear);
        if (saved.calHighlight !== undefined) setCalHighlight(saved.calHighlight);
        if (saved.step !== undefined && saved.step < 3) setStep(saved.step);
      }
    } catch (e) {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sessionStorage save on change
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        step: Math.min(step, 2),
        texts, selectedSize, selectedColour, selectedOrientation,
        textScale, textFont, accentOverride,
        calMonth, calYear, calHighlight,
      }));
    } catch (e) {}
  }, [step, texts, selectedSize, selectedColour, selectedOrientation, textScale, textFont, accentOverride, calMonth, calYear, calHighlight, STORAGE_KEY]);

  const availableColours    = coloursForSize(selectedSize);
  const selectedFrameOption = getFrameOption(selectedSize, selectedColour);

  const isPortrait  = selectedOrientation === 'Vertical';
  const { frameH, frameW, actualSize } = frameGeometry(selectedSize, selectedOrientation);

  const handleSizeChange = (size) => {
    setSelectedSize(size);
    const cols = coloursForSize(size);
    if (!cols.includes(selectedColour)) setSelectedColour(cols[0]);
  };

  // Enhanced photo upload with quality check and orientation suggestion
  const handlePhotoUpload = (slotId, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target.result;
      const img = new Image();
      img.onload = () => {
        const px = img.naturalWidth * img.naturalHeight;
        const quality = px < 500000 ? 'low' : px < 2000000 ? 'good' : 'excellent';
        const isLandscape = img.naturalWidth > img.naturalHeight * 1.2;

        setPhotos(p => ({...p, [slotId]: dataUrl}));
        setPhotoQuality(q => ({...q, [slotId]: quality}));
        setPhotoTransforms(t => ({...t, [slotId]: {zoom:1, panX:0, panY:0}}));
        setPhotoMetas(m => ({...m, [slotId]: { name: file.name || null, size: file.size || null, type: file.type || null, width: img.naturalWidth, height: img.naturalHeight }}));

        if (quality === 'low') {
          toast('Low resolution photo — it may appear blurry when printed.');
        }
        if (isLandscape && selectedOrientation === 'Vertical') {
          toast('Tip: this photo looks great in Horizontal orientation.');
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Handle multiple file selection: fill slots in order starting from the given slot
  const handleMultiUpload = (startSlotId, files) => {
    const startIdx = (template.slots||[]).findIndex(s => s.id === startSlotId);
    files.forEach((file, i) => {
      const targetSlot = (template.slots||[])[startIdx + i];
      if (targetSlot) handlePhotoUpload(targetSlot.id, file);
    });
  };

  const removePhoto = (slotId) => {
    setPhotos(p => { const n={...p}; delete n[slotId]; return n; });
    setPhotoMetas(m => { const n={...m}; delete n[slotId]; return n; });
  };
  const requiredFilled = (template.slots||[]).filter(s=>s.required).every(s=>photos[s.id]);

  // Better cart integration with personalization summary
  const handleAddToCart = async () => {
    if (!selectedFrameOption || adding) return;
    const personalizationSummary = [];
    if (texts.name1 && texts.name2) personalizationSummary.push(`${texts.name1} & ${texts.name2}`);
    else if (texts.name) personalizationSummary.push(texts.name);
    if (texts.date) personalizationSummary.push(texts.date);
    const cartName = [template.title, personalizationSummary.join(' • ')].filter(Boolean).join(' — ');

    setAdding(true);
    try {
      // Collect uploaded photos in slot order (with their original-file metadata),
      // then persist the ORIGINALS to private storage.
      const orderedSlots = (template.slots || []).filter(s => photos[s.id]);
      const uploadItems = orderedSlots.map(s => ({
        dataUrl: photos[s.id],
        name:   photoMetas[s.id]?.name,
        width:  photoMetas[s.id]?.width,
        height: photoMetas[s.id]?.height,
      }));
      const up = await uploadCustomerArtwork(uploadItems);
      // Failed-upload protection: never create an order that references a missing image.
      if (up.supabaseEnabled && up.uploaded < up.requested) {
        toast('Some photos failed to upload — please retry before adding to cart.');
        return;
      }
      addToCartWithFrame('custom', selectedFrameOption, cartName, 1, isPortrait ? 'Vertical' : 'Horizontal', selectedFrameOption.price, {
        artworkPaths: up.paths,
        customization: {
          source: 'template',
          templateId: template.id,
          templateTitle: template.title,
          texts,
          orientation: isPortrait ? 'Vertical' : 'Horizontal',
          transforms: photoTransforms,
          artworkMeta: up.meta,
        },
      });
      toast(`${template.title} added to cart ✓`);
    } finally {
      setAdding(false);
    }
  };

  // Quality chip text/emoji
  const qualityLabel = (q) => {
    if (q === 'excellent') return '🟢 Excellent';
    if (q === 'good')      return '🟡 Good';
    if (q === 'low')       return '⚠ Low Quality - may appear blurry';
    return null;
  };

  return (
    <div data-page="customize">
      {/* Page hero */}
      <div className="page-hero" style={{padding:'2.5rem 0'}}>
        <div className="container">
          <Link to="/customize" style={{fontSize:'.85rem',color:'#D4A85A',textDecoration:'none',marginBottom:'.75rem',display:'inline-block'}}>← All Templates</Link>
          <p className="eyebrow">{template.group.charAt(0).toUpperCase()+template.group.slice(1)}</p>
          <h1 style={{fontSize:'clamp(1.5rem,3.5vw,2.4rem)'}}>{template.title}</h1>
          <p style={{color:'rgba(255,255,255,.72)',fontSize:'.9rem'}}>{template.description}</p>
        </div>
      </div>

      {/* Photo editor modal */}
      {editingSlot && photos[editingSlot] && (
        <PhotoEditModal
          photo={photos[editingSlot]}
          slotId={editingSlot}
          slotLabel={(template.slots||[]).find(s=>s.id===editingSlot)?.label || 'Photo'}
          initial={photoTransforms[editingSlot] || {zoom:1, panX:0, panY:0}}
          onConfirm={transform => setPhotoTransforms(prev => ({...prev, [editingSlot]: transform}))}
          onClose={() => setEditingSlot(null)}
        />
      )}

      <div className="container" style={{paddingTop:'2rem',paddingBottom:'4rem'}}>
        {/* Step bar */}
        <div className="wizard-steps" style={{marginBottom:'2rem'}}>
          {STEPS.map((s,i) => (
            <div key={s} className={`wizard-step${step===i?' active':''}${step>i?' done':''}`}>
              <button
                className="wizard-step-btn"
                onClick={()=>{ if(i<=step||(i===1&&requiredFilled)) setStep(i); }}
                disabled={i>step&&!(i===1&&requiredFilled)}
              >
                <span className="num">{step>i?'✓':i+1}</span>
                {s}
              </button>
              {i < STEPS.length-1 && <div className="wizard-step-sep"/>}
            </div>
          ))}
        </div>

        {/* Two-column: controls left, large preview right */}
        <div className="wizard-layout">

          {/* ── LEFT: step controls ── */}
          <div className="wizard-controls">

            {/* STEP 0 — Photos */}
            {step===0 && (
              <div>
                <h2 className="display-3" style={{marginBottom:'.5rem'}}>Upload Your Photos</h2>
                <p style={{color:'#7A6E60',fontSize:'.88rem',marginBottom:'1.4rem'}}>
                  {template.photoSlots===0
                    ? 'This design uses typography only — no photos needed!'
                    : `Upload ${template.photoSlots} photo${template.photoSlots>1?'s':''}. Slots marked * are required.`}
                </p>
                {template.photoSlots>0 && (
                  <div className="photo-upload-grid">
                    {(template.slots||[]).map(slot => {
                      const filled = !!photos[slot.id];
                      const quality = photoQuality[slot.id];
                      return (
                        <div key={slot.id}>
                          {filled ? (
                            <div
                              className="photo-slot filled"
                              style={{cursor:'pointer'}}
                              onClick={() => setEditingSlot(slot.id)}
                            >
                              <img src={photos[slot.id]} alt={slot.label} className="slot-img"/>
                              <button
                                className="photo-slot-remove"
                                onClick={e=>{e.preventDefault();e.stopPropagation();removePhoto(slot.id);}}
                              >✕</button>
                              <button
                                className="photo-slot-edit"
                                onClick={e=>{e.preventDefault();e.stopPropagation();setEditingSlot(slot.id);}}
                              >✎</button>
                            </div>
                          ) : (
                            <label className="photo-slot">
                              <input
                                type="file" accept="image/*"
                                multiple={template.photoSlots > 1}
                                style={{display:'none'}}
                                onChange={e => {
                                  const files = Array.from(e.target.files);
                                  if (files.length <= 1) {
                                    handlePhotoUpload(slot.id, files[0]);
                                  } else {
                                    handleMultiUpload(slot.id, files);
                                  }
                                  e.target.value = '';
                                }}
                              />
                              <div className="slot-icon">+</div>
                              <div className="slot-label">{slot.label}{slot.required?' *':''}</div>
                            </label>
                          )}
                          {quality && (
                            <div className={`quality-chip ${quality}`}>{qualityLabel(quality)}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <button className="btn btn-gold" style={{marginTop:'1.5rem',width:'100%'}}
                  onClick={()=>setStep(1)}
                  disabled={template.photoSlots>0&&!requiredFilled}>
                  {template.photoSlots>0&&!requiredFilled ? 'Upload required photos to continue' : 'Continue →'}
                </button>
              </div>
            )}

            {/* STEP 1 — Personalise */}
            {step===1 && (
              <div>
                <h2 className="display-3" style={{marginBottom:'.5rem'}}>Personalise Your Design</h2>
                <p style={{color:'#7A6E60',fontSize:'.88rem',marginBottom:'1.4rem'}}>
                  {template.textFields?.length ? 'Edit the text — the preview updates live.' : 'No text needed for this design.'}
                </p>
                {(template.textFields||[]).map(field => (
                  <div key={field.id} style={{marginBottom:'1rem'}}>
                    <label style={{display:'block',fontSize:'.78rem',fontWeight:600,color:'#5A4A3A',marginBottom:'.3rem'}}>
                      {field.label}{field.required?' *':''}
                    </label>
                    <input type="text" maxLength={field.maxChars}
                      placeholder={field.defaultValue}
                      value={texts[field.id]||''}
                      onChange={e=>setTexts(t=>({...t,[field.id]:e.target.value}))}
                      style={{width:'100%',padding:'.55rem .75rem',borderRadius:'8px',border:'1.5px solid #DDD5C8',fontFamily:'inherit',fontSize:'.9rem',boxSizing:'border-box',outline:'none',transition:'border-color .2s'}}
                      onFocus={e=>e.target.style.borderColor='#B68D40'}
                      onBlur={e=>e.target.style.borderColor='#DDD5C8'}
                    />
                    <div style={{fontSize:'.7rem',color:'#9A8A6A',marginTop:'.15rem',textAlign:'right'}}>
                      {(texts[field.id]||'').length}/{field.maxChars}
                    </div>
                  </div>
                ))}
                {/* Calendar customization — only when template has a calendar */}
                {template.hasCalendar && (
                  <div style={{padding:'.9rem',background:'#F8F4EE',borderRadius:'10px',marginTop:'.75rem'}}>
                    <div style={{fontSize:'.78rem',fontWeight:600,color:'#5A4A3A',marginBottom:'.7rem'}}>📅 Calendar Settings</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.6rem',marginBottom:'.6rem'}}>
                      <div>
                        <label style={{fontSize:'.72rem',color:'#7A6E60',display:'block',marginBottom:'.25rem'}}>Month</label>
                        <select value={calMonth} onChange={e=>setCalMonth(+e.target.value)}
                          style={{width:'100%',padding:'.38rem .5rem',borderRadius:'6px',border:'1.5px solid #DDD5C8',fontSize:'.82rem',fontFamily:'inherit',background:'#fff'}}>
                          {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i)=>(
                            <option key={i} value={i+1}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{fontSize:'.72rem',color:'#7A6E60',display:'block',marginBottom:'.25rem'}}>Year</label>
                        <select value={calYear} onChange={e=>setCalYear(+e.target.value)}
                          style={{width:'100%',padding:'.38rem .5rem',borderRadius:'6px',border:'1.5px solid #DDD5C8',fontSize:'.82rem',fontFamily:'inherit',background:'#fff'}}>
                          {Array.from({length:4},(_,i)=>new Date().getFullYear()+i).map(y=><option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{fontSize:'.72rem',color:'#7A6E60',display:'block',marginBottom:'.25rem'}}>Highlight Date <span style={{fontWeight:400,opacity:.7}}>(optional — your special day)</span></label>
                      <input type="number" min={1} max={31} value={calHighlight ?? ''}
                        onChange={e=>setCalHighlight(e.target.value ? +e.target.value : null)}
                        placeholder="e.g. 14"
                        style={{width:'100%',padding:'.38rem .5rem',borderRadius:'6px',border:'1.5px solid #DDD5C8',fontSize:'.82rem',fontFamily:'inherit',background:'#fff',boxSizing:'border-box'}}
                      />
                    </div>
                  </div>
                )}

                {/* Text styling panel */}
                <div style={{marginTop:'1.25rem',paddingTop:'1rem',borderTop:'1px solid #EAE4D8'}}>
                  <div style={{fontSize:'.78rem',fontWeight:600,color:'#5A4A3A',marginBottom:'.7rem'}}>✏️ Text Style</div>

                  {/* Text size */}
                  <div style={{marginBottom:'.65rem'}}>
                    <div style={{fontSize:'.72rem',color:'#7A6E60',marginBottom:'.3rem'}}>Text Size</div>
                    <div style={{display:'flex',gap:'.35rem'}}>
                      {[{v:0.8,l:'Small'},{v:1,l:'Medium'},{v:1.25,l:'Large'}].map(({v,l})=>(
                        <button key={v} onClick={()=>setTextScale(v)}
                          style={{flex:1,padding:'.32rem .2rem',borderRadius:'6px',cursor:'pointer',
                            border:`1.5px solid ${textScale===v?'var(--gold)':'#DDD5C8'}`,
                            background:textScale===v?'rgba(182,141,64,.08)':'#fff',
                            fontSize:'.77rem',fontWeight:textScale===v?600:400,
                            color:textScale===v?'var(--gold)':'#5A4A3A'}}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font style */}
                  <div style={{marginBottom:'.65rem'}}>
                    <div style={{fontSize:'.72rem',color:'#7A6E60',marginBottom:'.3rem'}}>Font Style</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.35rem'}}>
                      {[
                        {v:'serif-italic', l:'Italic Serif',  ff:'Georgia,serif',              fi:'italic', fw:'normal'},
                        {v:'serif-bold',   l:'Bold Serif',    ff:'Georgia,serif',              fi:'normal', fw:'bold'},
                        {v:'sans',         l:'Sans-serif',    ff:'Arial,Helvetica,sans-serif', fi:'normal', fw:'normal'},
                        {v:'classic',      l:'Classic',       ff:"'Times New Roman',serif",    fi:'italic', fw:'bold'},
                      ].map(({v,l,ff,fi,fw})=>(
                        <button key={v} onClick={()=>setTextFont(v)}
                          style={{padding:'.35rem .45rem',borderRadius:'6px',cursor:'pointer',
                            border:`1.5px solid ${textFont===v?'var(--gold)':'#DDD5C8'}`,
                            background:textFont===v?'rgba(182,141,64,.08)':'#fff',
                            textAlign:'left',display:'flex',alignItems:'center',gap:'.35rem'}}>
                          <span style={{fontFamily:ff,fontStyle:fi,fontWeight:fw,fontSize:'1rem',color:textFont===v?'var(--gold)':'#5A4A3A',lineHeight:1}}>Ag</span>
                          <span style={{fontSize:'.7rem',color:textFont===v?'var(--gold)':'#5A4A3A',fontWeight:textFont===v?600:400}}>{l}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accent colour */}
                  <div>
                    <div style={{fontSize:'.72rem',color:'#7A6E60',marginBottom:'.3rem'}}>Accent Colour</div>
                    <div style={{display:'flex',gap:'.35rem',flexWrap:'wrap',alignItems:'center'}}>
                      {[
                        {label:'Gold (Default)', value:null,      hex:'#B68D40'},
                        {label:'Black',          value:'#2A2A2A', hex:'#2A2A2A'},
                        {label:'Crimson',        value:'#9B1C2E', hex:'#9B1C2E'},
                        {label:'Navy',           value:'#1A3A6A', hex:'#1A3A6A'},
                        {label:'Forest Green',   value:'#2A5C3A', hex:'#2A5C3A'},
                        {label:'Rose',           value:'#B05070', hex:'#B05070'},
                      ].map(({label,value,hex})=>{
                        const isActive = accentOverride === value;
                        return (
                          <button key={label} onClick={()=>setAccentOverride(value)} title={label}
                            style={{width:'26px',height:'26px',borderRadius:'50%',background:hex,
                              border:`2.5px solid ${isActive?'#fff':'transparent'}`,
                              outline:isActive?`2.5px solid ${hex}`:'none',outlineOffset:'2px',
                              cursor:'pointer',padding:0,flexShrink:0}}>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{display:'flex',gap:'1rem',marginTop:'1.5rem'}}>
                  <button className="btn btn-outline" onClick={()=>setStep(0)}>← Back</button>
                  <button className="btn btn-gold" style={{flex:1}} onClick={()=>setStep(2)}>Continue →</button>
                </div>
              </div>
            )}

            {/* STEP 2 — Frame */}
            {step===2 && (
              <div>
                <h2 className="display-3" style={{marginBottom:'.5rem'}}>Choose Your Frame</h2>
                <p style={{color:'#7A6E60',fontSize:'.88rem',marginBottom:'1.4rem'}}>All frames are premium PS Moulding. Select size and colour — the preview updates instantly.</p>
                <div style={{marginBottom:'1.1rem'}}>
                  <div className="cz-step">Frame Size</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'.5rem',marginTop:'.5rem'}}>
                    {FRAME_SIZES.map(s => {
                      const fo = getFrameOption(s, coloursForSize(s)[0]);
                      return (
                        <div key={s}
                          className={`mini-card${selectedSize===s?' active':''}`}
                          onClick={()=>handleSizeChange(s)}
                          style={{cursor:'pointer',textAlign:'left',padding:'.5rem .7rem'}}>
                          <div style={{fontWeight:700}}>{s}</div>
                          <div style={{fontSize:'.68rem',opacity:.75,marginTop:'.1rem'}}>{fo?.dimensions}</div>
                          <div style={{fontSize:'.72rem',fontWeight:600,color:selectedSize===s?'rgba(255,255,255,.85)':'var(--gold)',marginTop:'.2rem'}}>₹{fo?.price?.toLocaleString('en-IN')}{coloursForSize(s).length > 1 ? '+' : ''}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{marginBottom:'1.1rem'}}>
                  <div className="cz-step">Orientation</div>
                  <div style={{display:'flex',gap:'.5rem',marginTop:'.5rem',flexWrap:'wrap'}}>
                    {[{key:'Vertical',icon:'▯',label:'Vertical'},{key:'Horizontal',icon:'▭',label:'Horizontal'}].map(({key,icon,label})=>(
                      <div key={key} className={`mini-card${selectedOrientation===key?' active':''}`}
                        onClick={()=>setSelectedOrientation(key)}
                        style={{cursor:'pointer',display:'flex',alignItems:'center',gap:'.3rem'}}>
                        <span style={{fontSize:'1rem'}}>{icon}</span>{label}
                      </div>
                    ))}
                  </div>
                  <p style={{fontSize:'.72rem',color:'#9A8A6A',marginTop:'.35rem',marginBottom:0}}>{actualSize}</p>
                </div>
                <div style={{marginBottom:'1.1rem'}}>
                  <div className="cz-step">Frame Colour</div>
                  <div className="grid3" style={{marginTop:'.5rem'}}>
                    {availableColours.map(c=>(
                      <div key={c} className={`mini-card${selectedColour===c?' active':''}`}
                        onClick={()=>setSelectedColour(c)} style={{cursor:'pointer'}}>{c}</div>
                    ))}
                  </div>
                  {availableColours.length===1 && (
                    <p style={{fontSize:'.72rem',color:'#9A8A6A',marginTop:'.35rem'}}>{selectedSize} is available in Black only.</p>
                  )}
                </div>
                {selectedFrameOption && (
                  <div style={{background:'#F8F4EE',borderRadius:'10px',padding:'.85rem 1rem',marginBottom:'1.1rem',fontSize:'.82rem',color:'#5A4A3A'}}>
                    <strong>{selectedSize}</strong> · {selectedFrameOption.dimensions} · {selectedColour} PS Moulding
                    <span style={{fontFamily:'var(--fd)',fontWeight:700,color:'#B68D40',marginLeft:'auto',float:'right'}}>₹{selectedFrameOption.price.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div style={{display:'flex',gap:'1rem',marginTop:'1.5rem'}}>
                  <button className="btn btn-outline" onClick={()=>setStep(1)}>← Back</button>
                  <button className="btn btn-gold" style={{flex:1}} onClick={()=>setStep(3)}>Review & Add to Cart →</button>
                </div>
              </div>
            )}

            {/* STEP 3 — Review & Cart */}
            {step===3 && (
              <div>
                <h2 className="display-3" style={{marginBottom:'.5rem'}}>Ready to Order?</h2>
                <p style={{color:'#7A6E60',fontSize:'.88rem',marginBottom:'1.4rem'}}>Our team will confirm the final artwork with you on WhatsApp before printing begins.</p>
                <div style={{background:'#F8F4EE',borderRadius:'12px',padding:'1.1rem',marginBottom:'1.2rem'}}>
                  {[
                    ['Design', template.title],
                    ['Frame Size', selectedFrameOption ? `${selectedSize} (${selectedFrameOption.dimensions})` : selectedSize],
                    ['Orientation', isPortrait ? 'Vertical / Portrait' : 'Horizontal / Landscape'],
                    ['Colour', `${selectedColour} PS Moulding`],
                    ['Text Style', `${{ 'serif-italic':'Italic Serif','serif-bold':'Bold Serif','sans':'Sans-serif','classic':'Classic' }[textFont]} · ${{ 0.8:'Small',1:'Medium',1.25:'Large' }[textScale]} size`],
                    template.hasCalendar ? ['Calendar', `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][calMonth-1]} ${calYear}${calHighlight ? `, ${calHighlight}th highlighted` : ''}`] : null,
                    ['Photos', `${Object.keys(photos).length} of ${template.photoSlots} uploaded`],
                  ].filter(Boolean).map(([k,v]) => (
                    <div key={k} style={{display:'flex',justifyContent:'space-between',marginBottom:'.5rem',fontSize:'.84rem'}}>
                      <span style={{color:'#5A4A3A',fontWeight:600}}>{k}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                  <div style={{borderTop:'1px solid #EAE4D8',marginTop:'.5rem',paddingTop:'.5rem',display:'flex',justifyContent:'space-between'}}>
                    <span style={{fontWeight:700,color:'#0F0D0A'}}>Starting Price</span>
                    <span style={{fontWeight:700,fontFamily:'var(--fd)',fontSize:'1.05rem',color:'#B68D40'}}>
                      ₹{(selectedFrameOption?.price ?? MIN_FRAME_PRICE).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <div style={{background:'#EEF5E8',borderRadius:'10px',padding:'.9rem',marginBottom:'1rem',fontSize:'.8rem',color:'#3A6020'}}>
                  After placing your order, we'll contact you on WhatsApp to review the artwork before printing.
                </div>
                <div style={{display:'flex',gap:'1rem'}}>
                  <button className="btn btn-outline" onClick={()=>setStep(2)}>← Back</button>
                  <button className="btn btn-gold btn-lg" style={{flex:1,opacity:adding?0.7:1}} disabled={adding} onClick={handleAddToCart}>
                    {adding ? 'Adding…' : `Add to Cart · ₹${(selectedFrameOption?.price ?? MIN_FRAME_PRICE).toLocaleString('en-IN')}`}
                  </button>
                </div>
                <div style={{textAlign:'center',marginTop:'.9rem'}}>
                  <a href={`https://wa.me/917070728989?text=${encodeURIComponent(`Hi! I'd like to order the ${template.title} template (${selectedSize}, ${isPortrait?'Vertical':'Horizontal'}, ${actualSize}, ${selectedColour} PS Moulding, ${{ 'serif-italic':'Italic Serif','serif-bold':'Bold Serif','sans':'Sans-serif','classic':'Classic' }[textFont]} text).`)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{fontSize:'.8rem',color:'#3A7A20',textDecoration:'underline'}}>
                    Or enquire directly on WhatsApp →
                  </a>
                </div>
              </div>
            )}
          </div>{/* end wizard-controls */}

          {/* ── RIGHT: large live preview ── */}
          <div className="wizard-preview-col">
            <div className="wizard-preview-sticky">

              {/* Wall + frame presentation */}
              <div style={{
                background:'var(--bg)',
                borderRadius:'14px',
                padding:'20px 20px 14px',
                boxShadow:'0 4px 24px rgba(0,0,0,.07)',
                display:'flex',
                flexDirection:'column',
                alignItems:'center',
                transition:'all .45s ease',
              }}>
                {/* Physical JHAYRA frame — proportional per size + orientation,
                    rendered by the website around the clean template composition. */}
                <FramedArt
                  size={selectedSize}
                  orientation={selectedOrientation}
                  colour={selectedColour}
                  style={{ height:`${frameH}px`, width:`${frameW}px`, maxWidth:'100%' }}
                >
                  <TemplateRenderer
                    template={template} photos={photos} texts={texts}
                    fill={!isPortrait} framed={true}
                    textScale={textScale} textFont={textFont} accentOverride={accentOverride}
                    calendarOverride={template.hasCalendar ? {month:calMonth,year:calYear,highlightDate:calHighlight,visible:true} : null}
                    photoTransforms={photoTransforms}
                  />
                </FramedArt>

                {/* Label below frame */}
                <div style={{
                  marginTop:'10px',
                  textAlign:'center',
                  fontSize:'.68rem',
                  letterSpacing:'.1em',
                  color:'#8A7A60',
                  background:'rgba(26,18,8,.05)',
                  borderRadius:'var(--pill)',
                  padding:'.28rem .9rem',
                  display:'inline-block',
                }}>
                  {selectedSize} · {isPortrait ? 'Vertical' : 'Horizontal'} · {actualSize} · {selectedColour} · PS Moulding
                </div>
              </div>

              {/* Product metadata below the wall panel */}
              <div style={{
                marginTop:'12px',
                display:'flex',
                justifyContent:'space-between',
                alignItems:'center',
                padding:'0 4px',
              }}>
                <div>
                  <p style={{fontFamily:'var(--fd)',fontSize:'.95rem',fontWeight:700,color:'#0F0D0A',margin:0}}>{template.title}</p>
                  <p style={{fontSize:'.75rem',color:'#9A8A6A',margin:'.15rem 0 0'}}>
                    {Object.keys(photos).length}/{template.photoSlots} photos · {template.group}
                  </p>
                </div>
                <p style={{fontFamily:'var(--fd)',fontSize:'1.1rem',fontWeight:700,color:'#B68D40',margin:0}}>
                  ₹{(selectedFrameOption?.price ?? MIN_FRAME_PRICE).toLocaleString('en-IN')}
                </p>
              </div>

              {/* Live update indicator */}
              <p style={{fontSize:'.7rem',color:'#B68D40',textAlign:'center',marginTop:'8px',opacity:.7}}>
                ↺ Preview updates as you upload photos and edit text
              </p>
            </div>
          </div>

        </div>{/* end wizard-layout */}
      </div>
    </div>
  );
}

/* ── Router ───────────────────────────────────────────────────────────────── */
export default function Customize() {
  const { templateId } = useParams();

  if (!templateId) return <TemplateGallery />;
  if (templateId === 'scratch') return <ScratchBuilder />;

  const template = getTemplateById(templateId);
  if (!template) {
    return (
      <div data-page="customize">
        <SEO noindex title="Template Not Found | JHAYRA" path={`/customize/${templateId}`} />
        <div className="container" style={{padding:'4rem 0',textAlign:'center'}}>
          <p style={{fontSize:'2rem',marginBottom:'1rem'}}>🖼️</p>
          <h2>Template not found</h2>
          <Link to="/customize" className="btn btn-gold" style={{marginTop:'1rem',display:'inline-block'}}>Browse All Templates</Link>
        </div>
      </div>
    );
  }

  const occasions = (template.occasion || []).join(', ');
  const templateDesc = `${template.description || template.subtitle || ''} ${occasions ? `Perfect for ${occasions}.` : ''} Starting ₹${template.startingPrice || 499}. Free delivery across India.`.trim();

  return (
    <>
      <SEO
        title={`${template.title} — Personalized Frame | JHAYRA`}
        description={templateDesc}
        path={`/customize/${template.id}`}
      />
      <TemplateWizard template={template} />
    </>
  );
}
