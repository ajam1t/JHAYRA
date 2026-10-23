import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useProducts } from '../lib/catalog';
import { useTemplates } from '../lib/templates';
import { WORLDS, FAITHS, worldProducts, worldTemplates } from '../lib/worlds';

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
      <div className="ad-card">
        <p className="ad-muted">To fill a world, add products in Products and set their category to the slug shown here. Worlds with nothing live show an honest "Launching soon" page with a WhatsApp notify button. Anime art must be original — never copied characters.</p>
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
