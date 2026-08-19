import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FRAME_SIZES, FRAME_OPTIONS, FRAME_COLOUR_HEX, coloursForSize, getFrameOption } from '../data/frameOptions';

/* Per-product configuration (#5).
   Sizes / materials / colours are DATA (frame_sizes, frame_materials,
   frame_colours catalogs) enabled per product via product_options. The product
   page shows ONLY the options enabled for that product, with per-product
   pricing. Falls back to the global frameOptions when Supabase is off or a
   product has no options rows — so nothing ever breaks. */

function fallbackConfig() {
  const sizes = FRAME_SIZES.map((name, i) => {
    const fo = getFrameOption(name, coloursForSize(name)[0]);
    return { slug: name, name, dimensions: fo?.dimensions || '', ratioW: null, ratioH: null, price: fo?.price ?? 499, isDefault: i === 0 };
  });
  const colourNames = [...new Set(FRAME_OPTIONS.map(o => o.colour))];
  const colours = colourNames.map((name) => ({ slug: name.toLowerCase(), name, hex: FRAME_COLOUR_HEX[name] || '#1C1C1C', isDefault: name === 'Black' }));
  const materials = [{ slug: 'ps-moulding', name: 'PS Moulding', isDefault: true }];
  return { sizes, colours, materials, _fallback: true };
}

export function useProductConfig(dbId) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!supabase || !dbId) { setConfig(fallbackConfig()); setLoading(false); return; }

    (async () => {
      setLoading(true);
      const [optRes, sizeRes, colRes, matRes] = await Promise.all([
        supabase.from('product_options').select('*').eq('product_id', dbId),
        supabase.from('frame_sizes').select('*').eq('active', true).order('display_order'),
        supabase.from('frame_colours').select('*').eq('active', true).order('display_order'),
        supabase.from('frame_materials').select('*').eq('active', true).order('display_order'),
      ]);
      if (cancelled) return;

      const opts = optRes.data || [];
      if (optRes.error || !opts.length) { setConfig(fallbackConfig()); setLoading(false); return; }

      const sizeCat = new Map((sizeRes.data || []).map(s => [s.slug, s]));
      const colCat  = new Map((colRes.data  || []).map(c => [c.slug, c]));
      const matCat  = new Map((matRes.data  || []).map(m => [m.slug, m]));
      const of = (t) => opts.filter(o => o.option_type === t).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

      const sizes = of('size').map(o => {
        const c = sizeCat.get(o.option_slug); if (!c) return null;
        return { slug: c.slug, name: c.name, dimensions: c.dimensions, ratioW: +c.ratio_w, ratioH: +c.ratio_h,
                 price: o.price_override != null ? +o.price_override : +c.base_price, isDefault: o.is_default };
      }).filter(Boolean);

      const colours = of('colour').map(o => {
        const c = colCat.get(o.option_slug); if (!c) return null;
        return { slug: c.slug, name: c.name, hex: c.hex, isDefault: o.is_default };
      }).filter(Boolean);

      const materials = of('material').map(o => {
        const c = matCat.get(o.option_slug); if (!c) return null;
        return { slug: c.slug, name: c.name, isDefault: o.is_default };
      }).filter(Boolean);

      if (!sizes.length || !colours.length || !materials.length) { setConfig(fallbackConfig()); setLoading(false); return; }
      setConfig({ sizes, colours, materials, _fallback: false });
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [dbId]);

  return { config: config || fallbackConfig(), loading };
}
