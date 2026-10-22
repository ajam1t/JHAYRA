import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import RoomScene, { WALLS, FURNITURE } from '../components/RoomScene';
import Img from '../components/Img';
import Icon from '../components/Icon';
import { Seo } from '../lib/seo';
import { useCategories, useProducts } from '../lib/catalog';
import { SIZES, colourHex } from '../lib/frames';
import { useCart } from '../state/cart';
import { useToast } from '../state/store';
import { money } from '../lib/site';

const S = Object.fromEntries(SIZES.map((s) => [s.name, s]));

// Gallery-wall arrangements. dx/dy are inches from the centre of the group.
export const PRESETS = [
  { id: 'trio', label: 'Row of three', groupH: 18, slots: [['A3+', -15, 0], ['A3+', 0, 0], ['A3+', 15, 0]] },
  { id: 'grid4', label: '2 × 2 grid', groupH: 28.5, slots: [['A4', -6, -7.75], ['A4', 6, -7.75], ['A4', -6, 7.75], ['A4', 6, 7.75]] },
  { id: 'hero', label: 'Hero + two', groupH: 24, slots: [['A4', -16.75, 0], ['18 × 24', 0, 0], ['A4', 16.75, 0]] },
  { id: 'salon', label: 'Salon mix', groupH: 28, slots: [['A3+', -18, -2], ['18 × 24', 0, 0], ['A4', 16.75, -6.5], ['A4', 16.75, 8.5]] },
  { id: 'stairs', label: 'Staircase climb', groupH: 30, slots: [['A3+', -15, 6], ['A3+', 0, 0], ['A3+', 15, -6]] },
  { id: 'statement', label: 'One statement', groupH: 36, slots: [['24 × 36', 0, 0]] },
];

export function presetFrames(preset, products, colour) {
  return preset.slots.map(([size, dx, dy], i) => {
    const p = products[i];
    const s = S[size];
    return { key: `s${i}`, src: p?.thumbnail, wIn: s.w, hIn: s.h, dxIn: dx, dyIn: dy, colour: colourHex(colour), product: p, size: s };
  });
}

export function addWallToCart(cart, frames, colour) {
  frames
    .filter((f) => f.product)
    .forEach((f) =>
      cart.add(
        {
          productId: f.product.id,
          name: f.product.name,
          image: f.product.thumbnail,
          price: f.size.price,
          category: f.product.category,
          colourHex: colourHex(colour),
          option: { id: `${f.size.slug}_${colour.toLowerCase()}_ps-moulding`, size: f.size.name, dimensions: f.size.dimensions, colour, material: 'PS Moulding' },
          orientation: 'Vertical',
          customization: { material: 'PS Moulding', artworkVariant: null, gallerySet: true },
        },
        { open: false },
      ),
    );
}

export default function WallPlanner() {
  const [params] = useSearchParams();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const cart = useCart();
  const toast = useToast();
  const [presetId, setPresetId] = useState(params.get('preset') || 'salon');
  const [picked, setPicked] = useState([]);
  const [sel, setSel] = useState('s0');
  const [colour, setColour] = useState('Black');
  const [wall, setWall] = useState(WALLS[0]);
  const [furniture, setFurniture] = useState('sofa');
  const [cat, setCat] = useState('');
  const [moved, setMoved] = useState({});

  const preset = PRESETS.find((p) => p.id === presetId) || PRESETS[0];

  // Start with the ids from the URL, or bestsellers.
  useEffect(() => {
    if (!products || picked.length) return;
    const ids = (params.get('p') || '').split(',').filter(Boolean);
    const fromUrl = ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);
    const best = products.filter((p) => p.is_bestseller && p.thumbnail);
    setPicked([...fromUrl, ...best.filter((b) => !fromUrl.includes(b))].slice(0, 6));
  }, [products]); // eslint-disable-line react-hooks/exhaustive-deps

  const frames = useMemo(() => presetFrames(preset, picked, colour).map((f) => ({ ...f, ...(moved[presetId + f.key] || {}) })), [preset, picked, colour, moved, presetId]);
  const total = frames.reduce((s, f) => s + (f.product ? f.size.price : 0), 0);
  const idx = +sel.slice(1);
  const list = (products || []).filter((p) => p.thumbnail && (!cat || p.category === cat));

  return (
    <>
      <Seo title="Gallery Wall Planner — Design Your Wall" description="Plan a gallery wall in minutes: pick a layout, choose designs for each frame, see it true-to-scale above your sofa or bed, and add the whole set to your cart." path="/wall-planner" />
      <section className="wrap page-hero" style={{ paddingBottom: 18 }}>
        <span className="eyebrow">Gallery wall planner</span>
        <h1 className="h1" style={{ marginTop: 12 }}>
          Design a whole wall, <em>true to size.</em>
        </h1>
        <p className="lead">Pick an arrangement, tap a frame to change its design, drag to fine-tune. Every frame is drawn at its real size next to your furniture.</p>
      </section>
      <section className="wrap planner">
        <div className="planner-stage">
          <div className="chips scroll" style={{ marginBottom: 14 }}>
            {PRESETS.map((p) => (
              <button key={p.id} className="chip" aria-pressed={p.id === presetId} onClick={() => (setPresetId(p.id), setSel('s0'))}>
                {p.label}
              </button>
            ))}
          </div>
          <RoomScene
            wall={wall}
            furniture={furniture}
            frames={frames}
            groupHeightIn={preset.groupH}
            selected={sel}
            onFrameClick={setSel}
            onFrameDrag={(key, x, y) => (setSel(key), setMoved((m) => ({ ...m, [presetId + key]: { x, y } })))}
          />
          <div className="studio-controls">
            <div className="swatches" aria-label="Wall colour">
              {WALLS.map((w) => (
                <button key={w.id} className={`swatch ${wall.id === w.id ? 'on' : ''}`} style={{ background: w.c }} aria-label={`${w.label} wall`} aria-pressed={wall.id === w.id} onClick={() => setWall(w)} />
              ))}
            </div>
            <div className="chips">
              {FURNITURE.map((f) => (
                <button key={f.id} className="chip" aria-pressed={furniture === f.id} onClick={() => setFurniture(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
            {Object.keys(moved).length > 0 && (
              <button className="chip" onClick={() => setMoved({})}>
                <Icon name="refresh" size={15} /> Reset positions
              </button>
            )}
          </div>
        </div>
        <aside className="planner-panel card">
          <h2 className="h3">Frame {idx + 1} of {frames.length}</h2>
          <p className="small muted" style={{ margin: '4px 0 12px' }}>
            {frames[idx]?.size.name} · {frames[idx]?.size.dimensions} — tap a design to place it
          </p>
          <div className="chips scroll" style={{ marginBottom: 10 }}>
            <button className="chip" aria-pressed={!cat} onClick={() => setCat('')}>
              All
            </button>
            {(categories || [])
              .filter((c) => (products || []).some((p) => p.category === c.slug))
              .map((c) => (
                <button key={c.slug} className="chip" aria-pressed={cat === c.slug} onClick={() => setCat(c.slug)}>
                  {c.name}
                </button>
              ))}
          </div>
          <div className="picker">
            {list.map((p) => (
              <button
                key={p.id}
                className={picked[idx]?.id === p.id ? 'on' : ''}
                onClick={() => {
                  setPicked((l) => {
                    const n = [...l];
                    n[idx] = p;
                    return n;
                  });
                  const next = (idx + 1) % frames.length;
                  setSel(`s${next}`);
                }}
                aria-label={p.name}
                title={p.name}
              >
                <Img src={p.thumbnail} alt="" sizes="90px" width={200} />
              </button>
            ))}
          </div>
          <label className="editor-label">Frame finish for the set</label>
          <div className="swatches">
            {['Black', 'Gold', 'Brown'].map((c) => (
              <button key={c} className={`swatch swatch-frame ${c === colour ? 'on' : ''}`} style={{ '--sw': colourHex(c) }} aria-label={`${c} frames`} aria-pressed={c === colour} onClick={() => setColour(c)} />
            ))}
          </div>
          <ul className="planner-list">
            {frames.map((f, i) => (
              <li key={f.key} className={sel === f.key ? 'on' : ''} onClick={() => setSel(f.key)}>
                <span>{i + 1}</span>
                <b>{f.product?.name || 'Choose a design'}</b>
                <small>
                  {f.size.name} · {money(f.size.price)}
                </small>
              </li>
            ))}
          </ul>
          <div className="editor-buy" style={{ position: 'static' }}>
            <div>
              <b>{money(total)}</b>
              <small>{frames.length} frames · free delivery</small>
            </div>
            <button
              className="btn btn-gold"
              onClick={() => {
                addWallToCart(cart, frames, colour);
                cart.setDrawerOpen(true);
                toast('Your gallery wall is in the cart', 'ok');
              }}
            >
              Add the set
            </button>
          </div>
          <p className="small muted" style={{ marginTop: 12 }}>
            Want your own photos in the set? <Link className="link" to="/customize">Personalise frames</Link> and add them too.
          </p>
        </aside>
      </section>
    </>
  );
}
