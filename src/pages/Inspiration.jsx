import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import RoomScene, { WALLS } from '../components/RoomScene';
import Reveal from '../components/Reveal';
import Icon from '../components/Icon';
import { Seo } from '../lib/seo';
import { useProducts } from '../lib/catalog';
import { useCart } from '../state/cart';
import { useToast } from '../state/store';
import { money } from '../lib/site';
import { PRESETS, presetFrames, addWallToCart } from './WallPlanner';

const ROOMS = [
  { id: 'living', title: 'The living room', copy: 'A calm salon wall above the sofa — modern art with one spiritual anchor.', preset: 'salon', wall: 'ivory', furniture: 'sofa', colour: 'Black', cats: ['modern-art', 'art-abstract', 'religious', 'nature'] },
  { id: 'pooja', title: 'The pooja corner', copy: 'Gold frames, divine art, warm walls. A space that feels blessed.', preset: 'hero', wall: 'terracotta', furniture: 'console', colour: 'Black', cats: ['religious', 'home-vastu'] },
  { id: 'bedroom', title: 'The bedroom', copy: 'Soft nature prints in a quiet row above the headboard.', preset: 'trio', wall: 'sage', furniture: 'bed', colour: 'Black', cats: ['nature', 'photography', 'love-romance'] },
  { id: 'study', title: 'The study', copy: 'One bold statement piece — motivation you’ll see every day.', preset: 'statement', wall: 'charcoal', furniture: 'console', colour: 'Black', cats: ['running-horses', 'quotes', 'modern-art'] },
  { id: 'stairs', title: 'The staircase', copy: 'Frames that climb with you — the classic family gallery.', preset: 'stairs', wall: 'blush', furniture: 'none', colour: 'Black', cats: ['family', 'photography', 'modern-art', 'nature'] },
];

function Room({ room, products, index }) {
  const cart = useCart();
  const toast = useToast();
  const preset = PRESETS.find((p) => p.id === room.preset);
  const pick = useMemo(() => {
    const pool = products.filter((p) => p.thumbnail && room.cats.includes(p.category));
    const rest = products.filter((p) => p.thumbnail && !pool.includes(p));
    return [...pool, ...rest].slice(0, preset.slots.length);
  }, [products, room, preset]);
  const frames = presetFrames(preset, pick, room.colour);
  const total = frames.reduce((s, f) => s + f.size.price, 0);
  return (
    <Reveal className={`insp ${index % 2 ? 'flip' : ''}`}>
      <RoomScene wall={WALLS.find((w) => w.id === room.wall)} furniture={room.furniture} frames={frames} groupHeightIn={preset.groupH} />
      <div className="insp-copy">
        <span className="eyebrow">Room {index + 1}</span>
        <h2 className="h2" style={{ margin: '10px 0 12px' }}>
          {room.title}
        </h2>
        <p className="lead">{room.copy}</p>
        <ul className="insp-list">
          {frames.map((f) => (
            <li key={f.key}>
              <Link to={`/product/${f.product?.id}`}>{f.product?.name}</Link>
              <span>
                {f.size.name} · {money(f.size.price)}
              </span>
            </li>
          ))}
        </ul>
        <div className="row" style={{ flexWrap: 'wrap', marginTop: 20 }}>
          <button
            className="btn btn-gold"
            onClick={() => {
              addWallToCart(cart, frames, room.colour);
              cart.setDrawerOpen(true);
              toast(`${room.title} — added to your cart`, 'ok');
            }}
          >
            Shop the wall · {money(total)}
          </button>
          <Link className="btn btn-ghost" to={`/wall-planner?preset=${room.preset}&p=${pick.map((p) => p.id).join(',')}`}>
            <Icon name="edit" size={16} /> Customise it
          </Link>
        </div>
      </div>
    </Reveal>
  );
}

export default function Inspiration() {
  const { data: products } = useProducts();
  return (
    <>
      <Seo title="Wall Décor Ideas — Room Inspiration" description="Living room, pooja room, bedroom and staircase gallery wall ideas — shop each look in one tap, true to size." path="/room-inspiration" />
      <section className="wrap page-hero">
        <span className="eyebrow">Inspiration</span>
        <h1 className="display" style={{ marginTop: 16, maxWidth: '15ch' }}>
          Walls we’d <em>love to live with.</em>
        </h1>
        <p className="lead" style={{ marginTop: 18 }}>
          Five rooms, styled with JHAYRA frames at real size. Shop a look in one tap, or open it in the planner and make it yours.
        </p>
      </section>
      <section className="wrap" style={{ paddingBottom: 80 }}>
        {(products || []).length > 0 && ROOMS.map((r, i) => <Room key={r.id} room={r} products={products} index={i} />)}
      </section>
    </>
  );
}
