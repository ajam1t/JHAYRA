import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../lib/catalog';
import { useTemplates } from '../lib/templates';
import { WORLDS, worldProducts, worldTemplates } from '../lib/worlds';

export function WorldTile({ w, count, compact = false }) {
  return (
    <Link to={`/worlds/${w.id}`} className={`wtile wt-${w.design} ${compact ? 'compact' : ''}`} style={{ '--wb': w.tone.bg, '--wi': w.tone.ink, '--wa': w.tone.accent }}>
      <span className="wtile-motif" aria-hidden="true" />
      <small>{w.kicker}</small>
      <b>{w.title}</b>
      <span className="wtile-count">{count ? `${count} pieces` : 'Launching soon'}</span>
    </Link>
  );
}

export function useWorldCounts() {
  const { data: products } = useProducts();
  const { active } = useTemplates();
  return useMemo(() => Object.fromEntries(WORLDS.map((w) => [w.id, worldProducts(w, products).length + worldTemplates(w, active).length])), [products, active]);
}
