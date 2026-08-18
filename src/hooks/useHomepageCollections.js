import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CATEGORIES } from '../data/categories';

/* Admin-managed homepage "Explore Our Collections" tiles.
   Source of truth is the `homepage_collections` table. If Supabase is disabled,
   the table is missing (migration not yet run), or there are no active rows, we
   fall back to the existing static CATEGORIES so the homepage never breaks and
   never shows empty/broken image boxes. */

// Static fallback mapped into the same shape the homepage consumes.
const FALLBACK = CATEGORIES.map((c, i) => ({
  id: `fallback-${c.slug}`,
  title: c.name,
  subtitle: c.count,
  image_url: c.image,
  link: `/shop?category=${c.slug}`,
  alt_text: c.name,
  display_order: i,
}));

export function useHomepageCollections() {
  const [items, setItems] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!supabase) { setLoading(false); return; }

    (async () => {
      const { data, error } = await supabase
        .from('homepage_collections')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (cancelled) return;
      if (!error && Array.isArray(data) && data.length > 0) {
        setItems(data);
        setUsingFallback(false);
      } else {
        setItems(FALLBACK);       // table missing / empty / error → safe fallback
        setUsingFallback(true);
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, []);

  return { items, loading, usingFallback };
}
