import { useState, useRef, useEffect } from 'react';
import { useScrollReveal } from '../components/ScrollReveal';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function Customize() {
  useScrollReveal();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [size, setSize] = useState('12×16"');
  const [material, setMaterial] = useState('Canvas');
  const [frameColor, setFrameColor] = useState('Black');
  const [photo, setPhoto] = useState(null);
  const czRoomRef = useRef(null);

  const cols = {Black:'#1A1A1A', Brown:'#6B4423', White:'#E0D9CF', 'No Frame':'transparent'};
  const ratios = {'8×10"':'4/5', '12×16"':'3/4', '16×20"':'4/5'};
  const bw = {Canvas:'8px', 'Photo Paper':'16px', Acrylic:'3px'};

  const borderColor = frameColor === 'No Frame' ? 'transparent' : (cols[frameColor] || '#1A1A1A');
  const borderWidth = frameColor === 'No Frame' ? '0px' : (bw[material] || '8px');
  const aspectRatio = ratios[size] || '3/4';
  const sizeLabel = `${size} · ${frameColor === 'No Frame' ? 'No Frame' : frameColor + ' Frame'} · ${material}`;
  const innerBoxShadow = material === 'Acrylic' ? 'inset 0 0 20px rgba(180,200,255,.12),inset 0 0 0 1px rgba(200,220,255,.25)' : '';

  useEffect(() => {
    const cz = czRoomRef.current;
    if (!cz) return;
    const onMove = e => {
      const r = cz.getBoundingClientRect();
      const mx = (e.clientX - r.left) / r.width - .5;
      const my = (e.clientY - r.top) / r.height - .5;
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
      {/* Customize Banner */}
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

      {/* Customize Tool */}
      <section id="czTool" className="cz-tool">
        <div className="container">
          <div className="cz-tool-head s-reveal" style={{maxWidth:'560px',margin:'0 auto 2.4rem'}}>
            <p className="eyebrow" style={{textAlign:'center'}}>Customize Your Frame</p>
            <h2 className="display-3" style={{textAlign:'center',marginTop:'.4rem'}}>Build Your Perfect Print</h2>
          </div>
          <div className="customize-wrap">
            {/* Panel */}
            <div className="cz-panel">
              <div>
                <div className="cz-step">Step 1 · Upload Photo</div>
                <label className="upload" style={{cursor:'pointer'}}>
                  <input type="file" accept="image/*" id="czUpload" style={{display:'none'}} onChange={handleUpload} />
                  <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <div style={{fontWeight:600,marginBottom:'.3rem'}}>Drag &amp; drop your photo</div>
                  <div style={{fontSize:'.8rem',color:'var(--muted)'}}>or click to browse (JPG, PNG)</div>
                </label>
              </div>
              <div>
                <div className="cz-step">Step 2 · Choose Size</div>
                <div className="grid3">
                  {['8×10"','12×16"','16×20"'].map(s=><MiniCard key={s} label={s} active={size===s} onClick={()=>setSize(s)} />)}
                </div>
              </div>
              <div>
                <div className="cz-step">Step 3 · Choose Material</div>
                <div className="grid3">
                  {['Canvas','Photo Paper','Acrylic'].map(m=><MiniCard key={m} label={m} active={material===m} onClick={()=>setMaterial(m)} />)}
                </div>
              </div>
              <div>
                <div className="cz-step">Step 4 · Choose Frame</div>
                <div className="grid3">
                  {['Black','Brown','White','No Frame'].map(c=><MiniCard key={c} label={c} active={frameColor===c} onClick={()=>setFrameColor(c)} />)}
                </div>
              </div>
              <button className="btn btn-gold btn-lg" style={{width:'100%'}} onClick={()=>{addToCart('custom');toast('Custom frame added to cart ✓');}}>
                Add to Cart · ₹1,499
              </button>
            </div>
            {/* Preview */}
            <div className="cz-preview">
              <div id="czRoom" ref={czRoomRef} style={{background:'linear-gradient(150deg,#F7F3EC 0%,#EDE7D9 100%)',aspectRatio:'4/5',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'2rem 1.5rem',borderRadius:'1rem 1rem 0 0',position:'relative',transition:'transform .15s cubic-bezier(.16,1,.3,1)',cursor:'crosshair'}}>
                <div id="czFrameWrap" style={{width:'70%',transition:'all .4s cubic-bezier(.16,1,.3,1)'}}>
                  <div id="czBorder" style={{border:`${borderWidth} solid ${borderColor}`,borderRadius:'4px',boxShadow:'0 28px 70px rgba(0,0,0,.3),0 8px 24px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.1)',transition:'border-color .35s,border-width .35s,aspect-ratio .4s',aspectRatio}}>
                    <div id="czInner" style={{width:'100%',height:'100%',background:'linear-gradient(160deg,#F5EEE0 0%,#EBE2D0 100%)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',boxShadow:innerBoxShadow}}>
                      <div id="czPhotoArea" style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'.7rem',color:'#B8A080'}}>
                        {photo ? (
                          <img src={photo} alt="Your photo" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
                        ) : (
                          <>
                            <svg viewBox="0 0 48 48" style={{width:'38px',height:'38px',opacity:.35,stroke:'#B8A080',fill:'none',strokeWidth:1.5}}><rect x="4" y="4" width="40" height="40" rx="4"/><circle cx="16" cy="16" r="5"/><path d="M4 33l12-13 8 8 6-6 14 14"/></svg>
                            <span style={{fontSize:'.62rem',letterSpacing:'.16em',textTransform:'uppercase',opacity:.5}}>Your Photo Here</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div id="czSizeLabel" style={{marginTop:'1.4rem',background:'rgba(26,18,8,.6)',color:'#fff',fontSize:'.68rem',letterSpacing:'.12em',padding:'.35rem 1.1rem',borderRadius:'var(--pill)',backdropFilter:'blur(10px)'}}>{sizeLabel}</div>
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
