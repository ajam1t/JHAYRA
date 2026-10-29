import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Frame from '../components/Frame';
import Img from '../components/Img';
import Icon from '../components/Icon';
import RoomScene, { WALLS } from '../components/RoomScene';
import { CameraWall } from '../components/WallStudio';
import { Seo } from '../lib/seo';
import { loadFrameConfig, searchProducts, useAsync, useCategories, useProducts } from '../lib/catalog';
import { useCart } from '../state/cart';
import { useToast } from '../state/store';
import { money } from '../lib/site';

const SAMPLES = [
  { id: 'living', label: 'Living room', wall: 'porcelain', furniture: 'sofa' },
  { id: 'bedroom', label: 'Bedroom', wall: 'mist', furniture: 'bed' },
  { id: 'dining', label: 'Dining', wall: 'stone', furniture: 'dining' },
  { id: 'office', label: 'Office', wall: 'stone', furniture: 'console' },
];
const WALL = Object.fromEntries(WALLS.map((w) => [w.id, w]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export default function Visualise() {
  const [params, setParams] = useSearchParams();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const cart = useCart();
  const toast = useToast();
  const [room, setRoom] = useState({ kind: 'sample', id: 'living' });
  const [photo, setPhoto] = useState(null);
  const [pid, setPid] = useState(params.get('p') || '');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [sizeSlug, setSizeSlug] = useState('');
  const [colourName, setColourName] = useState('Black');
  const [pos, setPos] = useState({ x: 0.5, y: 0.4 });
  const [width, setWidth] = useState(0.22); // fraction of the photo width
  const [angle, setAngle] = useState(0);
  const [split, setSplit] = useState(100);
  const [cam, setCam] = useState(false);
  const stage = useRef(null);
  const drag = useRef(null);
  const file = useRef(null);

  const product = useMemo(() => (products || []).find((p) => p.id === pid) || (products || []).find((p) => p.is_bestseller && p.thumbnail), [products, pid]);
  const { data: cfg } = useAsync(() => (product ? loadFrameConfig(product.dbId) : Promise.resolve(null)), [product?.dbId]);

  useEffect(() => {
    if (!cfg) return;
    setSizeSlug((s) => (cfg.sizes.some((x) => x.slug === s) ? s : (cfg.sizes.find((x) => x.isDefault) || cfg.sizes[0]).slug));
    setColourName((c) => (cfg.colours.some((x) => x.name === c) ? c : cfg.colours.find((x) => x.name === 'Black')?.name || cfg.colours[0].name));
  }, [cfg]);

  useEffect(() => {
    if (product) setParams((p) => {
      const n = new URLSearchParams(p);
      n.set('p', product.id);
      return n;
    }, { replace: true });
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const size = cfg?.sizes.find((s) => s.slug === sizeSlug) || cfg?.sizes[0];
  const colour = cfg?.colours.find((c) => c.name === colourName) || cfg?.colours[0];
  const ratio = { w: size?.ratioW || 12, h: size?.ratioH || 18 };
  const list = useMemo(() => {
    let l = (products || []).filter((p) => p.thumbnail);
    if (cat) l = l.filter((p) => p.category === cat);
    if (q) l = searchProducts(l, q);
    return l;
  }, [products, cat, q]);

  const onPhoto = (f) => {
    if (!f?.type.startsWith('image/')) return toast('Please choose a photo of your wall.', 'warn');
    if (photo) URL.revokeObjectURL(photo);
    setPhoto(URL.createObjectURL(f));
    setRoom({ kind: 'photo' });
    setPos({ x: 0.5, y: 0.4 });
    setSplit(100);
  };

  const down = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY };
  };
  const move = (e) => {
    if (!drag.current) return;
    const r = stage.current.getBoundingClientRect();
    const dx = (e.clientX - drag.current.x) / r.width;
    const dy = (e.clientY - drag.current.y) / r.height;
    drag.current = { x: e.clientX, y: e.clientY };
    setPos((p) => ({ x: clamp(p.x + dx, 0.05, 0.95), y: clamp(p.y + dy, 0.05, 0.95) }));
  };
  const up = () => (drag.current = null);

  const addToCart = () => {
    if (!product || !size || !colour) return;
    cart.add({
      productId: product.id,
      name: product.name,
      image: product.thumbnail,
      price: size.price,
      category: product.category,
      colourHex: colour.hex,
      option: { id: `${size.slug}_${colour.slug}_ps-moulding`, size: size.name, dimensions: size.dimensions, colour: colour.name, material: 'PS Moulding' },
      orientation: 'Vertical',
      customization: { material: 'PS Moulding', artworkVariant: null },
    });
  };

  const sample = SAMPLES.find((s) => s.id === room.id) || SAMPLES[0];
  const canCamera = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  return (
    <>
      <Seo title="Visualise Art in Your Room" description="Upload a photo of your wall, choose any JHAYRA artwork, size and frame, and see how it looks before you buy." path="/visualise" />
      <section className="wrap viz-head">
        <span className="eyebrow">Visualise in my room</span>
        <h1 className="h1">
          See it on <em>your wall</em> first.
        </h1>
        <p className="lead">Upload a photo of your wall — or use one of our rooms — then choose any artwork, its size and frame, and place it. A photo preview to help you decide; size it against something you know, like a sofa or a door.</p>
      </section>
      <section className="wrap viz">
        <div className="viz-stage-col">
          <div className="viz-sources" role="tablist" aria-label="Room">
            {SAMPLES.map((s) => (
              <button key={s.id} role="tab" aria-selected={room.kind === 'sample' && room.id === s.id} onClick={() => setRoom({ kind: 'sample', id: s.id })}>
                {s.label}
              </button>
            ))}
            <button role="tab" aria-selected={room.kind === 'photo'} onClick={() => (photo ? setRoom({ kind: 'photo' }) : file.current?.click())}>
              <Icon name="upload" size={15} /> My room photo
            </button>
            {canCamera && (
              <button role="tab" aria-selected={false} onClick={() => setCam(true)}>
                <Icon name="camera" size={15} /> Live camera
              </button>
            )}
          </div>

          {room.kind === 'sample' ? (
            <RoomScene wall={WALL[sample.wall]} furniture={sample.furniture} decor={sample.id === 'living'} frames={product ? [{ key: 'a', src: product.thumbnail, wIn: ratio.w, hIn: ratio.h, colour: colour?.hex || '#1C1C1C' }] : []} className="viz-room" />
          ) : (
            <div className="viz-photo" ref={stage} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
              <img src={photo} alt="Your room" className="viz-bg" draggable="false" />
              <div className="viz-art-layer" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
                {product && (
                  <div className="viz-art" style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%`, width: `${width * 100}%`, transform: `translate(-50%, -50%) perspective(900px) rotateY(${angle}deg)` }} onPointerDown={down}>
                    <Frame src={product.thumbnail} alt={product.name} ratio={ratio} colour={colour?.hex || '#1C1C1C'} sizes="40vw" />
                  </div>
                )}
              </div>
              <div className="viz-split" style={{ left: `${split}%` }} aria-hidden="true">
                <span>With art · Without</span>
              </div>
            </div>
          )}

          {room.kind === 'photo' && (
            <div className="viz-controls">
              <label>
                Size on photo
                <input type="range" min="0.06" max="0.7" step="0.005" value={width} onChange={(e) => setWidth(+e.target.value)} />
              </label>
              <label>
                Wall angle
                <input type="range" min="-40" max="40" step="1" value={angle} onChange={(e) => setAngle(+e.target.value)} />
              </label>
              <label>
                Before / after
                <input type="range" min="0" max="100" step="1" value={split} onChange={(e) => setSplit(+e.target.value)} />
              </label>
              <button className="chip" onClick={() => file.current?.click()}>
                <Icon name="image" size={15} /> Change photo
              </button>
            </div>
          )}
          <p className="small muted viz-note">
            {room.kind === 'sample'
              ? 'Sample rooms are drawn to scale: the sofa is 84 inches wide, so the frame shows its true size.'
              : 'Drag the frame to place it. Photos can’t measure distance, so match the size to something you know — a standard door is about 80 inches tall.'}
          </p>
        </div>

        <aside className="viz-panel">
          {product && (
            <div className="viz-product">
              <div className="viz-thumb">
                <Img src={product.thumbnail} alt="" sizes="80px" width={200} />
              </div>
              <div>
                <b>{product.name}</b>
                <small>
                  {size?.name} · {colour?.name} frame · {money(size?.price ?? product.price)}
                </small>
              </div>
            </div>
          )}
          {cfg && (
            <>
              <label className="editor-label">Size</label>
              <div className="ls-sizes">
                {cfg.sizes.map((s) => (
                  <button key={s.slug} className={`ls-size ${s.slug === size?.slug ? 'on' : ''}`} aria-pressed={s.slug === size?.slug} onClick={() => setSizeSlug(s.slug)}>
                    <b>{s.name}</b>
                    <small>{money(s.price)}</small>
                  </button>
                ))}
              </div>
              <label className="editor-label">Frame</label>
              <div className="swatches">
                {cfg.colours.map((c) => (
                  <button key={c.slug} className={`swatch swatch-frame ${c.name === colour?.name ? 'on' : ''}`} style={{ '--sw': c.hex }} aria-label={`${c.name} frame`} aria-pressed={c.name === colour?.name} onClick={() => setColourName(c.name)} />
                ))}
              </div>
            </>
          )}
          <div className="viz-actions">
            <button className="btn btn-gold btn-block" onClick={addToCart} disabled={!product || !size}>
              Add to bag · {money(size?.price ?? 0)}
            </button>
            {product && (
              <Link to={`/product/${product.id}`} className="btn btn-ghost btn-block">
                View product details
              </Link>
            )}
          </div>
          <label className="editor-label">Choose artwork</label>
          <div className="viz-search">
            <Icon name="search" size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search artwork" aria-label="Search artwork" />
          </div>
          <div className="chips scroll" style={{ margin: '10px 0' }}>
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
              <button key={p.id} className={product?.id === p.id ? 'on' : ''} onClick={() => setPid(p.id)} aria-label={p.name} title={p.name}>
                <Img src={p.thumbnail} alt="" sizes="90px" width={200} />
              </button>
            ))}
          </div>
        </aside>
      </section>
      <input ref={file} type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files?.[0] && onPhoto(e.target.files[0])} />
      {cam && product && <CameraWall src={product.thumbnail} wIn={ratio.w} hIn={ratio.h} colour={colour?.hex || '#1C1C1C'} onClose={() => setCam(false)} />}
    </>
  );
}
