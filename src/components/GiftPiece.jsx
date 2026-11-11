import { useTemplates } from '../lib/templates';
import { SIZES } from '../lib/frames';
import TemplateCanvas from './TemplateCanvas';

/* One purchased gift, drawn from the real order: the customer's customised
   design when there is one (template + their photos and words, or their own
   uploaded artwork), otherwise the product's own photo.
   gift: { name, qty, size, colour, orientation, image, preview } from the gift-reveal function */

const LOGO = '/logo-mark-lg.webp';

function slotMap(preview, tmpl) {
  const out = {};
  const loose = [];
  (preview.photos || []).forEach((p) => {
    if (!p.url) return;
    if (p.slot && !out[p.slot]) out[p.slot] = p.url;
    else loose.push(p.url);
  });
  (tmpl.slots || []).forEach((s) => !out[s.id] && loose.length && (out[s.id] = loose.shift()));
  return out;
}

export default function GiftPiece({ gift, className = '' }) {
  const all = useTemplates();
  const p = gift.preview;
  const tmpl = p?.kind === 'template' ? p.template || all?.map?.[p.templateId] || null : null;
  const size = SIZES.find((s) => s.name === gift.size);
  const land = gift.orientation === 'Horizontal';
  const ratio = size ? (land ? `${size.h} / ${size.w}` : `${size.w} / ${size.h}`) : null;
  const frame = gift.colour ? `grv-fc-${String(gift.colour).toLowerCase().replace(/[^a-z]/g, '')}` : '';

  let inner;
  if (tmpl) {
    inner = (
      <div className="grv-design" style={ratio ? { aspectRatio: ratio } : undefined}>
        <TemplateCanvas template={tmpl} photos={slotMap(p, tmpl)} transforms={p.transforms || {}} texts={p.texts || {}} calendar={p.calendar || undefined} samples={false} />
      </div>
    );
  } else if (p?.kind === 'photo' && p.url) {
    inner = <img src={p.url} alt={`${gift.name} — the design made for you`} draggable={false} />;
  } else if (gift.image) {
    inner = <img src={gift.image} alt={gift.name} draggable={false} />;
  } else {
    inner = <img className="grv-frame-mark" src={LOGO} alt="" />;
  }

  return (
    <figure className={`grv-piece ${className}`}>
      <div className={`grv-frame ${frame} ${tmpl ? 'is-design' : ''}`}>
        {inner}
        <span className="grv-frame-glare" />
      </div>
      <figcaption>
        <b>{gift.name}</b>
        {(gift.size || gift.colour || gift.qty > 1) && (
          <small>{[gift.size, gift.colour && `${gift.colour} frame`, gift.orientation, gift.qty > 1 && `× ${gift.qty}`].filter(Boolean).join(' · ')}</small>
        )}
      </figcaption>
    </figure>
  );
}
