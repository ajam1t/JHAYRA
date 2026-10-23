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
      {count > 0 && <span className="wtile-count">{count} pieces</span>}
    </Link>
  );
}

// null while the catalogue loads; then piece counts per world id.
export function useWorldCounts() {
  const { data: products, loading } = useProducts();
  const { active } = useTemplates();
  return useMemo(() => (loading && !products ? null : Object.fromEntries(WORLDS.map((w) => [w.id, worldProducts(w, products).length + worldTemplates(w, active).length]))), [products, active, loading]);
}

// Worlds with something to show. Empty worlds stay hidden until products
// are added under their category (see Admin → Worlds).
export function useLiveWorlds() {
  const counts = useWorldCounts();
  return { counts, live: counts ? WORLDS.filter((w) => counts[w.id] > 0) : null };
}
