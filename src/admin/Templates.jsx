import { useEffect, useMemo, useState } from 'react';
import Frame from '../components/Frame';
import TemplateCanvas from '../components/TemplateCanvas';
import { useTemplates, saveTemplates, loadTemplates, LAYOUTS, DECORATIONS, slotsFor } from '../lib/templates';

const uid = () => `tmpl-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const csv = (a) => (a || []).join(', ');
const uncsv = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

export default function Templates() {
  const store = useTemplates();
  const [groups, setGroups] = useState(store.groups);
  const [list, setList] = useState(store.templates);
  const [sel, setSel] = useState(store.templates[0]?.id);
  const [q, setQ] = useState('');
  const [g, setG] = useState('');
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadTemplates(true).then((s) => {
      setGroups(s.groups);
      setList(s.templates);
      setSel((x) => x || s.templates[0]?.id);
    });
  }, []);

  const t = list.find((x) => x.id === sel);
  const shown = useMemo(() => list.filter((x) => (!g || x.group === g) && (!q || [x.title, x.id, x.group].join(' ').toLowerCase().includes(q.toLowerCase()))), [list, g, q]);
  const update = (patch) => {
    setList((l) => l.map((x) => (x.id === sel ? { ...x, ...patch } : x)));
    setDirty(true);
  };
  const setField = (i, patch) => update({ textFields: t.textFields.map((f, j) => (j === i ? { ...f, ...patch } : f)) });

  const publish = async () => {
    setBusy(true);
    setErr('');
    try {
      const ordered = list.map((x, i) => ({ ...x, sortOrder: i + 1 }));
      await saveTemplates({ groups, templates: ordered });
      setList(ordered);
      setDirty(false);
      setMsg(`Published ${ordered.length} templates — live on the site now.`);
      setTimeout(() => setMsg(''), 4000);
    } catch (x) {
      setErr(`Could not publish: ${x.message}. Make sure you're signed in as an admin.`);
    } finally {
      setBusy(false);
    }
  };
  const create = (base) => {
    const id = uid();
    const n = base
      ? { ...JSON.parse(JSON.stringify(base)), id, title: `${base.title} (copy)` }
      : {
          id,
          title: 'New design',
          group: groups[0]?.id || 'family',
          subtitle: '',
          description: '',
          occasion: [],
          recipient: [],
          layout: 'single',
          photoSlots: 1,
          slots: slotsFor('single'),
          hasCalendar: false,
          calendar: null,
          textFields: [{ id: 'name', label: 'Name', defaultValue: 'Your name', maxChars: 30, required: true }],
          decoratives: ['gold-border'],
          popular: false,
          newArrival: true,
          bestSeller: false,
          status: 'inactive',
          startingPrice: 499,
        };
    const i = base ? list.findIndex((x) => x.id === base.id) + 1 : 0;
    setList((l) => [...l.slice(0, i), n, ...l.slice(i)]);
    setSel(id);
    setDirty(true);
  };
  const remove = () => {
    if (!confirm(`Delete “${t.title}”? (Tip: set it to Hidden instead if you may want it back.)`)) return;
    const i = list.findIndex((x) => x.id === sel);
    setList((l) => l.filter((x) => x.id !== sel));
    setSel(list[i + 1]?.id || list[i - 1]?.id);
    setDirty(true);
  };
  const move = (d) => {
    const i = list.findIndex((x) => x.id === sel);
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const n = [...list];
    [n[i], n[j]] = [n[j], n[i]];
    setList(n);
    setDirty(true);
  };
  const setLayout = (layout, count) => {
    const l = LAYOUTS.find((x) => x.id === layout);
    const c = layout === 'text-only' ? 0 : count ?? l.slots;
    const slots = slotsFor(layout, c).map((s, i) => t.slots?.[i] ? { ...s, label: t.slots[i].label, required: t.slots[i].required } : s);
    update({ layout, slots, photoSlots: c, hasCalendar: layout.startsWith('calendar'), calendar: layout.startsWith('calendar') ? t.calendar || { month: 1, year: new Date().getFullYear(), highlightDate: null, visible: true } : t.calendar });
  };

  return (
    <>
      <div className="ad-row-between">
        <h1 className="ad-h1">Personalised templates ({list.length})</h1>
        <div className="ad-toolbar" style={{ margin: 0 }}>
          <button className="ad-btn" onClick={() => create()}>
            + New design
          </button>
          <button className="ad-btn ad-btn-primary" disabled={!dirty || busy} onClick={publish}>
            {busy ? 'Publishing…' : dirty ? 'Publish changes' : 'All changes live'}
          </button>
        </div>
      </div>
      {msg && <div className="ad-ok">{msg}</div>}
      {err && <div className="ad-err">{err}</div>}
      <div className="ad-tmpl">
        <aside className="ad-card ad-tmpl-list">
          <input className="ad-input" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="ad-input" value={g} onChange={(e) => setG(e.target.value)}>
            <option value="">All groups</option>
            {groups.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
          <ul>
            {shown.map((x) => (
              <li key={x.id} className={x.id === sel ? 'on' : ''} onClick={() => setSel(x.id)}>
                <b>{x.title}</b>
                <small>
                  {x.group} · {x.slots?.length || 0} photos {x.status === 'inactive' && '· hidden'}
                </small>
              </li>
            ))}
          </ul>
        </aside>
        {t && (
          <div className="ad-tmpl-edit">
            <div className="ad-card ad-tmpl-preview">
              <div style={{ width: 260 }}>
                <Frame ratio={{ w: 12, h: 16 }} colour="#B8932A">
                  <TemplateCanvas template={t} />
                </Frame>
              </div>
              <div className="ad-toolbar" style={{ justifyContent: 'center' }}>
                <button className="ad-btn" onClick={() => move(-1)}>
                  ↑ Earlier
                </button>
                <button className="ad-btn" onClick={() => move(1)}>
                  ↓ Later
                </button>
                <button className="ad-btn" onClick={() => create(t)}>
                  Duplicate
                </button>
                <button className="ad-btn" onClick={remove}>
                  Delete
                </button>
              </div>
            </div>
            <div className="ad-card ad-form">
              <div className="ad-grid2">
                <label className="ad-field">
                  Title
                  <input className="ad-input" value={t.title} onChange={(e) => update({ title: e.target.value })} />
                </label>
                <label className="ad-field">
                  Group
                  <select className="ad-input" value={t.group} onChange={(e) => update({ group: e.target.value })}>
                    {groups.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="ad-field">
                  Subtitle
                  <input className="ad-input" value={t.subtitle || ''} onChange={(e) => update({ subtitle: e.target.value })} />
                </label>
                <label className="ad-field">
                  Visibility
                  <select className="ad-input" value={t.status === 'inactive' ? 'inactive' : 'active'} onChange={(e) => update({ status: e.target.value })}>
                    <option value="active">Live</option>
                    <option value="inactive">Hidden</option>
                  </select>
                </label>
                <label className="ad-field">
                  Occasions (comma separated)
                  <input className="ad-input" value={csv(t.occasion)} onChange={(e) => update({ occasion: uncsv(e.target.value) })} />
                </label>
                <label className="ad-field">
                  For whom (comma separated)
                  <input className="ad-input" value={csv(t.recipient)} onChange={(e) => update({ recipient: uncsv(e.target.value) })} />
                </label>
              </div>
              <label className="ad-field">
                Description
                <textarea className="ad-input" rows={2} value={t.description || ''} onChange={(e) => update({ description: e.target.value })} />
              </label>
              <div className="ad-toolbar">
                {[
                  ['bestSeller', 'Bestseller'],
                  ['popular', 'Popular'],
                  ['newArrival', 'New'],
                ].map(([k, l]) => (
                  <label key={k} className="ad-check">
                    <input type="checkbox" checked={!!t[k]} onChange={(e) => update({ [k]: e.target.checked })} /> {l}
                  </label>
                ))}
              </div>

              <h3>Layout</h3>
              <div className="ad-toolbar">
                {LAYOUTS.map((l) => (
                  <button key={l.id} className={`ad-chip ${t.layout === l.id ? 'on' : ''}`} onClick={() => setLayout(l.id)}>
                    {l.label}
                  </button>
                ))}
              </div>
              {t.layout !== 'text-only' && (
                <div className="ad-grid2">
                  {(t.slots || []).map((s, i) => (
                    <label key={s.id} className="ad-field">
                      Photo {i + 1} label
                      <span className="ad-row">
                        <input className="ad-input" value={s.label} onChange={(e) => update({ slots: t.slots.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                        <label className="ad-check">
                          <input type="checkbox" checked={!!s.required} onChange={(e) => update({ slots: t.slots.map((x, j) => (j === i ? { ...x, required: e.target.checked } : x)) })} /> required
                        </label>
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {t.hasCalendar && t.calendar && (
                <div className="ad-grid2">
                  <label className="ad-field">
                    Calendar month (1–12)
                    <input className="ad-input" type="number" min="1" max="12" value={t.calendar.month} onChange={(e) => update({ calendar: { ...t.calendar, month: +e.target.value } })} />
                  </label>
                  <label className="ad-field">
                    Year
                    <input className="ad-input" type="number" value={t.calendar.year} onChange={(e) => update({ calendar: { ...t.calendar, year: +e.target.value } })} />
                  </label>
                </div>
              )}

              <h3>Text fields</h3>
              <p className="ad-muted">
                Field ids with special roles: <code>name1</code> + <code>name2</code> (shown as “A & B”), <code>name</code>/<code>title</code>/<code>quote</code> (headline), <code>date</code>, <code>msg</code> (italic message), <code>author</code>.
              </p>
              {t.textFields.map((f, i) => (
                <div key={i} className="ad-tf">
                  <input className="ad-input" value={f.id} onChange={(e) => setField(i, { id: e.target.value.replace(/\s/g, '') })} title="Field id" />
                  <input className="ad-input" value={f.label} onChange={(e) => setField(i, { label: e.target.value })} placeholder="Label" />
                  <input className="ad-input" value={f.defaultValue || ''} onChange={(e) => setField(i, { defaultValue: e.target.value })} placeholder="Example text" />
                  <input className="ad-input" type="number" value={f.maxChars || 30} onChange={(e) => setField(i, { maxChars: +e.target.value })} title="Max characters" />
                  <button className="ad-btn" onClick={() => update({ textFields: t.textFields.filter((_, j) => j !== i) })}>
                    ✕
                  </button>
                </div>
              ))}
              <button className="ad-btn" onClick={() => update({ textFields: [...t.textFields, { id: `line${t.textFields.length + 1}`, label: 'New line', defaultValue: '', maxChars: 40, required: false }] })}>
                + Add text field
              </button>

              <h3>Decorations</h3>
              <div className="ad-toolbar">
                {DECORATIONS.map(([id, label]) => (
                  <button key={id} className={`ad-chip ${(t.decoratives || []).includes(id) ? 'on' : ''}`} onClick={() => update({ decoratives: (t.decoratives || []).includes(id) ? t.decoratives.filter((x) => x !== id) : [...(t.decoratives || []), id] })}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="ad-card">
        <h2>Groups</h2>
        <p className="ad-muted">Each group sets the background tint and accent colour of its designs.</p>
        {groups.map((gr, i) => (
          <div key={gr.id} className="ad-tf">
            <input className="ad-input" value={gr.id} readOnly title="Group id" />
            <input className="ad-input" value={gr.label} onChange={(e) => (setGroups((l) => l.map((x, j) => (j === i ? { ...x, label: e.target.value } : x))), setDirty(true))} />
            <input type="color" value={gr.color} onChange={(e) => (setGroups((l) => l.map((x, j) => (j === i ? { ...x, color: e.target.value } : x))), setDirty(true))} title="Background" />
            <input type="color" value={gr.accent} onChange={(e) => (setGroups((l) => l.map((x, j) => (j === i ? { ...x, accent: e.target.value } : x))), setDirty(true))} title="Accent" />
          </div>
        ))}
        <button
          className="ad-btn"
          onClick={() => {
            const label = prompt('New group name (e.g. Graduation)');
            if (!label) return;
            const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            setGroups((l) => [...l, { id, label, color: '#F0EBE2', accent: '#B68D40' }]);
            setDirty(true);
          }}
        >
          + Add group
        </button>
      </div>
    </>
  );
}
