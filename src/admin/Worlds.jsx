import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTemplates } from '../lib/templates';
import { WORLDS, FAITHS, worldProducts, worldTemplates } from '../lib/worlds';
import { invalidateCatalog, useProducts } from '../lib/catalog';
import { STARTER, STARTER_CATEGORIES } from './starter';

const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Used only if the reference product has no options rows.
const DEFAULT_OPTIONS = [
  ['size', 'a4', true], ['size', 'a3plus', false], ['size', '18x24', false], ['size', '24x36', false],
  ['material', 'ps-moulding', true], ['colour', 'black', true], ['colour', 'gold', false], ['colour', 'brown', false],
].map(([option_type, option_slug, is_default], i) => ({ option_type, option_slug, is_default, display_order: i }));

function StarterImport({ onDone }) {
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);
  const add = (line) => setLog((l) => [...l, line]);
  const run = async () => {
    setBusy(true);
    setLog([]);
    try {
      const { data: cats } = await supabase.from('categories').select('slug');
      const have = new Set((cats || []).map((c) => c.slug));
      for (const [slug, name] of Object.entries(STARTER_CATEGORIES)) {
        if (have.has(slug)) continue;
        const { error } = await supabase.from('categories').insert({ slug, name, active: true });
        add(error ? `✗ Category ${slug}: ${error.message}` : `✓ Category ${name} created`);
      }
      const { data: existing } = await supabase.from('products').select('id,slug,legacy_id');
      const slugs = new Set((existing || []).map((p) => p.slug));
      let next = Math.max(0, ...(existing || []).map((p) => +(/^p(\d+)$/.exec(p.legacy_id || '')?.[1] || 0))) + 1;
      const ref = (existing || []).find((p) => p.legacy_id === 'p002');
      const { data: refOpts } = ref ? await supabase.from('product_options').select('option_type,option_slug,is_default,display_order,price_override').eq('product_id', ref.id) : { data: null };
      const options = refOpts?.length ? refOpts : DEFAULT_OPTIONS;
      for (const [i, item] of STARTER.entries()) {
        const slug = slugify(item.name);
        if (slugs.has(slug)) {
          add(`• ${item.name} already exists — skipped`);
          continue;
        }
        const legacy_id = `p${String(next++).padStart(3, '0')}`;
        // New products start with no rating (stars stay hidden until real reviews).
        const row = { name: item.name, slug, legacy_id, description: item.description, category_slug: item.category, price: 499, tags: item.tags, rating: 0, review_count: 0, is_bestseller: false, is_new_arrival: true, homepage_visible: false, display_order: 100 + i, active: true, customer_photo_eligible: false };
        let { data: prod, error } = await supabase.from('products').insert(row).select().single();
        if (error && /rating/i.test(error.message)) ({ data: prod, error } = await supabase.from('products').insert({ ...row, rating: null }).select().single());
        if (error) {
          add(`✗ ${item.name}: ${error.message}`);
          next--;
          continue;
        }
        const blob = await fetch(`/starter/${item.file}`).then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`image ${r.status}`))));
        const path = `${prod.id}/${Date.now()}.jpg`;
        const up = await supabase.storage.from('product-images').upload(path, blob, { contentType: 'image/jpeg' });
        if (up.error) add(`✗ ${item.name} image: ${up.error.message}`);
        else {
          const { data: pub } = supabase.storage.from('product-images').getPublicUrl(path);
          await supabase.from('product_images').insert({ product_id: prod.id, storage_path: path, url: pub.publicUrl, display_order: 0, is_primary: true });
        }
        const { error: oe } = await supabase.from('product_options').insert(options.map((o) => ({ ...o, product_id: prod.id })));
        add(oe ? `✗ ${item.name} options: ${oe.message}` : `✓ ${legacy_id} ${item.name}`);
      }
      invalidateCatalog();
      add('Done.');
      onDone?.();
    } catch (x) {
      add(`✗ ${x.message}`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="ad-card">
      <div className="ad-row-between">
        <h2>Starter collection · {STARTER.length} artworks</h2>
        <button className="ad-btn ad-btn-primary" disabled={busy} onClick={run}>
          {busy ? 'Adding…' : `Add ${STARTER.length} products`}
        </button>
      </div>
      <p className="ad-muted">
        Public-domain (CC0) paintings from The Cleveland Museum of Art’s Open Access collection, prepared as print-ready files: 6 Mithila (Madhubani) paintings, 8 Kalighat paintings of Lakshmi, Durga, Hanuman and Ram, 4 Buddhist, 2 Jain and 3 Christian works — plus 5 world and India map prints drawn from Natural Earth public-domain data (India with its official boundaries). They are added at ₹499 with the same sizes and frames as your other products — edit prices or remove any in Products. Running it again skips products that already exist.
      </p>
      <div className="ad-starter-thumbs">
        {STARTER.map((s) => (
          <img key={s.file} src={`/starter/${s.file}`} alt={s.name} title={s.name} loading="lazy" width="60" height="80" />
        ))}
      </div>
      {log.length > 0 && <pre className="ad-log">{log.join('\n')}</pre>}
    </div>
  );
}

// Each world fills itself from products in its category slug (plus name
// keywords) and from template groups. This page shows what is live and
// creates any missing category so new products can be filed under it.
const NAMES = { anime: 'Anime & Manga', 'genz-quotes': 'Gen Z Quotes', 'desi-quotes': 'Desi Quotes', mithila: 'Mithila Heritage', sikh: 'Sikh', buddhist: 'Buddhist', jain: 'Jain', christian: 'Christian', islamic: 'Islamic' };

export default function Worlds() {
  const { data: products } = useProducts();
  const { active } = useTemplates();
  const [cats, setCats] = useState(null);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const load = () => supabase.from('categories').select('slug,name,active').then(({ data }) => setCats(Object.fromEntries((data || []).map((c) => [c.slug, c]))));
  useEffect(() => {
    load();
  }, []);

  const create = async (slug) => {
    setBusy(slug);
    setErr('');
    const { error } = await supabase.from('categories').insert({ slug, name: NAMES[slug] || slug, active: true });
    if (error) setErr(error.message);
    await load();
    setBusy('');
  };

  const rows = [...WORLDS.map((w) => ({ key: w.id, label: w.title, to: `/worlds/${w.id}`, slug: w.category, n: worldProducts(w, products).length, t: worldTemplates(w, active).length })), ...FAITHS.filter((f) => f.id !== 'hindu').map((f) => ({ key: f.id, label: `Divine · ${f.label}`, to: '/worlds/divine', slug: f.cats[0], n: (products || []).filter((p) => f.cats.includes(p.category)).length, t: 0 }))];

  return (
    <>
      <h1 className="ad-h1">Worlds</h1>
      <StarterImport onDone={load} />
      <div className="ad-card">
        <p className="ad-muted">To fill a world, add products in Products and set their category to the slug shown here. Worlds, faith tabs and deity filters with nothing live are hidden from customers and appear automatically once products are added. Anime art must be original — never copied characters.</p>
        {err && <div className="ad-err">{err}</div>}
        <div style={{ overflowX: 'auto' }}>
          <table className="ad-table">
            <thead>
              <tr>
                <th>World</th>
                <th>Category slug</th>
                <th>Products</th>
                <th>Templates</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td>
                    <Link to={r.to} target="_blank">
                      {r.label}
                    </Link>
                  </td>
                  <td>
                    <code>{r.slug}</code>
                  </td>
                  <td>{r.n}</td>
                  <td>{r.t}</td>
                  <td className="ad-actions">
                    {!cats ? null : cats[r.slug] ? (
                      <span className="ad-muted">{cats[r.slug].active ? 'Category live' : 'Category hidden'}</span>
                    ) : (
                      <button className="ad-btn" disabled={busy === r.slug} onClick={() => create(r.slug)}>
                        {busy === r.slug ? 'Creating…' : 'Create category'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
