import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Frame from '../components/Frame';
import Icon from '../components/Icon';
import PanZoom, { IDENTITY, ZoomControls } from '../components/PanZoom';
import WallStudio from '../components/WallStudio';
import { Seo } from '../lib/seo';
import { SIZES, customColours, customOption, colourHex } from '../lib/frames';
import { readPhoto, uploadArtwork, photoHandoff, QUALITY_LABEL } from '../lib/upload';
import { useCart } from '../state/cart';
import { useToast } from '../state/store';
import { money } from '../lib/site';

// Largest size that still prints sharply (~100 dpi minimum on the long edge).
function bestSize(p) {
  if (!p?.width) return null;
  const long = Math.max(p.width, p.height);
  return [...SIZES].reverse().find((s) => long / s.h >= 100) || SIZES[0];
}

export default function PhotoBuilder() {
  const [photo, setPhoto] = useState(() => photoHandoff.take());
  const [tf, setTf] = useState(IDENTITY);
  const [sizeName, setSizeName] = useState('A3+');
  const [colour, setColour] = useState('Black');
  const [orientation, setOrientation] = useState(() => (photo && photo.width > photo.height * 1.15 ? 'Horizontal' : 'Vertical'));
  const [view, setView] = useState('frame');
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const file = useRef(null);
  const cart = useCart();
  const toast = useToast();

  const colours = customColours(sizeName);
  useEffect(() => {
    if (!colours.includes(colour)) setColour(colours[0]);
  }, [sizeName]); // eslint-disable-line react-hooks/exhaustive-deps
  const option = customOption(sizeName, colour);
  const size = SIZES.find((s) => s.name === sizeName);
  const best = bestSize(photo);

  const pick = async (f) => {
    try {
      const p = await readPhoto(f);
      setPhoto(p);
      setTf(IDENTITY);
      setOrientation(p.width && p.width > p.height * 1.15 ? 'Horizontal' : 'Vertical');
    } catch (e) {
      toast(e.message, 'warn');
    }
  };

  const add = async () => {
    if (!photo) return file.current?.click();
    setBusy(true);
    try {
      const up = await uploadArtwork([{ file: photo.file, name: photo.name, width: photo.width, height: photo.height }]);
      if (up.uploaded < up.requested) {
        toast('Photo upload failed — please try again.', 'warn');
        return;
      }
      cart.add({
        productId: 'custom',
        name: 'Custom Photo Frame',
        image: '',
        preview: photo.thumb || photo.url,
        price: option.price,
        category: 'personalized',
        colourHex: colourHex(colour),
        option,
        orientation,
        artworkPaths: up.paths,
        customization: { source: 'scratch-builder', orientation, artworkMeta: up.meta, transform: tf },
      });
    } finally {
      setBusy(false);
    }
  };

  const wIn = orientation === 'Horizontal' ? size.h : size.w;
  const hIn = orientation === 'Horizontal' ? size.w : size.h;

  return (
    <>
      <Seo title="Frame Your Photo — Custom Photo Frame Online" description={`Upload any photo and see it framed instantly. Four sizes, black, gold or brown frames, from ${money(SIZES[0].price)}. Free delivery across India.`} path="/customize/photo" />
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden>/</span>
          <Link to="/customize">Personalise</Link>
          <span aria-hidden>/</span>
          <span>Frame a photo</span>
        </nav>
      </div>
      <section className="wrap editor">
        <div className="editor-stage">
          <div className="pdp-views" role="tablist">
            <button role="tab" aria-selected={view === 'frame'} onClick={() => setView('frame')}>
              <Icon name="image" size={17} /> Frame
            </button>
            <button role="tab" aria-selected={view === 'room'} onClick={() => setView('room')} disabled={!photo}>
              <Icon name="sofa" size={17} /> On a wall
            </button>
          </div>
          {view === 'frame' ? (
            <div
              className={`editor-wall ${drag ? 'drag' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                e.dataTransfer.files?.[0] && pick(e.dataTransfer.files[0]);
              }}
            >
              <div className="editor-frame" style={{ width: orientation === 'Horizontal' ? '86%' : `${Math.min(70, 36 + size.h * 1.1)}%` }}>
                <Frame ratio={{ w: size.w, h: size.h }} orientation={orientation} colour={colourHex(colour)}>
                  {photo ? (
                    <PanZoom src={photo.url} value={tf} onChange={setTf} alt="Your photo" />
                  ) : (
                    <button className="tc-empty builder-empty" onClick={() => file.current?.click()}>
                      <Icon name="upload" size={28} />
                      <span>Tap to upload or drop a photo</span>
                    </button>
                  )}
                </Frame>
              </div>
            </div>
          ) : (
            <WallStudio src={photo?.url} wIn={wIn} hIn={hIn} colour={colourHex(colour)} />
          )}
          {photo && view === 'frame' && (
            <div className="editor-adjust">
              <ZoomControls value={tf} onChange={setTf} />
              <button className="chip" onClick={() => setOrientation((o) => (o === 'Vertical' ? 'Horizontal' : 'Vertical'))}>
                <Icon name="rotate" size={15} /> {orientation === 'Vertical' ? 'Portrait' : 'Landscape'}
              </button>
            </div>
          )}
        </div>
        <div className="editor-panel">
          <span className="eyebrow">Frame a photo</span>
          <h1 className="h2" style={{ margin: '10px 0 8px' }}>
            Your photo, <em>beautifully framed.</em>
          </h1>
          <p className="muted">Upload, drag to crop, choose a size and finish. Printed in high definition and framed by hand.</p>

          <div className="editor-sec">
            {photo ? (
              <div className="own-photo has" style={{ marginTop: 18 }}>
                <div>
                  <b>{photo.name || 'Your photo'}</b>
                  <small className={`q-${QUALITY_LABEL[photo.quality]?.tone}`}>
                    {QUALITY_LABEL[photo.quality]?.text}
                    {best && ` · sharp up to ${best.name}`}
                  </small>
                </div>
                <button className="chip" onClick={() => file.current?.click()}>
                  Change
                </button>
              </div>
            ) : (
              <button className="dropzone" style={{ marginTop: 18 }} onClick={() => file.current?.click()}>
                <Icon name="upload" size={22} />
                <b>Upload a photo</b>
                <small>JPG, PNG, WebP or HEIC · up to 15 MB</small>
              </button>
            )}
            <label className="editor-label">Size</label>
            <div className="size-grid">
              {SIZES.map((s) => {
                const soft = best && SIZES.indexOf(s) > SIZES.indexOf(best);
                return (
                  <button key={s.slug} className={`size-card ${s.name === sizeName ? 'on' : ''}`} onClick={() => setSizeName(s.name)} aria-pressed={s.name === sizeName} title={soft ? 'Your photo may look soft at this size' : ''}>
                    <span className="size-icon" style={{ width: (s.w * 26) / 36, height: (s.h * 26) / 36 }} aria-hidden="true" />
                    <b>{s.name}</b>
                    <small>{money(s.price)}</small>
                    {soft && <small className="q-warn">may be soft</small>}
                  </button>
                );
              })}
            </div>
            <label className="editor-label">Frame</label>
            <div className="swatches">
              {colours.map((c) => (
                <button key={c} className={`swatch swatch-frame ${c === colour ? 'on' : ''}`} style={{ '--sw': colourHex(c) }} aria-label={`${c} frame`} aria-pressed={c === colour} onClick={() => setColour(c)} />
              ))}
            </div>
            <p className="small muted" style={{ marginTop: 10 }}>
              {size.dimensions} · {colour} PS moulding
            </p>
          </div>
          <div className="editor-buy">
            <div>
              <b>{money(option?.price || 0)}</b>
              <small>free delivery · free replacement</small>
            </div>
            <button className="btn btn-gold btn-lg" disabled={busy} onClick={add}>
              {busy ? 'Uploading…' : photo ? 'Add to cart' : 'Upload a photo'}
            </button>
          </div>
        </div>
      </section>
      <input ref={file} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])} />
    </>
  );
}
