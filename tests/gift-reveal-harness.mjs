// Shared by the Gift Reveal unit test and browser test: the real gift-reveal
// Edge Function bundled with esbuild, plus an in-memory database and storage.
import { build } from 'esbuild';

export function fakeDb(tables, files = new Set(), mediaBase = 'https://signed/') {
  let seq = 0;
  const run = (q) => {
    const rows = tables[q.table] || (tables[q.table] = []);
    const match = (r) =>
      q.filters.every(([op, k, v]) => (op === 'eq' ? r[k] === v : op === 'gte' ? r[k] >= v : op === 'in' ? v.includes(r[k]) : true));
    if (q.op === 'update') {
      const hit = rows.filter(match);
      hit.forEach((r) => Object.assign(r, q.values));
      return { data: hit.map((r) => ({ ...r })), error: null };
    }
    if (q.op === 'insert' || q.op === 'upsert') {
      const list = (Array.isArray(q.values) ? q.values : [q.values]).map((v) => ({ id: `id-${++seq}`, views: 0, edit_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), first_opened_at: null, at: new Date().toISOString(), ...v }));
      const out = [];
      for (const r of list) {
        if (q.op === 'upsert' && rows.some((x) => x[q.conflict] === r[q.conflict])) continue; // ignoreDuplicates
        rows.push(r);
        out.push({ ...r });
      }
      return { data: out, error: null };
    }
    const hit = rows.filter(match);
    if (q.head) return { data: null, count: hit.length, error: null };
    return { data: hit.map((r) => ({ ...r })), error: null };
  };
  const builder = (table) => {
    const q = { table, op: 'select', filters: [], values: null };
    const b = {
      select: (_c, o) => (o?.head && (q.head = true), b),
      insert: (v) => ((q.op = 'insert'), (q.values = v), b),
      upsert: (v, o) => ((q.op = 'upsert'), (q.values = v), (q.conflict = o.onConflict), b),
      update: (v) => ((q.op = 'update'), (q.values = v), b),
      eq: (k, v) => (q.filters.push(['eq', k, v]), b),
      gte: (k, v) => (q.filters.push(['gte', k, v]), b),
      in: (k, v) => (q.filters.push(['in', k, v]), b),
      order: () => b,
      maybeSingle: async () => ({ data: run(q).data[0] || null, error: null }),
      then: (res, rej) => Promise.resolve(run(q)).then(res, rej),
    };
    return b;
  };
  const storage = {
    from: () => ({
      createSignedUploadUrl: async (path) => ({ data: { token: `t-${path}` }, error: null }),
      createSignedUrls: async (paths) => ({ data: paths.map((p) => ({ path: p, signedUrl: `${mediaBase}${p}` })), error: null }),
      list: async (folder) => ({ data: [...files].filter((f) => f.startsWith(`${folder}/`)).map((f) => ({ name: f.slice(folder.length + 1) })), error: null }),
      remove: async (paths) => (paths.forEach((p) => files.delete(p)), { data: null, error: null }),
    }),
  };
  const auth = { getUser: async (jwt) => ({ data: { user: jwt === 'admin-jwt' ? { id: 'admin-1' } : null } }) };
  return { from: builder, storage, auth };
}

let mod;
export async function load() {
  if (mod) return mod;
  const out = await build({
    entryPoints: ['supabase/functions/gift-reveal/index.ts'],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    plugins: [
      {
        name: 'stubs',
        setup(b) {
          b.onResolve({ filter: /^https:\/\/deno\.land\/.*server\.ts$/ }, () => ({ path: 'serve', namespace: 'stub' }));
          b.onResolve({ filter: /^https:\/\/esm\.sh\/@supabase/ }, () => ({ path: 'supabase', namespace: 'stub' }));
          b.onLoad({ filter: /.*/, namespace: 'stub' }, (a) => ({ contents: a.path === 'serve' ? 'export const serve = () => {};' : 'export const createClient = () => null;', loader: 'js' }));
        },
      },
    ],
  });
  globalThis.__GIFT_REVEAL_TEST__ = true;
  globalThis.Deno = { env: { get: (k) => ({ SUPABASE_SERVICE_ROLE_KEY: 'service-key-test' })[k] } };
  mod = await import(`data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString('base64')}`);
  return mod;
}

