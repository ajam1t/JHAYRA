import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useScrollReveal } from '../components/ScrollReveal';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { TEMPLATES, TEMPLATE_GROUPS, filterTemplates, getTemplateById } from '../data/templates';
import TemplateCard from '../components/TemplateCard';

/* ── Template Gallery ─────────────────────────────────────────────────────── */
function TemplateGallery() {
  useScrollReveal();
  const [group,       setGroup]       = useState('all');
  const [photoCount,  setPhotoCount]  = useState('all');
  const [onlyPopular, setOnlyPopular] = useState(false);

  const filtered = filterTemplates({ group, photoSlots: photoCount, onlyPopular });

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
        <div style={{display:'flex',gap:'2rem',alignItems:'flex-start'}}>

          {/* Sidebar */}
          <aside style={{width:'200px',flexShrink:0,position:'sticky',top:'calc(var(--nav) + 1rem)'}}>
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
                  >Popular & Best Sellers</button>
                </div>
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div style={{flex:1,minWidth:0}}>
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
                <button className="btn btn-outline" style={{marginTop:'1rem'}} onClick={()=>{setGroup('all');setPhotoCount('all');setOnlyPopular(false);}}>
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Basic custom frame option */}
        <div style={{marginTop:'3.5rem',padding:'2rem',background:'#F8F4EE',borderRadius:'16px',textAlign:'center',border:'1px solid #EAE4D8'}}>
          <p className="eyebrow" style={{marginBottom:'.5rem'}}>Just want a simple custom print?</p>
          <p style={{color:'#7A6E60',fontSize:'.9rem',marginBottom:'1.2rem'}}>Upload any photo and choose your frame size, material, and colour.</p>
          <Link to="/customize/scratch" className="btn btn-gold">Build From Scratch</Link>
        </div>
      </div>
    </div>
  );
}

/* ── Scratch Builder (old basic customizer) ───────────────────────────────── */
function ScratchBuilder() {
  useScrollReveal();
  const { addToCart } = useCart();
  const { toast }     = useToast();
  const [size, setSize]           = useState('12×16"');
  const [material, setMaterial]   = useState('Canvas');
  const [frameColor, setFrameColor] = useState('Black');
  const [photo, setPhoto]         = useState(null);
  const czRoomRef = useRef(null);

  const cols  = {Black:'#1A1A1A', Brown:'#6B4423', White:'#E0D9CF', 'No Frame':'transparent'};
  const ratios = {'8×10"':'4/5', '12×16"':'3/4', '16×20"':'4/5'};
  const bw    = {Canvas:'8px', 'Photo Paper':'16px', Acrylic:'3px'};
  const borderColor = frameColor==='No Frame' ? 'transparent' : (cols[frameColor]||'#1A1A1A');
  const borderWidth = frameColor==='No Frame' ? '0px' : (bw[material]||'8px');
  const aspectRatio = ratios[size]||'3/4';
  const sizeLabel   = `${size} · ${frameColor==='No Frame'?'No Frame':frameColor+' Frame'} · ${material}`;
  const innerShadow = material==='Acrylic' ? 'inset 0 0 20px rgba(180,200,255,.12),inset 0 0 0 1px rgba(200,220,255,.25)' : '';

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
    reader.onload = ev => { setPhoto(ev.target.result); toast('Photo updated! ✓'); };
    reader.readAsDataURL(f);
  };

  const MiniCard = ({label, active, onClick}) => (
    <div className={`mini-card${active?' active':''}`} onClick={onClick} style={{cursor:'pointer'}}>{label}</div>
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
          <p className="s-reveal">Upload a photo, choose your frame size and style — we craft it by hand and deliver it to your doorstep.</p>
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
                <div className="cz-step">Step 2 · Choose Size</div>
                <div className="grid3">{['8×10"','12×16"','16×20"'].map(s=><MiniCard key={s} label={s} active={size===s} onClick={()=>setSize(s)}/>)}</div>
              </div>
              <div>
                <div className="cz-step">Step 3 · Choose Material</div>
                <div className="grid3">{['Canvas','Photo Paper','Acrylic'].map(m=><MiniCard key={m} label={m} active={material===m} onClick={()=>setMaterial(m)}/>)}</div>
              </div>
              <div>
                <div className="cz-step">Step 4 · Choose Frame</div>
                <div className="grid3">{['Black','Brown','White','No Frame'].map(c=><MiniCard key={c} label={c} active={frameColor===c} onClick={()=>setFrameColor(c)}/>)}</div>
              </div>
              <button className="btn btn-gold btn-lg" style={{width:'100%'}} onClick={()=>{addToCart('custom');toast('Custom frame added to cart ✓');}}>
                Add to Cart · ₹1,499
              </button>
            </div>
            <div className="cz-preview">
              <div ref={czRoomRef} style={{background:'linear-gradient(150deg,#F7F3EC,#EDE7D9)',aspectRatio:'4/5',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'2rem 1.5rem',borderRadius:'1rem 1rem 0 0',position:'relative',transition:'transform .15s cubic-bezier(.16,1,.3,1)',cursor:'crosshair'}}>
                <div style={{width:'70%',transition:'all .4s cubic-bezier(.16,1,.3,1)'}}>
                  <div style={{border:`${borderWidth} solid ${borderColor}`,borderRadius:'4px',boxShadow:'0 28px 70px rgba(0,0,0,.3),0 8px 24px rgba(0,0,0,.18)',transition:'border-color .35s,border-width .35s,aspect-ratio .4s',aspectRatio}}>
                    <div style={{width:'100%',height:'100%',background:'linear-gradient(160deg,#F5EEE0,#EBE2D0)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',boxShadow:innerShadow}}>
                      {photo ? (
                        <img src={photo} alt="Your photo" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      ) : (
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'.7rem',color:'#B8A080'}}>
                          <svg viewBox="0 0 48 48" style={{width:'38px',height:'38px',opacity:.35,stroke:'#B8A080',fill:'none',strokeWidth:1.5}}><rect x="4" y="4" width="40" height="40" rx="4"/><circle cx="16" cy="16" r="5"/><path d="M4 33l12-13 8 8 6-6 14 14"/></svg>
                          <span style={{fontSize:'.62rem',letterSpacing:'.16em',textTransform:'uppercase',opacity:.5}}>Your Photo Here</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{marginTop:'1.4rem',background:'rgba(26,18,8,.6)',color:'#fff',fontSize:'.68rem',letterSpacing:'.12em',padding:'.35rem 1.1rem',borderRadius:'var(--pill)',backdropFilter:'blur(10px)'}}>{sizeLabel}</div>
              </div>
              <div style={{background:'#fff',padding:'.9rem 1.4rem',borderRadius:'0 0 1rem 1rem',borderTop:'1px solid rgba(0,0,0,.06)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:'.75rem',fontWeight:600,color:'var(--muted)',marginBottom:'.18rem'}}>Custom Print</div>
                  <div style={{fontSize:'.7rem',color:'var(--muted)'}}>Museum-quality · Handcrafted</div>
                </div>
                <span style={{fontFamily:'var(--fd)',fontWeight:700,fontSize:'1.05rem'}}>₹1,499</span>
              </div>
            </div>
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
  const { addToCart } = useCart();
  const { toast }     = useToast();
  const [step, setStep]         = useState(0);
  const [photos, setPhotos]     = useState({});
  const [texts, setTexts]       = useState(
    Object.fromEntries((template.textFields||[]).map(f=>[f.id, f.defaultValue||'']))
  );
  const [size, setSize]         = useState(template.supportedSizes?.[0] || '12×16"');
  const [material, setMaterial] = useState('Canvas');
  const [frameColor, setFrameColor] = useState('Black');

  const handlePhotoUpload = (slotId, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhotos(p => ({...p, [slotId]: ev.target.result}));
    reader.readAsDataURL(file);
  };

  const removePhoto = (slotId) => setPhotos(p => { const n={...p}; delete n[slotId]; return n; });

  const requiredFilled = (template.slots||[]).filter(s=>s.required).every(s=>photos[s.id]);

  const handleAddToCart = () => {
    addToCart('custom');
    toast(`${template.title} added to cart ✓`);
  };

  return (
    <div data-page="customize">
      <div className="page-hero" style={{padding:'2.5rem 0'}}>
        <div className="container">
          <Link to="/customize" style={{fontSize:'.85rem',color:'#D4A85A',textDecoration:'none',marginBottom:'.75rem',display:'inline-block'}}>← All Templates</Link>
          <p className="eyebrow">{template.group.charAt(0).toUpperCase()+template.group.slice(1)}</p>
          <h1 style={{fontSize:'clamp(1.6rem,3.5vw,2.5rem)'}}>{template.title}</h1>
          <p style={{color:'rgba(255,255,255,.75)',fontSize:'.95rem'}}>{template.description}</p>
        </div>
      </div>

      <div className="container" style={{paddingTop:'2rem',paddingBottom:'4rem'}}>
        {/* Step bar */}
        <div className="wizard-steps">
          {STEPS.map((s,i) => (
            <div key={s} className={`wizard-step${step===i?' active':''}${step>i?' done':''}`}>
              <button
                className="wizard-step-btn"
                onClick={()=>{ if(i<=step||(i===1&&requiredFilled)||i<step) setStep(i); }}
                disabled={i>step&&!(i===1&&requiredFilled)}
              >
                <span className="num">{step>i?'✓':i+1}</span>
                {s}
              </button>
              {i < STEPS.length-1 && <div className="wizard-step-sep"/>}
            </div>
          ))}
        </div>

        {/* Step content + preview side by side */}
        <div style={{display:'flex',gap:'2.5rem',alignItems:'flex-start',flexWrap:'wrap'}}>
          <div style={{flex:'1 1 340px',minWidth:0}}>

            {/* STEP 0 — Photos */}
            {step===0 && (
              <div>
                <h2 className="display-3" style={{marginBottom:'.5rem'}}>Upload Your Photos</h2>
                <p style={{color:'#7A6E60',fontSize:'.9rem',marginBottom:'1.5rem'}}>
                  {template.photoSlots === 0
                    ? 'This design uses typography only — no photo needed!'
                    : `This design needs ${template.photoSlots} photo${template.photoSlots>1?'s':''}. Required slots are marked with *.`}
                </p>
                {template.photoSlots > 0 && (
                  <div className="photo-upload-grid">
                    {(template.slots||[]).map(slot => (
                      <label key={slot.id} className={`photo-slot${photos[slot.id]?' filled':''}`}>
                        <input
                          type="file"
                          accept="image/*"
                          style={{display:'none'}}
                          onChange={e=>handlePhotoUpload(slot.id, e.target.files[0])}
                        />
                        {photos[slot.id] && (
                          <>
                            <img src={photos[slot.id]} alt={slot.label} className="slot-img"/>
                            <button
                              className="photo-slot-remove"
                              onClick={e=>{e.preventDefault();e.stopPropagation();removePhoto(slot.id);}}
                              title="Remove photo"
                            >✕</button>
                          </>
                        )}
                        {!photos[slot.id] && (
                          <>
                            <div className="slot-icon">+</div>
                            <div className="slot-label">{slot.label}{slot.required?' *':''}</div>
                          </>
                        )}
                      </label>
                    ))}
                  </div>
                )}
                <button
                  className="btn btn-gold"
                  style={{marginTop:'1.5rem',width:'100%'}}
                  onClick={()=>setStep(1)}
                  disabled={template.photoSlots>0 && !requiredFilled}
                >
                  {template.photoSlots>0&&!requiredFilled ? 'Add required photos to continue' : 'Continue →'}
                </button>
              </div>
            )}

            {/* STEP 1 — Personalise */}
            {step===1 && (
              <div>
                <h2 className="display-3" style={{marginBottom:'.5rem'}}>Personalise Your Design</h2>
                <p style={{color:'#7A6E60',fontSize:'.9rem',marginBottom:'1.5rem'}}>
                  {template.textFields?.length ? 'Fill in the text fields below. You can leave optional fields blank.' : 'No text customisation needed for this design.'}
                </p>
                {(template.textFields||[]).map(field => (
                  <div key={field.id} style={{marginBottom:'1.1rem'}}>
                    <label style={{display:'block',fontSize:'.8rem',fontWeight:600,color:'#5A4A3A',marginBottom:'.35rem'}}>
                      {field.label}{field.required?' *':''}
                    </label>
                    <input
                      type="text"
                      maxLength={field.maxChars}
                      placeholder={field.defaultValue}
                      value={texts[field.id]||''}
                      onChange={e=>setTexts(t=>({...t,[field.id]:e.target.value}))}
                      style={{width:'100%',padding:'.6rem .8rem',borderRadius:'8px',border:'1.5px solid #DDD5C8',fontFamily:'inherit',fontSize:'.92rem',boxSizing:'border-box',outline:'none'}}
                      onFocus={e=>e.target.style.borderColor='#B68D40'}
                      onBlur={e=>e.target.style.borderColor='#DDD5C8'}
                    />
                    <div style={{fontSize:'.72rem',color:'#9A8A6A',marginTop:'.2rem',textAlign:'right'}}>
                      {(texts[field.id]||'').length}/{field.maxChars}
                    </div>
                  </div>
                ))}
                {template.hasCalendar && template.calendar && (
                  <div style={{padding:'1rem',background:'#F8F4EE',borderRadius:'10px',marginTop:'.5rem'}}>
                    <p style={{fontSize:'.85rem',fontWeight:600,color:'#5A4A3A',margin:0}}>📅 Calendar included</p>
                    <p style={{fontSize:'.8rem',color:'#7A6E60',marginTop:'.3rem',marginBottom:0}}>A calendar for {template.calendar.year} will be printed. Special dates will be highlighted.</p>
                  </div>
                )}
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
                <p style={{color:'#7A6E60',fontSize:'.9rem',marginBottom:'1.5rem'}}>Select the size, material, and frame finish for your print.</p>
                <div style={{marginBottom:'1.2rem'}}>
                  <div className="cz-step">Size</div>
                  <div className="grid3" style={{marginTop:'.5rem'}}>
                    {(template.supportedSizes||['8×10"','12×16"','16×20"']).map(s=>(
                      <div key={s} className={`mini-card${size===s?' active':''}`} onClick={()=>setSize(s)} style={{cursor:'pointer'}}>{s}</div>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:'1.2rem'}}>
                  <div className="cz-step">Material</div>
                  <div className="grid3" style={{marginTop:'.5rem'}}>
                    {['Canvas','Photo Paper','Acrylic'].map(m=>(
                      <div key={m} className={`mini-card${material===m?' active':''}`} onClick={()=>setMaterial(m)} style={{cursor:'pointer'}}>{m}</div>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:'1.2rem'}}>
                  <div className="cz-step">Frame Colour</div>
                  <div className="grid3" style={{marginTop:'.5rem'}}>
                    {['Black','Brown','White','No Frame'].map(c=>(
                      <div key={c} className={`mini-card${frameColor===c?' active':''}`} onClick={()=>setFrameColor(c)} style={{cursor:'pointer'}}>{c}</div>
                    ))}
                  </div>
                </div>
                <div style={{display:'flex',gap:'1rem',marginTop:'1.5rem'}}>
                  <button className="btn btn-outline" onClick={()=>setStep(1)}>← Back</button>
                  <button className="btn btn-gold" style={{flex:1}} onClick={()=>setStep(3)}>Review & Add to Cart →</button>
                </div>
              </div>
            )}

            {/* STEP 3 — Add to Cart */}
            {step===3 && (
              <div>
                <h2 className="display-3" style={{marginBottom:'.5rem'}}>Ready to Order?</h2>
                <p style={{color:'#7A6E60',fontSize:'.9rem',marginBottom:'1.5rem'}}>Review your selections, then add to cart. Our team will reach out via WhatsApp to confirm your artwork before printing.</p>
                <div style={{background:'#F8F4EE',borderRadius:'12px',padding:'1.2rem',marginBottom:'1.5rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'.6rem'}}>
                    <span style={{fontSize:'.85rem',color:'#5A4A3A',fontWeight:600}}>Design</span>
                    <span style={{fontSize:'.85rem'}}>{template.title}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'.6rem'}}>
                    <span style={{fontSize:'.85rem',color:'#5A4A3A',fontWeight:600}}>Size</span>
                    <span style={{fontSize:'.85rem'}}>{size}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'.6rem'}}>
                    <span style={{fontSize:'.85rem',color:'#5A4A3A',fontWeight:600}}>Material</span>
                    <span style={{fontSize:'.85rem'}}>{material}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'.6rem'}}>
                    <span style={{fontSize:'.85rem',color:'#5A4A3A',fontWeight:600}}>Frame</span>
                    <span style={{fontSize:'.85rem'}}>{frameColor}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'.6rem'}}>
                    <span style={{fontSize:'.85rem',color:'#5A4A3A',fontWeight:600}}>Photos uploaded</span>
                    <span style={{fontSize:'.85rem'}}>{Object.keys(photos).length} of {template.photoSlots}</span>
                  </div>
                  <div style={{borderTop:'1px solid #EAE4D8',marginTop:'.6rem',paddingTop:'.6rem',display:'flex',justifyContent:'space-between'}}>
                    <span style={{fontWeight:700,color:'#0F0D0A'}}>Starting Price</span>
                    <span style={{fontWeight:700,fontFamily:'var(--fd)',fontSize:'1.1rem',color:'#B68D40'}}>₹{template.startingPrice?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div style={{background:'#EEF5E8',borderRadius:'10px',padding:'1rem',marginBottom:'1.2rem',fontSize:'.82rem',color:'#3A6020'}}>
                  After placing your order, our team will contact you on WhatsApp to review the final artwork before printing begins.
                </div>
                <div style={{display:'flex',gap:'1rem'}}>
                  <button className="btn btn-outline" onClick={()=>setStep(2)}>← Back</button>
                  <button className="btn btn-gold btn-lg" style={{flex:1}} onClick={handleAddToCart}>
                    Add to Cart · ₹{template.startingPrice?.toLocaleString('en-IN')}
                  </button>
                </div>
                <div style={{textAlign:'center',marginTop:'1rem'}}>
                  <a
                    href={`https://wa.me/917070728989?text=Hi! I'd like to order the ${encodeURIComponent(template.title)} template (${size}, ${material}, ${frameColor} frame).`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{fontSize:'.83rem',color:'#3A7A20',textDecoration:'underline'}}
                  >
                    Or enquire directly on WhatsApp →
                  </a>
                </div>
              </div>
            )}

          </div>

          {/* Mini preview panel */}
          <div style={{width:'220px',flexShrink:0,position:'sticky',top:'calc(var(--nav) + 1rem)'}}>
            <div style={{background:'#F8F4EE',borderRadius:'12px',padding:'1rem',border:'1px solid #EAE4D8'}}>
              <p style={{fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#9A8A6A',marginBottom:'.75rem'}}>Your Design</p>
              <div style={{borderRadius:'8px',overflow:'hidden',marginBottom:'.75rem'}}>
                {/* Show first uploaded photo or template placeholder */}
                {Object.values(photos)[0] ? (
                  <img src={Object.values(photos)[0]} alt="Preview" style={{width:'100%',aspectRatio:'3/4',objectFit:'cover',display:'block'}}/>
                ) : (
                  <div style={{background:'#EAE4D8',aspectRatio:'3/4',display:'flex',alignItems:'center',justifyContent:'center',color:'#9A8A6A',fontSize:'.75rem',textAlign:'center',padding:'1rem'}}>
                    {template.photoSlots>0 ? 'Upload photo to preview' : 'Typography design'}
                  </div>
                )}
              </div>
              <p style={{fontSize:'.8rem',fontWeight:700,color:'#0F0D0A',marginBottom:'.25rem'}}>{template.title}</p>
              <p style={{fontSize:'.72rem',color:'#9A8A6A'}}>{size} · {material}</p>
              <p style={{fontSize:'.72rem',color:'#9A8A6A'}}>{frameColor} Frame</p>
              <p style={{fontFamily:'var(--fd)',fontSize:'.95rem',fontWeight:700,color:'#B68D40',marginTop:'.5rem'}}>
                from ₹{template.startingPrice?.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
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
        <div className="container" style={{padding:'4rem 0',textAlign:'center'}}>
          <p style={{fontSize:'2rem',marginBottom:'1rem'}}>🖼️</p>
          <h2>Template not found</h2>
          <Link to="/customize" className="btn btn-gold" style={{marginTop:'1rem',display:'inline-block'}}>Browse All Templates</Link>
        </div>
      </div>
    );
  }

  return <TemplateWizard template={template} />;
}
