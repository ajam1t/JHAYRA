import { templatesSnapshot } from '../lib/templates';
import PanZoom from './PanZoom';
import Icon from './Icon';

const HERO_KEYS = ['quote', 'title', 'word', 'deity', 'letter', 'name'];
const MSG_KEYS = ['msg'];
const ATTR_KEYS = ['attr', 'author'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const AREAS = {
  single: { cols: '1fr', rows: '1fr', areas: ['a'] },
  pair: { cols: '1fr 1fr', rows: '1fr', areas: ['a b'] },
  'three-col': { cols: '1fr 1fr 1fr', rows: '1fr', areas: ['a b c'] },
  'four-grid': { cols: '1fr 1fr', rows: '1fr 1fr', areas: ['a b', 'c d'] },
  'five-1main': { cols: '1fr 1fr 1fr 1fr', rows: '2.2fr 1fr', areas: ['a a a a', 'b c d e'] },
  'five-main-row': { cols: '1.6fr 1fr 1fr', rows: '1fr 1fr', areas: ['a b c', 'a d e'] },
  'six-grid': { cols: '1fr 1fr 1fr', rows: '1fr 1fr', areas: ['a b c', 'd e f'] },
  'nine-grid': { cols: '1fr 1fr 1fr', rows: '1fr 1fr 1fr', areas: ['a b c', 'd e f', 'g h i'] },
  'calendar-1': { cols: '1fr', rows: '1fr', areas: ['a'] },
  'calendar-multi': { cols: '1fr 1fr', rows: '1fr 1fr', areas: ['a b', 'c d'] },
};
const LETTERS = 'abcdefghi';

function areasFor(layout, n) {
  if (layout === 'calendar-1' && n === 2) return { cols: '1fr 1fr', rows: '1fr', areas: ['a b'] };
  if (layout === 'calendar-multi' && n === 6) return { cols: '1fr 1fr 1fr', rows: '1fr 1fr', areas: ['a b c', 'd e f'] };
  return AREAS[layout] || AREAS.single;
}

function composeText(t, texts) {
  const val = (id) => {
    let v = texts?.[id];
    if (v === undefined) v = t.textFields.find((f) => f.id === id)?.defaultValue || '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) v = new Date(v + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    return v;
  };
  const ids = t.textFields.map((f) => f.id);
  let hero = '';
  const used = new Set();
  if (ids.includes('name1') && ids.includes('name2')) {
    hero = [val('name1'), val('name2')].filter(Boolean).join(' & ');
    used.add('name1').add('name2');
  } else {
    const k = HERO_KEYS.find((k) => ids.includes(k));
    if (k) {
      hero = val(k);
      used.add(k);
    }
  }
  const msg = MSG_KEYS.filter((k) => ids.includes(k)).map(val).filter(Boolean).join(' ');
  const attr = ATTR_KEYS.filter((k) => ids.includes(k)).map(val).filter(Boolean).join(', ');
  MSG_KEYS.concat(ATTR_KEYS).forEach((k) => used.add(k));
  const sub = ids.filter((k) => !used.has(k)).map(val).filter(Boolean).join('  ·  ');
  if (!hero && sub) return { hero: sub, sub: '', msg, attr };
  return { hero, sub, msg, attr };
}

function Calendar({ cal, accent, dark }) {
  const month = Math.max(1, Math.min(12, +cal.month || 1));
  const year = +cal.year || new Date().getFullYear();
  const first = new Date(year, month - 1, 1).getDay();
  const days = new Date(year, month, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  return (
    <div className="tc-cal" style={{ '--acc': accent, color: dark ? '#e9e4ff' : '#2a2018' }}>
      <div className="tc-cal-head">
        {MONTHS[month - 1]} {year}
      </div>
      <div className="tc-cal-grid">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <b key={i}>{d}</b>
        ))}
        {cells.map((d, i) => (
          <span key={i} className={d && d === +cal.highlightDate ? 'hl' : ''}>
            {d || ''}
          </span>
        ))}
      </div>
    </div>
  );
}

function Decor({ list, accent, dark }) {
  const has = (k) => list.includes(k);
  const border = has('gold-border') || has('ornate-border') || has('warm-border') || has('gold-accent') || has('polaroid-frame');
  const corners = has('floral-corners') || has('gold-corners') || has('floral') || has('soft-floral') || has('laurel');
  const glyph =
    (has('hearts') && '♥') ||
    (has('om-symbol') && 'ॐ') ||
    (has('stars') && '✦') ||
    (has('paw-print') && '❖') ||
    (has('diya') && '✺') ||
    (has('marigold') && '❀') ||
    (has('confetti') && '✶') ||
    (has('balloons') && '◉') ||
    (has('map-pin') && '⌖') ||
    (has('timeline-dots') && '•') ||
    null;
  return (
    <div className="tc-decor" aria-hidden="true" style={{ '--acc': accent }}>
      {border && <span className={`tc-border ${has('ornate-border') ? 'double' : ''}`} />}
      {corners &&
        ['tl', 'tr', 'bl', 'br'].map((c) => (
          <svg key={c} className={`tc-corner ${c}`} viewBox="0 0 40 40">
            <path d="M2 30 C2 14 14 2 30 2 M2 20 C6 10 10 6 20 2 M8 8 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        ))}
      {has('moon-stars') && (
        <svg className="tc-moon" viewBox="0 0 100 100">
          <path d="M62 14a34 34 0 1 0 24 58A28 28 0 1 1 62 14z" fill={dark ? '#f3e9c6' : 'currentColor'} opacity=".95" />
          {[
            [18, 20, 1.6],
            [30, 8, 1.1],
            [8, 46, 1.2],
            [92, 30, 1.3],
            [80, 90, 1],
            [14, 84, 1.4],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity=".9" />
          ))}
        </svg>
      )}
      {glyph && (
        <>
          <span className="tc-glyph g1">{glyph}</span>
          <span className="tc-glyph g2">{glyph}</span>
        </>
      )}
    </div>
  );
}

/**
 * Renders a personalised template (photos + text + ornaments) inside a frame.
 * In edit mode, empty slots are buttons and filled slots can be dragged & zoomed.
 */
export default function TemplateCanvas({ template: t, photos = {}, transforms = {}, texts = {}, calendar, active, onSlot, onTransform, editable = false, mini = false }) {
  const g = templatesSnapshot().groupMap[t.group] || t.colors || { color: '#F0EBE2', accent: '#B68D40' };
  const dark = t.group === 'moon-style' || /^#[0-3]/.test(g.color);
  const { hero, sub, msg, attr } = composeText(t, texts);
  const slots = t.slots || [];
  const grid = areasFor(t.layout, slots.length);
  const cal = calendar || t.calendar;
  const showCal = t.hasCalendar || t.layout.startsWith('calendar');
  const textOnly = t.layout === 'text-only' || slots.length === 0;
  const [c1, c2] = t.previewColors || [];

  return (
    <div
      className={`tc ${mini ? 'tc-mini' : ''} ${dark ? 'tc-dark' : ''} ${textOnly ? 'tc-textonly' : ''}`}
      style={{ '--bg': dark ? g.color : '#FBF8F2', '--tint': g.color, '--acc': g.accent, '--c1': c1 || g.accent, '--c2': c2 || g.color }}
    >
      <Decor list={t.decoratives || []} accent={g.accent} dark={dark} />
      {!textOnly && (
        <div className="tc-photos" style={{ gridTemplateColumns: grid.cols, gridTemplateRows: grid.rows, gridTemplateAreas: grid.areas.map((r) => `"${r}"`).join(' ') }}>
          {slots.map((s, i) => {
            const src = photos[s.id];
            const isActive = active === s.id;
            return (
              <div key={s.id} className={`tc-slot ${isActive ? 'active' : ''} ${src ? 'filled' : ''}`} style={{ gridArea: LETTERS[i] }}>
                {src ? (
                  <>
                    <PanZoom src={src} value={transforms[s.id]} onChange={(v) => onTransform?.(s.id, v)} editable={editable && isActive} alt={s.label} />
                    {editable && !isActive && <button type="button" className="tc-slot-hit" onClick={() => onSlot?.(s.id)} aria-label={`Adjust ${s.label}`} />}
                  </>
                ) : editable ? (
                  <button type="button" className="tc-empty" onClick={() => onSlot?.(s.id, true)}>
                    <Icon name="plus" size={mini ? 12 : 20} />
                    {!mini && <span>{s.label}</span>}
                  </button>
                ) : (
                  <div className="tc-empty tc-ph" aria-hidden="true" style={{ '--n': i }} />
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className="tc-text">
        {showCal && cal && <Calendar cal={cal} accent={g.accent} dark={dark} />}
        {hero && <div className="tc-hero">{hero}</div>}
        {sub && <div className="tc-sub">{sub}</div>}
        {msg && <div className="tc-msg">{msg}</div>}
        {attr && <div className="tc-attr">— {attr}</div>}
        {!mini && <div className="tc-brand">JHAYRA</div>}
      </div>
    </div>
  );
}
