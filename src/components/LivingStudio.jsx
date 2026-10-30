import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Frame from './Frame';
import Icon from './Icon';
import PanZoom, { IDENTITY, ZoomControls } from './PanZoom';
import WallStudio from './WallStudio';
import PreviewDock from './PreviewDock';
import { SIZES, customOption, colourHex } from '../lib/frames';
import { TREATMENTS, treatedSource, composePrint, canvasToBlob, loadImage } from '../lib/treatments';
import { readPhoto, uploadArtwork, photoHandoff, QUALITY_LABEL } from '../lib/upload';
import { optimized } from '../lib/img';
import { useCart } from '../state/cart';
import { useToast } from '../state/store';
import { money } from '../lib/site';

const PREVIEW_EDGE = 1400;
const PRINT_EDGE = 3200;

// Largest size that still prints sharply (~100 dpi on the long edge).
function sharpUpTo(p) {
  if (!p?.width) return null;
  const long = Math.max(p.width, p.height);
  return [...SIZES].reverse().find((s) => long / s.h >= 100) || SIZES[0];
}

/**
 * Upload a photo → choose a treatment → black frame + size → optional caption →
 * live before/after → real price → add to cart. The treated, cropped, captioned
 * print file is rendered by the same code as the preview and uploaded with the order.
 */
export default function LivingStudio({ compact = false, samplePhoto }) {
  const [photo, setPhoto] = useState(() => photoHandoff.take());
  const [img, setImg] = useState(null); // HTMLImageElement of the source
  const [treatment, setTreatment] = useState('original');
  const [previewUrl, setPreviewUrl] = useState('');
  const [thumbs, setThumbs] = useState({});
  const [tf, setTf] = useState(IDENTITY);
  const [sizeName, setSizeName] = useState('A3+');
  const [orientation, setOrientation] = useState('Vertical');
  const [caption, setCaption] = useState({ title: '', sub: '', msg: '' });
  const [showText, setShowText] = useState(false);
  const [busy, setBusy] = useState(false);
  const [wall, setWall] = useState(false);
  const [drag, setDrag] = useState(false);
  const file = useRef(null);
  const stageRef = useRef(null);
  const cart = useCart();
  const toast = useToast();

  const isSample = !photo && !!samplePhoto;
  const srcUrl = photo?.url || (samplePhoto ? optimized(samplePhoto, 1200, 82).replace('output=webp', 'output=jpg') : '');

  // Load the source image whenever it changes.
  useEffect(() => {
    if (!srcUrl) return setImg(null);
    let live = true;
    loadImage(srcUrl)
      .then((i) => live && setImg(i))
      .catch(() => live && setImg(null));
    return () => {
      live = false;
    };
  }, [srcUrl]);

  useEffect(() => {
    if (photo?.width) setOrientation(photo.width > photo.height * 1.15 ? 'Horizontal' : 'Vertical');
  }, [photo]);

  // Treated preview of the whole photo (PanZoom crops it live).
  useEffect(() => {
    if (!img) return setPreviewUrl('');
    let url = '';
    const t = setTimeout(() => {
      try {
        const c = treatedSource(img, treatment, PREVIEW_EDGE);
        c.toBlob((b) => {
          if (!b) return;
          url = URL.createObjectURL(b);
          setPreviewUrl(url);
        }, 'image/jpeg', 0.9);
      } catch {
        setPreviewUrl(srcUrl);
      }
    }, 30);
    return () => {
      clearTimeout(t);
      if (url) URL.revokeObjectURL(url);
    };
  }, [img, treatment, srcUrl]);

  // Small thumbnails of every treatment for the chooser.
  useEffect(() => {
    if (!img) return setThumbs({});
    const out = {};
    TREATMENTS.forEach((t) => {
      try {
        out[t.id] = treatedSource(img, t.id, 160).toDataURL('image/jpeg', 0.8);
      } catch {}
    });
    setThumbs(out);
  }, [img]);

  const size = SIZES.find((s) => s.name === sizeName);
  const option = customOption(sizeName, 'Black');
  const sharp = sharpUpTo(photo);
  const aspect = orientation === 'Horizontal' ? size.h / size.w : size.w / size.h;
  const hasCaption = !!(caption.title || caption.sub || caption.msg);

  const pick = async (f) => {
    try {
      const p = await readPhoto(f);
      if (p.noPreview) toast('This photo format can’t be previewed here — please upload a JPG or PNG for the studio.', 'warn');
      else {
        setPhoto(p);
        setTf(IDENTITY);
      }
    } catch (e) {
      toast(e.message, 'warn');
    }
  };

  const add = async () => {
    if (!photo) return file.current?.click();
    if (!img) return;
    setBusy(true);
    try {
      // Caption fonts must be ready before they're drawn into the print file.
      await Promise.all([document.fonts?.load('400 64px "Instrument Serif"'), document.fonts?.load('italic 400 64px "Instrument Serif"'), document.fonts?.load('600 24px "Inter Tight"')].filter(Boolean)).catch(() => {});
      const source = treatedSource(img, treatment, PRINT_EDGE);
      const print = composePrint(source, { aspect, transform: tf, caption: hasCaption ? caption : null, longEdge: PRINT_EDGE });
      const blob = await canvasToBlob(print, 0.93);
      const printFile = new File([blob], `print-${treatment}.jpg`, { type: 'image/jpeg' });
      const up = await uploadArtwork([
        { file: printFile, name: `print-${treatment}.jpg`, width: print.width, height: print.height },
        { file: photo.file, name: photo.name, width: photo.width, height: photo.height },
      ]);
      if (up.uploaded < up.requested) {
        toast('Upload failed — please check your connection and try again.', 'warn');
        return;
      }
      const label = TREATMENTS.find((t) => t.id === treatment).label;
      cart.add({
        productId: 'custom',
        name: `Living Art — ${label}${caption.title ? ` · ${caption.title}` : ''}`,
        image: '',
        preview: scaled(print, 360),
        price: option.price,
        category: 'personalized',
        colourHex: colourHex('Black'),
        option,
        orientation,
        artworkPaths: up.paths,
        customization: {
          source: 'living-studio',
          treatment,
          printReady: true,
          texts: hasCaption ? caption : undefined,
          orientation,
          transform: tf,
          artworkMeta: up.meta.map((m, i) => ({ ...m, role: i === 0 ? 'print file (cropped, treated, captioned)' : 'original photo' })),
        },
      });
    } catch (e) {
      console.error(e);
      toast('Something went wrong preparing your print. Please try again.', 'warn');
    } finally {
      setBusy(false);
    }
  };

  const frameW = orientation === 'Horizontal' ? '92%' : `${Math.min(78, 44 + size.h * 1.05)}%`;
  const quality = photo ? QUALITY_LABEL[photo.quality] : null;

  const capStyle = useMemo(() => ({ '--cap': hasCaption ? '17%' : '0%' }), [hasCaption]);

  return (
    <div className={`ls ${compact ? 'ls-compact' : ''}`}>
      <div
        ref={stageRef}
        className={`ls-stage ${drag ? 'drag' : ''}`}
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
        <div className="ls-before">
          <span className="ls-tag">{isSample ? 'Sample photo' : 'Your photo'}</span>
          {srcUrl ? <img src={srcUrl} alt="" /> : <div className="ls-empty" />}
          <button type="button" className="ls-upload" onClick={() => file.current?.click()}>
            <Icon name="upload" size={16} /> {photo ? 'Change photo' : 'Upload your photo'}
          </button>
        </div>
        <span className="ls-arrow" aria-hidden="true">
          <Icon name="arrow" size={22} />
        </span>
        <div className="ls-after">
          <span className="ls-tag">Framed · {sizeName}</span>
          <div className="ls-frame" style={{ width: frameW }}>
            <Frame ratio={{ w: size.w, h: size.h }} orientation={orientation} colour="#1C1C1C" thickness={3}>
              <div className="ls-print" style={capStyle}>
                <div className="ls-photo">{previewUrl ? <PanZoom src={previewUrl} value={tf} onChange={setTf} alt="Preview of your framed photo" editable={!!photo} /> : <div className="ls-empty" />}</div>
                {hasCaption && (
                  <div className="ls-cap">
                    {caption.title && <b>{caption.title}</b>}
                    {caption.sub && <small>{caption.sub}</small>}
                    {caption.msg && <i>{caption.msg}</i>}
                  </div>
                )}
              </div>
            </Frame>
          </div>
        </div>
      </div>

      {!compact && previewUrl && (
        <PreviewDock target={stageRef}>
          <Frame ratio={{ w: size.w, h: size.h }} orientation={orientation} colour="#1C1C1C" thickness={3} glare={false}>
            <div className="ls-print" style={capStyle}>
              <div className="ls-photo">
                <PanZoom src={previewUrl} value={tf} alt="" editable={false} />
              </div>
              {hasCaption && (
                <div className="ls-cap">
                  {caption.title && <b>{caption.title}</b>}
                  {caption.sub && <small>{caption.sub}</small>}
                  {caption.msg && <i>{caption.msg}</i>}
                </div>
              )}
            </div>
          </Frame>
        </PreviewDock>
      )}
      <div className="ls-panel">
        <fieldset className="ls-group">
          <legend>1 · Treatment</legend>
          <div className="ls-treatments">
            {TREATMENTS.map((t) => (
              <button key={t.id} type="button" className={`ls-t ${treatment === t.id ? 'on' : ''}`} aria-pressed={treatment === t.id} onClick={() => setTreatment(t.id)}>
                <span className="ls-t-img">{thumbs[t.id] ? <img src={thumbs[t.id]} alt="" /> : null}</span>
                <b>{t.label}</b>
                {!compact && <small>{t.hint}</small>}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="ls-group">
          <legend>
            2 · Size <span>· black frame</span>
          </legend>
          <div className="ls-sizes">
            {SIZES.map((s) => {
              const soft = sharp && SIZES.indexOf(s) > SIZES.indexOf(sharp);
              return (
                <button key={s.slug} type="button" className={`ls-size ${s.name === sizeName ? 'on' : ''}`} aria-pressed={s.name === sizeName} onClick={() => setSizeName(s.name)} title={soft ? 'Your photo may look soft at this size' : s.dimensions}>
                  <b>{s.name}</b>
                  <small>{money(s.price)}</small>
                  {soft && <em>may be soft</em>}
                </button>
              );
            })}
          </div>
          <div className="ls-row">
            <button type="button" className="chip" onClick={() => setOrientation((o) => (o === 'Vertical' ? 'Horizontal' : 'Vertical'))}>
              <Icon name="rotate" size={15} /> {orientation === 'Vertical' ? 'Portrait' : 'Landscape'}
            </button>
            {photo && <ZoomControls value={tf} onChange={setTf} />}
          </div>
        </fieldset>
        <fieldset className="ls-group">
          <legend>
            3 · Words <span>· optional</span>
          </legend>
          {showText || hasCaption ? (
            <div className="ls-text">
              <input className="input" maxLength={32} placeholder="Names — e.g. Aarav & Ananya" value={caption.title} onChange={(e) => setCaption((c) => ({ ...c, title: e.target.value }))} aria-label="Names or title" />
              <input className="input" maxLength={36} placeholder="Date or place — e.g. 14 February 2024" value={caption.sub} onChange={(e) => setCaption((c) => ({ ...c, sub: e.target.value }))} aria-label="Date or place" />
              {!compact && <input className="input" maxLength={60} placeholder="A short message" value={caption.msg} onChange={(e) => setCaption((c) => ({ ...c, msg: e.target.value }))} aria-label="Message" />}
            </div>
          ) : (
            <button type="button" className="chip" onClick={() => setShowText(true)}>
              <Icon name="type" size={15} /> Add a name, date or message
            </button>
          )}
        </fieldset>
        <div className="ls-buy">
          <div>
            <b>{money(option.price)}</b>
            <small>
              {size.dimensions} · black frame · free delivery
              {quality && <span className={`q-${quality.tone}`}> · {quality.text}</span>}
            </small>
          </div>
          <button type="button" className="btn btn-gold btn-lg" disabled={busy} onClick={add}>
            {busy ? 'Preparing your print…' : photo ? 'Add to bag' : 'Upload your photo'}
          </button>
        </div>
        <div className="ls-links">
          {photo && (
            <button type="button" className="link" onClick={() => setWall(true)}>
              <Icon name="sofa" size={15} /> See it on a wall
            </button>
          )}
          {compact && (
            <Link to="/customize/photo" className="link">
              Open the full studio <Icon name="arrow" size={15} />
            </Link>
          )}
          {!compact && (
            <Link to="/customize" className="link">
              More layouts & templates <Icon name="arrow" size={15} />
            </Link>
          )}
        </div>
      </div>
      <input ref={file} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])} />
      {wall && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="See it on a wall">
          <div className="scrim" onClick={() => setWall(false)} />
          <div className="modal-panel" style={{ padding: 18 }}>
            <button className="icon-btn modal-close" onClick={() => setWall(false)} aria-label="Close">
              <Icon name="close" />
            </button>
            <WallStudio wIn={orientation === 'Horizontal' ? size.h : size.w} hIn={orientation === 'Horizontal' ? size.w : size.h} colour="#1C1C1C">
              <div className="ls-print" style={capStyle}>
                <div className="ls-photo">{previewUrl && <PanZoom src={previewUrl} value={tf} onChange={() => {}} editable={false} />}</div>
                {hasCaption && (
                  <div className="ls-cap">
                    {caption.title && <b>{caption.title}</b>}
                    {caption.sub && <small>{caption.sub}</small>}
                    {caption.msg && <i>{caption.msg}</i>}
                  </div>
                )}
              </div>
            </WallStudio>
          </div>
        </div>
      )}
    </div>
  );
}

function scaled(canvas, edge) {
  const k = edge / Math.max(canvas.width, canvas.height);
  const c = document.createElement('canvas');
  c.width = Math.round(canvas.width * k);
  c.height = Math.round(canvas.height * k);
  c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.75);
}
