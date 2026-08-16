/* TemplateRenderer — reusable SVG-based live preview.
   Renders ANY template layout using uploaded photos + personalization text.
   Architecture: renderer reads template.layout → computes slot rects → renders
   SVG <image> elements for real photos, placeholder rects when empty.

   ViewBox: 600×800 (3:4 portrait, matches standard print ratios).
   Adding a new template layout: add one case to slotRects(). Nothing else changes. */

const VW = 600;     // viewbox width
const VH = 800;     // viewbox height
const PP = 18;      // outer padding
const TZ = 110;     // text zone height at bottom
const PHOTO_H = VH - TZ - PP;   // = 672 — photo composition area
const GAP = 8;

/* ── Slot geometry map ────────────────────────────────────────────────────── */
export function slotRects(layout, nSlots) {
  const uw = VW - PP * 2;         // 564
  const uh = PHOTO_H;              // 672

  switch (layout) {
    case 'text-only':
      return [];

    case 'single':
      return [{ x:PP, y:PP, w:uw, h:uh }];

    case 'pair': {
      const hw = (uw - GAP) / 2;
      return [
        { x:PP,       y:PP, w:hw, h:uh },
        { x:PP+hw+GAP, y:PP, w:hw, h:uh },
      ];
    }

    case 'three-col': {
      const sw = (uw - GAP * 2) / 3;
      return [0, 1, 2].map(i => ({ x: PP + i * (sw + GAP), y: PP, w: sw, h: uh }));
    }

    case 'four-grid': {
      const hw = (uw - GAP) / 2;
      const hh = (uh - GAP) / 2;
      return [
        { x:PP,        y:PP,        w:hw, h:hh },
        { x:PP+hw+GAP, y:PP,        w:hw, h:hh },
        { x:PP,        y:PP+hh+GAP, w:hw, h:hh },
        { x:PP+hw+GAP, y:PP+hh+GAP, w:hw, h:hh },
      ];
    }

    case 'five-1main':
    case 'five-main-row': {
      // Main large photo (left 56%) + 2×2 right grid
      const mw  = Math.round(uw * 0.56);
      const sw  = uw - mw - GAP;          // right panel width
      const hw  = Math.round((sw - GAP) / 2);
      const hh  = Math.round((uh - GAP) / 2);
      const rx  = PP + mw + GAP;          // right panel x start
      const rw2 = sw - hw - GAP;          // right col 2 width
      const rh2 = uh - hh - GAP;          // right row 2 height
      return [
        { x:PP,     y:PP,        w:mw, h:uh  },  // main
        { x:rx,     y:PP,        w:hw, h:hh  },  // top-left  of right
        { x:rx+hw+GAP, y:PP,     w:rw2, h:hh },  // top-right of right
        { x:rx,     y:PP+hh+GAP, w:hw, h:rh2 },  // bot-left  of right
        { x:rx+hw+GAP, y:PP+hh+GAP, w:rw2, h:rh2 }, // bot-right
      ];
    }

    case 'six-grid': {
      const sw = (uw - GAP * 2) / 3;
      const hh = (uh - GAP) / 2;
      return [0, 1, 2].flatMap(c =>
        [0, 1].map(r => ({ x: PP + c * (sw + GAP), y: PP + r * (hh + GAP), w: sw, h: hh }))
      );
    }

    case 'nine-grid': {
      const sw = (uw - GAP * 2) / 3;
      const sh = (uh - GAP * 2) / 3;
      return [0, 1, 2].flatMap(c =>
        [0, 1, 2].map(r => ({ x: PP + c * (sw + GAP), y: PP + r * (sh + GAP), w: sw, h: sh }))
      );
    }

    case 'stacked': {
      if (!nSlots || nSlots <= 1) return [{ x:PP, y:PP, w:uw, h:uh }];
      const mainH = Math.round(uh * 0.58);
      const restH = uh - mainH - GAP;
      const n     = nSlots - 1;
      const sw    = (uw - GAP * (n - 1)) / n;
      return [
        { x:PP, y:PP, w:uw, h:mainH },
        ...[...Array(n)].map((_, i) => ({ x: PP + i * (sw + GAP), y: PP + mainH + GAP, w: sw, h: restH })),
      ];
    }

    case 'calendar-1': {
      const pw = Math.round(uw * 0.56);
      const cw = uw - pw - GAP;
      return [
        { x:PP,       y:PP, w:pw, h:uh },
        { x:PP+pw+GAP, y:PP, w:cw, h:uh, isCalendar:true },
      ];
    }

    case 'calendar-multi': {
      const n          = nSlots || 4;
      const photoAreaH = Math.round(uh * 0.62);
      const calH       = uh - photoAreaH - GAP;
      let photoRects   = [];

      if (n <= 2) {
        const hw = (uw - GAP) / 2;
        photoRects = [
          { x:PP,        y:PP, w:hw, h:photoAreaH },
          { x:PP+hw+GAP, y:PP, w:hw, h:photoAreaH },
        ].slice(0, n);
      } else if (n <= 4) {
        const hw = (uw - GAP) / 2;
        const hh = (photoAreaH - GAP) / 2;
        photoRects = [
          { x:PP,        y:PP,        w:hw, h:hh },
          { x:PP+hw+GAP, y:PP,        w:hw, h:hh },
          { x:PP,        y:PP+hh+GAP, w:hw, h:photoAreaH-hh-GAP },
          { x:PP+hw+GAP, y:PP+hh+GAP, w:hw, h:photoAreaH-hh-GAP },
        ].slice(0, n);
      } else {
        const sw = (uw - GAP * 2) / 3;
        const hh = (photoAreaH - GAP) / 2;
        photoRects = [0, 1, 2].flatMap(c =>
          [0, 1].map(r => ({ x: PP + c * (sw + GAP), y: PP + r * (hh + GAP), w: sw, h: hh }))
        ).slice(0, n);
      }

      return [
        ...photoRects,
        { x:PP, y: PP + photoAreaH + GAP, w:uw, h:calH, isCalendar:true },
      ];
    }

    default:
      return [{ x:PP, y:PP, w:uw, h:uh }];
  }
}

/* ── Simple month calendar block ─────────────────────────────────────────── */
function CalendarBlock({ rect, calendar, accent }) {
  const { x, y, w, h } = rect;
  const month  = calendar?.month || 1;
  const year   = calendar?.year  || 2025;
  const hlDay  = calendar?.highlightDate;

  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const DAYS   = ['S','M','T','W','T','F','S'];

  const firstDay  = new Date(year, month - 1, 1).getDay();
  const totalDays = new Date(year, month, 0).getDate();
  const cellW     = (w - 16) / 7;
  const cellH     = Math.max(14, Math.min(22, (h - 60) / 6));

  const cells = [];
  let d = 1;
  for (let r = 0; r < 6 && d <= totalDays; r++) {
    for (let c = 0; c < 7; c++) {
      if (r === 0 && c < firstDay) continue;
      if (d > totalDays) break;
      cells.push({
        d,
        cx: x + 8 + c * cellW + cellW / 2,
        cy: y + 54 + r * cellH + cellH * 0.7,
        hl: d === hlDay,
      });
      d++;
    }
  }

  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#fff" rx="6" opacity="0.92"/>
      <rect x={x} y={y} width={w} height={36} fill={accent} rx="6" opacity="0.85"/>
      <text x={x+w/2} y={y+23} textAnchor="middle" fontSize="12" fill="white"
        fontFamily="Georgia,serif" fontWeight="bold">{MONTHS[month-1]} {year}</text>
      {DAYS.map((d, i) => (
        <text key={i} x={x+8+i*cellW+cellW/2} y={y+47} textAnchor="middle"
          fontSize="7.5" fill="#777" fontFamily="Arial,sans-serif">{d}</text>
      ))}
      {cells.map(({ d:day, cx, cy, hl }) => (
        <g key={day}>
          {hl && <circle cx={cx} cy={cy-4} r={cellH*0.46} fill={accent} opacity="0.85"/>}
          <text x={cx} y={cy} textAnchor="middle"
            fontSize="8.5" fill={hl ? '#fff' : '#333'} fontFamily="Arial,sans-serif">{day}</text>
        </g>
      ))}
    </g>
  );
}

/* ── Text zone at bottom ──────────────────────────────────────────────────── */
function TextZone({ template, texts, accent, scale = 1, fontStyle = 'serif-italic' }) {
  const fields  = template.textFields || [];
  const decs    = template.decoratives || [];
  const ff = fontStyle === 'sans' ? 'Arial,Helvetica,sans-serif' : fontStyle === 'classic' ? "'Times New Roman',serif" : 'Georgia,serif';
  const fi = fontStyle === 'serif-italic' || fontStyle === 'classic' ? 'italic' : 'normal';
  const fw = fontStyle === 'serif-bold'   || fontStyle === 'classic' ? 'bold'   : 'normal';

  const hasId   = (id) => fields.some(f => f.id === id);
  const getVal  = (id) => {
    const v = texts?.[id];
    return (v !== undefined && v !== '') ? v : (fields.find(f => f.id === id)?.defaultValue || '');
  };

  const tzTop = PP + PHOTO_H + 8;
  const cx    = VW / 2;
  const elems = [];
  let y = tzTop + 28;

  // — Names —
  if (hasId('name1') && hasId('name2')) {
    const n1 = getVal('name1'), n2 = getVal('name2');
    const nm = [n1, n2].filter(Boolean).join(' & ');
    if (nm) {
      elems.push({ key:'nm', x:cx, y, text:nm, fs:19, fill:accent, fi:'italic' });
      if (decs.includes('hearts')) {
        elems.push({ key:'h1', x:cx-88, y, text:'♥', fs:11, fill:accent, op:0.55 });
        elems.push({ key:'h2', x:cx+80, y, text:'♥', fs:11, fill:accent, op:0.55 });
      }
      y += 30;
    }
  } else if (hasId('name')) {
    const n = getVal('name');
    if (n) { elems.push({ key:'nm', x:cx, y, text:n, fs:19, fill:accent, fi:'italic' }); y += 30; }
  } else if (hasId('surname')) {
    const s = getVal('surname');
    if (s) { elems.push({ key:'sur', x:cx, y, text:s.toUpperCase(), fs:17, fill:accent, ls:3 }); y += 28; }
  }

  // — Age (large) —
  if (hasId('age') && y < tzTop + 55) {
    const a = getVal('age');
    if (a) { elems.push({ key:'age', x:cx, y:tzTop+26, text:a, fs:40, fill:accent, op:0.85 }); y = tzTop+66; }
  }

  // — Years together —
  if (hasId('years')) {
    const yr = getVal('years');
    if (yr) {
      elems.push({ key:'yrs', x:cx, y, text:`${yr} Years Together`, fs:11, fill:accent, ls:0.5 });
      y += 18;
    }
  }

  // — Date —
  if (hasId('date') && y < tzTop + TZ - 20) {
    const d = getVal('date');
    if (d) {
      elems.push({ key:'dt', x:cx, y, text:d, fs:11, fill:accent, ls:1.5, op:0.9 });
      y += 18;
    }
  }

  // — Message / quote —
  if (hasId('msg') && y < tzTop + TZ - 18) {
    const m = getVal('msg');
    if (m) {
      const display = m.length > 42 ? m.slice(0, 42) + '…' : m;
      elems.push({ key:'msg', x:cx, y, text:`"${display}"`, fs:10, fill:'#8A7A6A', fi:'italic' });
      y += 16;
    }
  }

  // — Destination (travel) —
  if (hasId('destination') && y < tzTop + TZ - 18) {
    const dest = getVal('destination');
    if (dest) {
      elems.push({ key:'dest', x:cx, y, text:dest, fs:12, fill:accent, ls:2 });
      y += 18;
    }
  }

  // — Quote/author (for text-only & quote templates) rendered in TextZone only for attribution —
  if (hasId('quote') && hasId('author')) {
    const attr = getVal('author');
    if (attr && y < tzTop + TZ - 15) {
      elems.push({ key:'attr', x:cx, y:Math.min(y, tzTop+TZ-15), text:`— ${attr}`, fs:9, fill:'#8A7A6A', fi:'italic' });
    }
  }

  // — Title —
  if (hasId('title') && !hasId('name') && !hasId('name1') && y < tzTop + TZ - 18) {
    const t = getVal('title');
    if (t) {
      elems.push({ key:'ttl', x:cx, y:tzTop+28, text:t, fs:16, fill:accent });
    }
  }

  // — Word (motivational) —
  if (hasId('word') && y < tzTop + TZ - 18) {
    const w = getVal('word');
    if (w) {
      elems.push({ key:'wrd', x:cx, y:tzTop+28, text:w, fs:20, fill:accent, ls:2 });
    }
  }

  return (
    <g>
      <rect x={0} y={tzTop - 4} width={VW} height={TZ + 4}
        fill={template.previewColors?.[0] || '#E8E0C8'} opacity="0.97"/>
      <line x1={PP + 16} y1={tzTop} x2={VW - PP - 16} y2={tzTop}
        stroke={accent} strokeWidth="0.8" opacity="0.28"/>
      {elems.map(el => (
        <text key={el.key} x={el.x} y={el.y}
          textAnchor="middle"
          fontSize={Math.round(el.fs * scale)}
          fill={el.fill}
          fontFamily={ff}
          fontStyle={fi}
          fontWeight={fw}
          letterSpacing={el.ls || 0}
          opacity={el.op !== undefined ? el.op : 1}
        >{el.text}</text>
      ))}
      <text x={cx} y={VH - 5} textAnchor="middle"
        fontSize="6.5" fill={accent} fontFamily="Georgia,serif" letterSpacing="4" opacity="0.4"
      >JHAYRA</text>
    </g>
  );
}

/* ── Text-only layout: renders quote in photo area ────────────────────────── */
function QuoteArea({ template, texts, accent, bg, scale = 1, fontStyle = 'serif-italic' }) {
  const fields  = template.textFields || [];
  const getVal  = (id) => {
    const v = texts?.[id];
    return (v !== undefined && v !== '') ? v : (fields.find(f => f.id === id)?.defaultValue || '');
  };
  const ff = fontStyle === 'sans' ? 'Arial,Helvetica,sans-serif' : fontStyle === 'classic' ? "'Times New Roman',serif" : 'Georgia,serif';
  const fi = fontStyle === 'serif-italic' || fontStyle === 'classic' ? 'italic' : 'normal';
  const fw = fontStyle === 'serif-bold'   || fontStyle === 'classic' ? 'bold'   : 'normal';

  const raw   = getVal('quote') || getVal('word') || getVal('title') || '';
  const cx    = VW / 2;
  const midY  = PP + PHOTO_H / 2;

  // Word-wrap: max ~28 chars per line
  const words = raw.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (cur === '') { cur = w; continue; }
    if ((cur + ' ' + w).length <= 28) { cur += ' ' + w; }
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);

  const lineH    = 22;
  const totalH   = lines.length * lineH;
  const startY   = midY - totalH / 2 + lineH * 0.7;

  return (
    <g>
      <rect x={PP} y={PP} width={VW - PP * 2} height={PHOTO_H} fill="rgba(0,0,0,0.04)" rx="6"/>
      {/* Ornamental quote mark */}
      <text x={cx} y={startY - 28} textAnchor="middle"
        fontSize={Math.round(40 * scale)} fill={accent} fontFamily={ff} opacity="0.25">"</text>
      {lines.map((line, i) => (
        <text key={i} x={cx} y={startY + i * lineH}
          textAnchor="middle"
          fontSize={Math.round(16 * scale)}
          fill={accent}
          fontFamily={ff}
          fontStyle={fi}
          fontWeight={fw}
        >{line}</text>
      ))}
      <text x={cx} y={startY + lines.length * lineH + 20} textAnchor="middle"
        fontSize={Math.round(40 * scale)} fill={accent} fontFamily={ff} opacity="0.25">"</text>
    </g>
  );
}

/* ── Border / decorative overlays ─────────────────────────────────────────── */
function Decoratives({ decoratives, accent, framed }) {
  const decs = decoratives || [];
  return (
    <g>
      {!framed && decs.includes('gold-border') && (
        <rect x="4" y="4" width={VW-8} height={VH-8}
          fill="none" stroke={accent} strokeWidth="2" rx="3" opacity="0.65"/>
      )}
      {!framed && decs.includes('ornate-border') && (
        <>
          <rect x="4"  y="4"  width={VW-8}  height={VH-8}  fill="none" stroke={accent} strokeWidth="2.5" rx="3" opacity="0.75"/>
          <rect x="11" y="11" width={VW-22} height={VH-22} fill="none" stroke={accent} strokeWidth="0.8" rx="2" opacity="0.45"/>
        </>
      )}
      {!framed && decs.includes('warm-border') && (
        <rect x="4" y="4" width={VW-8} height={VH-8}
          fill="none" stroke="#C8A060" strokeWidth="1.8" rx="3" opacity="0.55"/>
      )}
      {decs.includes('floral-corners') && (
        <>
          {/* Simple corner ornaments */}
          {[
            [12, 12], [VW-12, 12], [12, PP+PHOTO_H-4], [VW-12, PP+PHOTO_H-4]
          ].map(([cx, cy], i) => (
            <text key={i} x={cx} y={cy} textAnchor="middle" fontSize="10"
              fill={accent} fontFamily="Georgia,serif" opacity="0.5">✦</text>
          ))}
        </>
      )}
      {decs.includes('gold-corners') && (
        <>
          {[[8,8],[VW-8,8],[8,VH-10],[VW-8,VH-10]].map(([cx,cy],i) => (
            <text key={i} x={cx} y={cy} textAnchor="middle" fontSize="14"
              fill={accent} fontFamily="Georgia,serif" opacity="0.6">◆</text>
          ))}
        </>
      )}
      {decs.includes('om-symbol') && (
        <text x={VW/2} y={PP+PHOTO_H-10} textAnchor="middle"
          fontSize="20" fill={accent} opacity="0.35" fontFamily="serif">ॐ</text>
      )}
      {decs.includes('moon-stars') && (
        <>
          <path d={`M${VW*0.72} 20 A28 28 0 1 1 ${VW*0.72+26} 46 A18 18 0 1 0 ${VW*0.72} 20Z`}
            fill={accent} opacity="0.28"/>
          {[[18,22],[52,14],[VW-22,18],[VW-50,30],[28,54],[VW-18,54]].map(([x,y],i) => (
            <text key={i} x={x} y={y} textAnchor="middle" fontSize="7"
              fill={accent} opacity="0.4">★</text>
          ))}
        </>
      )}
    </g>
  );
}

/* ── Main exported renderer ───────────────────────────────────────────────── */
export default function TemplateRenderer({ template, photos = {}, texts = {}, fill = false, framed = false, textScale = 1, textFont = 'serif-italic', accentOverride = null, calendarOverride = null, photoTransforms = {} }) {
  if (!template) return null;

  const bg      = template.previewColors?.[0] || '#E8E0C8';
  const accent  = accentOverride ?? (template.previewColors?.[1] || '#B68D40');
  const slots   = template.slots || [];
  const rects   = slotRects(template.layout, template.photoSlots);
  const isTextOnly = template.layout === 'text-only' || template.photoSlots === 0;

  // Separate photo rects from calendar rects
  const photoRects = rects.filter(r => !r.isCalendar);
  const calRects   = rects.filter(r =>  r.isCalendar);

  // Unique clip-path IDs based on template ID (safe for SVG IDs)
  const safeId = template.id.replace(/[^a-zA-Z0-9]/g, '-');

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio={fill ? 'xMidYMid slice' : 'xMidYMid meet'}
      style={{ width:'100%', height:'100%', display:'block' }}
    >
      {/* Background */}
      <rect width={VW} height={VH} fill={bg}/>

      {/* Decorative border/ornaments (behind photos) */}
      <Decoratives decoratives={template.decoratives} accent={accent} framed={framed}/>

      {/* Clip paths for photo slots */}
      <defs>
        {photoRects.map((_, i) => (
          <clipPath key={i} id={`cp-${safeId}-${i}`}>
            <rect x={photoRects[i].x} y={photoRects[i].y}
                  width={photoRects[i].w} height={photoRects[i].h} rx="4"/>
          </clipPath>
        ))}
      </defs>

      {/* Text-only: show quote in center of photo area */}
      {isTextOnly && (
        <QuoteArea template={template} texts={texts} accent={accent} bg={bg} scale={textScale} fontStyle={textFont}/>
      )}

      {/* Photo slots */}
      {!isTextOnly && photoRects.map((rect, i) => {
        const slot     = slots[i];
        const photoUrl = slot ? (photos[slot.id] || null) : null;

        if (photoUrl) {
          const slotId   = slot?.id;
          const transform = slotId ? (photoTransforms[slotId] || null) : null;

          let imgX = rect.x, imgY = rect.y, imgW = rect.w, imgH = rect.h;
          if (transform) {
            const { zoom = 1, panX = 0, panY = 0 } = transform;
            imgW = rect.w * zoom;
            imgH = rect.h * zoom;
            imgX = rect.x - (imgW - rect.w) / 2 + panX * rect.w;
            imgY = rect.y - (imgH - rect.h) / 2 + panY * rect.h;
          }

          return (
            <image
              key={i}
              href={photoUrl}
              x={imgX} y={imgY}
              width={imgW} height={imgH}
              clipPath={`url(#cp-${safeId}-${i})`}
              preserveAspectRatio="xMidYMid slice"
            />
          );
        }

        // Placeholder
        const label = slot?.label || `Photo ${i + 1}`;
        const required = slot?.required !== false;
        return (
          <g key={i}>
            <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h}
              fill="rgba(0,0,0,0.1)" rx="4"/>
            {/* Camera icon */}
            <rect x={rect.x+rect.w/2-10} y={rect.y+rect.h/2-14} width="20" height="15"
              rx="3" fill="rgba(255,255,255,0.18)"/>
            <circle cx={rect.x+rect.w/2} cy={rect.y+rect.h/2-7} r="4"
              fill="rgba(255,255,255,0.12)"/>
            {/* Slot label */}
            {rect.h > 60 && (
              <text x={rect.x+rect.w/2} y={rect.y+rect.h/2+16}
                textAnchor="middle"
                fontSize={Math.min(10, rect.w * 0.07)}
                fill="rgba(255,255,255,0.45)"
                fontFamily="Arial,sans-serif"
              >{label}{required ? ' *' : ''}</text>
            )}
          </g>
        );
      })}

      {/* Calendar blocks */}
      {calRects.map((rect, i) => (
        <CalendarBlock key={`cal-${i}`} rect={rect} calendar={calendarOverride || template.calendar} accent={accent}/>
      ))}

      {/* Text zone (names, date, message) */}
      <TextZone template={template} texts={texts} accent={accent} scale={textScale} fontStyle={textFont}/>
    </svg>
  );
}
