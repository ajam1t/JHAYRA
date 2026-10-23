import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Frame from '../components/Frame';
import TemplateCanvas from '../components/TemplateCanvas';
import Icon from '../components/Icon';
import { IDENTITY, ZoomControls } from '../components/PanZoom';
import WallStudio from '../components/WallStudio';
import { Seo } from '../lib/seo';
import { useTemplates, LAYOUTS, DECORATIONS, slotsFor } from '../lib/templates';
import { SIZES, customColours, customOption, colourHex } from '../lib/frames';
import { readPhoto, uploadArtwork, QUALITY_LABEL } from '../lib/upload';
import { useCart } from '../state/cart';
import { useToast } from '../state/store';
import { money, waLink } from '../lib/site';

const PALETTES = [
  { color: '#F3EADB', accent: '#B68D40', label: 'Ivory gold' },
  { color: '#F5E1E6', accent: '#B64060', label: 'Rose' },
  { color: '#E2ECE4', accent: '#3F7A55', label: 'Sage' },
  { color: '#E3E9F4', accent: '#2E4F8A', label: 'Ocean' },
  { color: '#FBEBD6', accent: '#C07010', label: 'Marigold' },
  { color: '#141828', accent: '#9090D0', label: 'Midnight' },
  { color: '#2A1712', accent: '#E0B060', label: 'Royal' },
];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function scratchTemplate(d) {
  return {
    id: 'scratch',
    title: 'Your own design',
    group: 'scratch',
    layout: d.layout,
    slots: slotsFor(d.layout, d.layout === 'text-only' ? 0 : d.count),
    hasCalendar: d.layout.startsWith('calendar'),
    calendar: null,
    textFields: d.lines.map((l, i) => ({ id: l.id, label: l.label, defaultValue: l.placeholder, maxChars: i === 0 ? 30 : 60, required: false })),
    decoratives: d.decor,
    colors: { color: d.palette.color, accent: d.palette.accent },
  };
}

const DEFAULT_SCRATCH = {
  layout: 'four-grid',
  count: 4,
  lines: [
    { id: 'name', label: 'Headline', placeholder: 'The Sharma Family' },
    { id: 'date', label: 'Date or place', placeholder: 'Diwali 2026 · Jaipur' },
    { id: 'msg', label: 'Message', placeholder: 'Home is wherever we’re together' },
  ],
  decor: ['gold-border'],
  palette: PALETTES[0],
};

export default function TemplateEditor({ scratch = false }) {
  const { templateId } = useParams();
  const [params] = useSearchParams();
  const { map, active } = useTemplates();
  const navigate = useNavigate();
  const cart = useCart();
  const toast = useToast();
  const [design, setDesign] = useState(DEFAULT_SCRATCH);
  const base = scratch ? scratchTemplate(design) : map[templateId];

  const [tab, setTab] = useState(scratch ? 'design' : 'photos');
  const [photos, setPhotos] = useState({});
  const [transforms, setTransforms] = useState({});
  const [texts, setTexts] = useState({});
  const [cal, setCal] = useState(null);
  const [activeSlot, setActiveSlot] = useState(null);
  const [sizeName, setSizeName] = useState('A3+');
  const [colour, setColour] = useState('Black');
  const [orientation, setOrientation] = useState('Vertical');
  const [busy, setBusy] = useState(false);
  const [wall, setWall] = useState(false);
  const fileRef = useRef(null);
  const pendingSlot = useRef(null);

  useEffect(() => {
    if (!base) return;
    // Links can pre-fill text, e.g. /customize/tmpl-name-aarav?text.name=Myra
    setTexts((t) => (Object.keys(t).length ? t : Object.fromEntries(base.textFields.map((f) => [f.id, (params.get(`text.${f.id}`) ?? f.defaultValue ?? '').slice(0, f.maxChars || 80)]))));
    if (base.calendar && !cal) setCal({ ...base.calendar });
    if (base.hasCalendar && !base.calendar && !cal) setCal({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), highlightDate: new Date().getDate() });
  }, [base?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (scratch && design.layout.startsWith('calendar') && !cal) setCal({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), highlightDate: new Date().getDate() });
  }, [scratch, design.layout, cal]);

  const colours = customColours(sizeName);
  useEffect(() => {
    if (!colours.includes(colour)) setColour(colours[0]);
  }, [sizeName]); // eslint-disable-line react-hooks/exhaustive-deps
  const option = customOption(sizeName, colour);
  const size = SIZES.find((s) => s.name === sizeName);

  const slots = base?.slots || [];
  const required = slots.filter((s) => s.required);
  const missing = required.filter((s) => !photos[s.id]);
  const srcs = useMemo(() => Object.fromEntries(Object.entries(photos).map(([k, v]) => [k, v.url])), [photos]);

  if (!base)
    return (
      <div className="wrap section center">
        <h1 className="h2">Design not found</h1>
        <Link to="/customize" className="btn" style={{ marginTop: 22 }}>
          Browse all designs
        </Link>
      </div>
    );

  const addFiles = async (files, startSlot) => {
    const list = [...files];
    const order = slots.map((s) => s.id);
    let i = startSlot ? order.indexOf(startSlot) : order.findIndex((id) => !photos[id]);
    if (i < 0) i = 0;
    const next = { ...photos };
    for (const f of list) {
      while (i < order.length && next[order[i]] && !(startSlot && order[i] === startSlot)) i++;
      if (i >= order.length) break;
      try {
        const p = await readPhoto(f);
        next[order[i]] = p;
        setTransforms((t) => ({ ...t, [order[i]]: IDENTITY }));
        if (p.quality === 'low') toast(`${slots[i].label}: low resolution — it may look soft at large sizes`, 'warn');
        startSlot = null;
        i++;
      } catch (e) {
        toast(e.message, 'warn');
      }
    }
    setPhotos(next);
  };

  const onSlot = (id, empty) => {
    setActiveSlot(id);
    setTab('photos');
    if (empty) {
      pendingSlot.current = id;
      fileRef.current?.click();
    }
  };

  const addToCart = async () => {
    if (missing.length) {
      toast(`Please add: ${missing.map((m) => m.label).join(', ')}`, 'warn');
      setTab('photos');
      return;
    }
    if (!option) return;
    setBusy(true);
    try {
      const filled = slots.filter((s) => photos[s.id]);
      const up = await uploadArtwork(filled.map((s) => ({ file: photos[s.id].file, name: photos[s.id].name, width: photos[s.id].width, height: photos[s.id].height })));
      if (up.uploaded < up.requested) {
        toast('Some photos failed to upload — please try again.', 'warn');
        return;
      }
      const names = texts.name1 && texts.name2 ? `${texts.name1} & ${texts.name2}` : texts.name || '';
      const label = [base.title, [names, texts.date].filter(Boolean).join(' • ')].filter(Boolean).join(' — ');
      const allTexts = cal ? { ...texts, calendar: `${MONTHS[(cal.month || 1) - 1]} ${cal.year}${cal.highlightDate ? ` · ${cal.highlightDate}` : ''}` } : texts;
      cart.add({
        productId: 'custom',
        name: label,
        image: '',
        preview: photos[slots[0]?.id]?.thumb || '',
        price: option.price,
        category: 'personalized',
        colourHex: colourHex(colour),
        option,
        orientation,
        artworkPaths: up.paths,
        customization: {
          source: 'template',
          templateId: base.id,
          templateTitle: base.title,
          texts: allTexts,
          orientation,
          transforms: Object.fromEntries(filled.map((s) => [s.id, transforms[s.id] || IDENTITY])),
          artworkMeta: up.meta,
          ...(scratch ? { design: { layout: design.layout, photos: slots.length, decorations: design.decor, palette: design.palette.label, lines: design.lines.map((l) => l.label) } } : {}),
        },
      });
    } finally {
      setBusy(false);
    }
  };

  const canvas = <TemplateCanvas template={base} photos={srcs} transforms={transforms} texts={texts} calendar={cal} active={activeSlot} editable onSlot={onSlot} onTransform={(id, v) => setTransforms((t) => ({ ...t, [id]: v }))} />;

  const setLayout = (id) => {
    const l = LAYOUTS.find((x) => x.id === id);
    setDesign((d) => ({ ...d, layout: id, count: l.slots }));
  };
  const setCount = (n) => {
    const target = Math.max(1, Math.min(9, n));
    const byCount = { 1: 'single', 2: 'pair', 3: 'three-col', 4: 'four-grid', 5: 'five-1main', 6: 'six-grid', 7: 'nine-grid', 8: 'nine-grid', 9: 'nine-grid' };
    setDesign((d) => ({ ...d, count: target, layout: d.layout.startsWith('calendar') && target <= 4 ? d.layout : byCount[target] }));
  };

  return (
    <>
      <Seo title={scratch ? 'Design Your Own Photo Frame' : `${base.title} — Personalised Frame`} description={scratch ? 'Design a personalised frame from scratch: choose a layout, up to 9 photos, your words, colours and decorations.' : `${base.description || base.subtitle} Personalise it live with your photos and names. From ${money(SIZES[0].price)}, free delivery.`} path={scratch ? '/customize/scratch' : `/customize/${base.id}`} />
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden>/</span>
          <Link to="/customize">Personalise</Link>
          <span aria-hidden>/</span>
          <span>{base.title}</span>
        </nav>
      </div>
      <section className="wrap editor">
        <div className="editor-stage">
          <div className="editor-wall">
            <div className="editor-frame" style={{ width: orientation === 'Horizontal' ? '86%' : `${Math.min(74, 40 + size.h * 1.1)}%` }}>
              <Frame ratio={{ w: size.w, h: size.h }} orientation={orientation} colour={colourHex(colour)} thickness={3.6}>
                {canvas}
              </Frame>
            </div>
          </div>
          {activeSlot && photos[activeSlot] && (
            <div className="editor-adjust">
              <span className="small">
                <b>{slots.find((s) => s.id === activeSlot)?.label}</b> — drag to move
              </span>
              <ZoomControls value={transforms[activeSlot] || IDENTITY} onChange={(v) => setTransforms((t) => ({ ...t, [activeSlot]: v }))} />
              <button className="chip" onClick={() => setActiveSlot(null)}>
                Done
              </button>
            </div>
          )}
          <div className="editor-stage-actions">
            <button className="chip" onClick={() => setOrientation((o) => (o === 'Vertical' ? 'Horizontal' : 'Vertical'))}>
              <Icon name="rotate" size={15} /> {orientation === 'Vertical' ? 'Portrait' : 'Landscape'}
            </button>
            <button className="chip" onClick={() => setWall(true)}>
              <Icon name="sofa" size={15} /> See it on a wall
            </button>
          </div>
        </div>

        <div className="editor-panel">
          <span className="eyebrow">{scratch ? 'From scratch' : 'Personalise'}</span>
          <h1 className="h2" style={{ margin: '10px 0 6px' }}>
            {base.title}
          </h1>
          {!scratch && <p className="muted">{base.subtitle}</p>}
          <div className="editor-tabs" role="tablist">
            {(scratch ? ['design', 'photos', 'words', 'frame'] : ['photos', 'words', 'frame']).map((t, i) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
                <span>{i + 1}</span> {t === 'design' ? 'Layout' : t === 'photos' ? `Photos${slots.length ? ` ${Object.keys(photos).length}/${slots.length}` : ''}` : t === 'words' ? 'Words' : 'Size & frame'}
              </button>
            ))}
          </div>

          {tab === 'design' && scratch && (
            <div className="editor-sec">
              <label className="editor-label">Layout</label>
              <div className="layout-grid">
                {LAYOUTS.map((l) => (
                  <button key={l.id} className={`layout-opt ${design.layout === l.id ? 'on' : ''}`} onClick={() => setLayout(l.id)}>
                    <span className={`lay lay-${l.id}`} aria-hidden="true">
                      {Array.from({ length: Math.max(1, l.slots) }, (_, i) => (
                        <i key={i} />
                      ))}
                    </span>
                    {l.label}
                  </button>
                ))}
              </div>
              {design.layout !== 'text-only' && (
                <div className="editor-row">
                  <label className="editor-label">Photos</label>
                  <div className="stepper">
                    <button onClick={() => setCount(design.count - 1)} aria-label="Remove a photo slot">
                      <Icon name="minus" size={16} />
                    </button>
                    <b>{design.count}</b>
                    <button onClick={() => setCount(design.count + 1)} aria-label="Add a photo slot">
                      <Icon name="plus" size={16} />
                    </button>
                  </div>
                </div>
              )}
              <label className="editor-label">Colours</label>
              <div className="swatches">
                {PALETTES.map((p) => (
                  <button key={p.label} className={`swatch ${design.palette.label === p.label ? 'on' : ''}`} style={{ background: `linear-gradient(135deg, ${p.color} 50%, ${p.accent} 50%)` }} aria-label={p.label} aria-pressed={design.palette.label === p.label} onClick={() => setDesign((d) => ({ ...d, palette: p }))} />
                ))}
              </div>
              <label className="editor-label">Decorations</label>
              <div className="chips">
                {DECORATIONS.map(([id, label]) => (
                  <button key={id} className="chip" aria-pressed={design.decor.includes(id)} onClick={() => setDesign((d) => ({ ...d, decor: d.decor.includes(id) ? d.decor.filter((x) => x !== id) : [...d.decor, id] }))}>
                    {label}
                  </button>
                ))}
              </div>
              <button className="btn btn-block" style={{ marginTop: 22 }} onClick={() => setTab('photos')}>
                Next: add photos <Icon name="arrow" size={16} />
              </button>
            </div>
          )}

          {tab === 'photos' && (
            <div className="editor-sec">
              {slots.length === 0 ? (
                <p className="muted">This design is words only — head to the next step.</p>
              ) : (
                <>
                  <button className="dropzone" onClick={() => ((pendingSlot.current = null), fileRef.current?.click())}>
                    <Icon name="upload" size={22} />
                    <b>Add photos</b>
                    <small>Select several at once — we’ll fill the empty spots in order</small>
                  </button>
                  <ul className="slot-list">
                    {slots.map((s) => {
                      const p = photos[s.id];
                      return (
                        <li key={s.id} className={activeSlot === s.id ? 'on' : ''}>
                          <button className="slot-thumb" onClick={() => onSlot(s.id, !p)} aria-label={p ? `Adjust ${s.label}` : `Add ${s.label}`}>
                            {p ? <img src={p.url} alt="" /> : <Icon name="plus" size={18} />}
                          </button>
                          <div className="grow">
                            <b>
                              {s.label} {s.required && !p && <span className="req">required</span>}
                            </b>
                            {p ? <small className={`q-${QUALITY_LABEL[p.quality]?.tone}`}>{QUALITY_LABEL[p.quality]?.text}</small> : <small className="muted">Tap to add</small>}
                          </div>
                          {p && (
                            <>
                              <button className="chip" onClick={() => ((pendingSlot.current = s.id), fileRef.current?.click())}>
                                Replace
                              </button>
                              <button
                                className="icon-btn"
                                aria-label={`Remove ${s.label}`}
                                onClick={() => {
                                  setPhotos((x) => {
                                    const n = { ...x };
                                    delete n[s.id];
                                    return n;
                                  });
                                  if (activeSlot === s.id) setActiveSlot(null);
                                }}
                              >
                                <Icon name="trash" size={18} />
                              </button>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <p className="small muted">Tip: tap a photo on the frame to drag and zoom it.</p>
                </>
              )}
              <button className="btn btn-block" style={{ marginTop: 18 }} onClick={() => setTab('words')}>
                Next: your words <Icon name="arrow" size={16} />
              </button>
            </div>
          )}

          {tab === 'words' && (
            <div className="editor-sec">
              {base.textFields.map((f, i) => (
                <div className="field" key={f.id} style={{ marginBottom: 14 }}>
                  <label htmlFor={`tf-${f.id}`}>
                    {scratch ? (
                      <input
                        className="line-label"
                        value={design.lines[i]?.label || f.label}
                        onChange={(e) => setDesign((d) => ({ ...d, lines: d.lines.map((l, j) => (j === i ? { ...l, label: e.target.value } : l)) }))}
                        aria-label="Line name"
                      />
                    ) : (
                      f.label
                    )}
                    <span className="muted small" style={{ float: 'right' }}>
                      {(texts[f.id] || '').length}/{f.maxChars || 40}
                    </span>
                  </label>
                  <div className="row">
                    <input id={`tf-${f.id}`} className="input" maxLength={f.maxChars || 40} value={texts[f.id] ?? ''} placeholder={f.defaultValue} onChange={(e) => setTexts((t) => ({ ...t, [f.id]: e.target.value }))} />
                    {scratch && design.lines.length > 1 && (
                      <button
                        className="icon-btn"
                        aria-label="Remove this line"
                        onClick={() => {
                          setDesign((d) => ({ ...d, lines: d.lines.filter((_, j) => j !== i) }));
                          setTexts((t) => {
                            const n = { ...t };
                            delete n[f.id];
                            return n;
                          });
                        }}
                      >
                        <Icon name="trash" size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {scratch && design.lines.length < 5 && (
                <button className="chip" onClick={() => setDesign((d) => ({ ...d, lines: [...d.lines, { id: `line${Date.now().toString(36)}`, label: 'New line', placeholder: 'Your words here' }] }))}>
                  <Icon name="plus" size={15} /> Add a line of text
                </button>
              )}
              {cal && (
                <div className="cal-edit">
                  <label className="editor-label">Calendar</label>
                  <div className="row">
                    <select className="select" value={cal.month} onChange={(e) => setCal((c) => ({ ...c, month: +e.target.value }))} aria-label="Month">
                      {MONTHS.map((m, i) => (
                        <option key={m} value={i + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <input className="input" type="number" min="1950" max="2100" value={cal.year} onChange={(e) => setCal((c) => ({ ...c, year: +e.target.value }))} aria-label="Year" />
                    <input className="input" type="number" min="1" max="31" value={cal.highlightDate || ''} placeholder="Day" onChange={(e) => setCal((c) => ({ ...c, highlightDate: +e.target.value || null }))} aria-label="Highlighted day" />
                  </div>
                </div>
              )}
              <p className="small muted" style={{ marginTop: 14 }}>
                Please double-check spellings and dates — we print exactly what you type.
              </p>
              <button className="btn btn-block" style={{ marginTop: 18 }} onClick={() => setTab('frame')}>
                Next: size & frame <Icon name="arrow" size={16} />
              </button>
            </div>
          )}

          {tab === 'frame' && (
            <div className="editor-sec">
              <label className="editor-label">Size</label>
              <div className="size-grid">
                {SIZES.map((s) => (
                  <button key={s.slug} className={`size-card ${s.name === sizeName ? 'on' : ''}`} onClick={() => setSizeName(s.name)} aria-pressed={s.name === sizeName}>
                    <span className="size-icon" style={{ width: (s.w * 26) / 36, height: (s.h * 26) / 36 }} aria-hidden="true" />
                    <b>{s.name}</b>
                    <small>{money(s.price)}</small>
                  </button>
                ))}
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
          )}

          <div className="editor-buy">
            <div>
              <b>{money(option?.price || 0)}</b>
              <small>
                {sizeName} · {colour} · free delivery
              </small>
            </div>
            <button className="btn btn-gold btn-lg" disabled={busy} onClick={addToCart}>
              {busy ? 'Uploading photos…' : missing.length ? `Add ${missing.length} more photo${missing.length > 1 ? 's' : ''}` : 'Add to cart'}
            </button>
          </div>
          <a className="pdp-help" href={waLink(`Hi JHAYRA! I'm designing "${base.title}" and need help.`)} target="_blank" rel="noopener noreferrer">
            Want us to design it for you? <b>Send your photos on WhatsApp →</b>
          </a>
          {!scratch && (
            <div className="editor-more">
              <span className="small muted">Similar designs</span>
              <div className="chips">
                {active
                  .filter((t) => t.group === base.group && t.id !== base.id)
                  .slice(0, 6)
                  .map((t) => (
                    <button key={t.id} className="chip" onClick={() => navigate(`/customize/${t.id}`)}>
                      {t.title}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </section>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const files = e.target.files;
          if (files?.length) addFiles(files, pendingSlot.current);
          e.target.value = '';
        }}
      />
      {wall && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="See it on a wall">
          <div className="scrim" onClick={() => setWall(false)} />
          <div className="modal-panel" style={{ padding: 18 }}>
            <button className="icon-btn modal-close" onClick={() => setWall(false)} aria-label="Close">
              <Icon name="close" />
            </button>
            <WallStudio wIn={orientation === 'Horizontal' ? size.h : size.w} hIn={orientation === 'Horizontal' ? size.w : size.h} colour={colourHex(colour)}>
              <TemplateCanvas template={base} photos={srcs} transforms={transforms} texts={texts} calendar={cal} />
            </WallStudio>
          </div>
        </div>
      )}
    </>
  );
}
