import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { useTemplates } from '../lib/templates';
import { SIZES } from '../lib/frames';
import TemplateCanvas from '../components/TemplateCanvas';
import Icon from '../components/Icon';

// The customer's approved design for a template order, rebuilt from exactly
// what was saved with the order: the template as it was at checkout, the
// original-resolution photos, their crop/zoom and the words. "Print layout"
// lays it out at the ordered size for printing or saving as a PDF.

function slotPhotos(item, tmpl) {
  const c = item.customization || {};
  const paths = item.artwork_paths || [];
  const bySlot = {};
  (c.artworkMeta || []).forEach((m) => m.slot && m.path && (bySlot[m.slot] = m.path));
  // Older orders: photos were saved in the order the slots were filled.
  const filled = Object.keys(c.transforms || {});
  filled.forEach((id, i) => !bySlot[id] && paths[i] && (bySlot[id] = paths[i]));
  if (!filled.length) (tmpl.slots || []).forEach((s, i) => !bySlot[s.id] && paths[i] && (bySlot[s.id] = paths[i]));
  return bySlot;
}

export default function ApprovedDesign({ item, orderNumber }) {
  const c = item.customization || {};
  const all = useTemplates();
  const live = all?.map?.[c.templateId];
  const tmpl = c.templateSnapshot || live || null;
  const [src, setSrc] = useState({});
  const [printing, setPrinting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const bySlot = tmpl ? slotPhotos(item, tmpl) : {};
  useEffect(() => {
    let on = true;
    Promise.all(Object.entries(bySlot).map(async ([slot, p]) => [slot, (await supabase.storage.from('customer-artwork').createSignedUrl(p, 3600)).data?.signedUrl])).then((r) => {
      if (!on) return;
      setSrc(Object.fromEntries(r.filter(([, u]) => u)));
      setLoaded(true);
    });
    return () => {
      on = false;
    };
  }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (c.source !== 'template') return null;
  if (!tmpl) return <p className="ad-muted">Template “{c.templateTitle || c.templateId}” is no longer available to redraw this design — use the photos and words below.</p>;

  const size = SIZES.find((s) => s.name === item.frame_size) || SIZES[0];
  const land = (item.frame_orientation || c.orientation) === 'Horizontal';
  const w = land ? size.h : size.w;
  const h = land ? size.w : size.h;
  const texts = c.textsRaw || c.texts || {};
  const canvas = <TemplateCanvas template={tmpl} photos={src} transforms={c.transforms || {}} texts={texts} calendar={c.calendar || undefined} samples={false} />;
  // A slot is missing if the customer filled it (or it is required) but its photo can't be loaded.
  const wanted = (tmpl.slots || []).filter((s) => s.required || bySlot[s.id] || (c.transforms || {})[s.id]);
  const missing = wanted.filter((s) => !src[s.id]).length;
  const ready = loaded && missing <= 0;

  return (
    <div className="ad-approved">
      <div className="ad-approved-head">
        <b>Approved design</b>
        {!c.templateSnapshot && <small className="ad-muted">Drawn with the current version of this template (saved before snapshots were added).</small>}
      </div>
      <div className="ad-approved-box" style={{ aspectRatio: `${w} / ${h}` }}>
        {canvas}
      </div>
      <button className="ad-btn" disabled={!ready} onClick={() => setPrinting(true)}>
        <Icon name="download" size={15} /> {ready ? `Print layout · ${size.name} (${w} × ${h} in)` : loaded ? `${missing} photo${missing > 1 ? 's' : ''} missing — can’t print` : 'Loading photos…'}
      </button>
      {printing &&
        createPortal(
          <div className="ad-print-root" role="dialog" aria-label="Print layout">
            <style>{`@page { size: ${w}in ${h}in; margin: 0; } @media print { body > *:not(.ad-print-root) { display: none !important; } .ad-print-root { position: static !important; background: none !important; } .ad-print-bar { display: none !important; } .ad-print-sheet { box-shadow: none !important; width: ${w}in !important; height: ${h}in !important; } }`}</style>
            <div className="ad-print-bar">
              <span>
                {orderNumber} · {item.name} · {size.name} {land ? 'landscape' : 'portrait'} · {w} × {h} in — original-resolution photos
              </span>
              <button className="ad-btn ad-btn-primary" onClick={() => window.print()}>
                Print / Save as PDF
              </button>
              <button className="ad-btn" onClick={() => setPrinting(false)}>
                Close
              </button>
            </div>
            <div className="ad-print-sheet" style={{ width: `min(92vw, ${(86 * w) / h}vh)`, aspectRatio: `${w} / ${h}` }}>
              {canvas}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
