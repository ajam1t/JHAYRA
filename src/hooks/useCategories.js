import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CATEGORIES } from '../data/categories';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setCategories(CATEGORIES);
      setLoading(false);
      return;
    }

    async function load() {
      const { data, error: err } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('display_order');
      if (err) { setError(err.message); setLoading(false); return; }
      setCategories(data || []);
      setLoading(false);
    }

    load();
  }, []);

  return { categories, loading, error };
}
