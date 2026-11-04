// Payment Edge Function tests: the real function source, bundled with esbuild,
// runs against an in-memory database and a fake Razorpay. Nothing leaves this
// machine — no real orders, payments or network calls.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { build } from 'esbuild';

const SECRET = 'test_secret';
const WEBHOOK_SECRET = 'whsec_test';

// ── in-memory Supabase ────────────────────────────────────────────────────────
function fakeDb(tables) {
  const run = (q) => {
    let rows = tables[q.table] || (tables[q.table] = []);
    const match = (r) => q.filters.every(([op, k, v]) => (op === 'eq' ? r[k] === v : r[k] !== v));
    if (q.op === 'update') {
      const hit = rows.filter(match);
      hit.forEach((r) => Object.assign(r, q.values));
      return { data: hit.map((r) => ({ ...r })), error: null };
    }
    if (q.op === 'insert') {
      const list = (Array.isArray(q.values) ? q.values : [q.values]).map((v, i) => ({ id: `id-${rows.length + i + 1}`, order_number: 'JHY-T-1', ...v }));
      rows.push(...list);
      return { data: list, error: null };
    }
    return { data: rows.filter(match).map((r) => ({ ...r })), error: null };
  };
  const builder = (table) => {
    const q = { table, op: 'select', filters: [], values: null };
    const b = {
      select: () => b,
      insert: (v) => ((q.op = 'insert'), (q.values = v), b),
      update: (v) => ((q.op = 'update'), (q.values = v), b),
      eq: (k, v) => (q.filters.push(['eq', k, v]), b),
      neq: (k, v) => (q.filters.push(['neq', k, v]), b),
      maybeSingle: async () => {
        const r = run(q);
        return { data: r.data[0] || null, error: null };
      },
      single: async () => {
        const r = run(q);
        return { data: r.data[0] || null, error: null };
      },
      then: (res, rej) => Promise.resolve(run(q)).then(res, rej),
    };
    return b;
  };
  return { from: builder };
}

// Bundle a function with its Deno/esm.sh imports swapped for local stubs.
async function load(name, tables, razorpay = {}) {
  const out = await build({
    entryPoints: [`supabase/functions/${name}/index.ts`],
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
          b.onLoad({ filter: /.*/, namespace: 'stub' }, (a) => ({
            contents: a.path === 'serve' ? 'export const serve = (h) => { globalThis.__handler = h; };' : 'export const createClient = () => globalThis.__db;',
            loader: 'js',
          }));
        },
      },
    ],
  });
  globalThis.__db = fakeDb(tables);
  globalThis.Deno = { env: { get: (k) => ({ RAZORPAY_KEY_ID: 'rzp_test', RAZORPAY_KEY_SECRET: SECRET, RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET, SUPABASE_URL: 'x', SUPABASE_SERVICE_ROLE_KEY: 'x' })[k] } };
  globalThis.fetch = async (url) => {
    const m = String(url).match(/\/v1\/payments\/(.+)$/);
    if (m && razorpay[decodeURIComponent(m[1])]) return new Response(JSON.stringify(razorpay[decodeURIComponent(m[1])]), { status: 200 });
    if (m) return new Response('not found', { status: 404 });
    return new Response('{}', { status: 200 });
  };
  const url = `data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString('base64')}`;
  await import(url);
  return globalThis.__handler;
}

const sig = (o, p) => createHmac('sha256', SECRET).update(`${o}|${p}`).digest('hex');
const post = (body, headers = {}) => new Request('https://x/fn', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });

test('verify: a forged signature cannot touch another order', async () => {
  const orders = [{ id: 'o1', razorpay_order_id: 'order_A', payment_status: 'paid', total_amount: 499 }, { id: 'o2', razorpay_order_id: 'order_B', payment_status: 'pending', total_amount: 499 }];
  const h = await load('verify-razorpay-payment', { orders });
  // wrong Razorpay order for o1 → 404, nothing written
  let r = await h(post({ razorpay_order_id: 'order_X', razorpay_payment_id: 'pay_1', razorpay_signature: 'bad', order_id: 'o1' }));
  assert.equal(r.status, 404);
  assert.equal(orders[0].payment_status, 'paid');
  // right Razorpay order but bad signature on a PAID order → it stays paid
  r = await h(post({ razorpay_order_id: 'order_A', razorpay_payment_id: 'pay_1', razorpay_signature: 'bad', order_id: 'o1' }));
  assert.equal(r.status, 400);
  assert.equal(orders[0].payment_status, 'paid');
  // bad signature on a pending order → failed
  r = await h(post({ razorpay_order_id: 'order_B', razorpay_payment_id: 'pay_2', razorpay_signature: 'bad', order_id: 'o2' }));
  assert.equal(orders[1].payment_status, 'failed');
});

test('verify: confirmed with Razorpay, paid once, idempotent', async () => {
  const orders = [{ id: 'o1', razorpay_order_id: 'order_A', payment_status: 'pending', total_amount: 499 }];
  const h = await load('verify-razorpay-payment', { orders, order_items: [] }, { pay_1: { order_id: 'order_A', status: 'captured', amount: 49900 } });
  const body = { razorpay_order_id: 'order_A', razorpay_payment_id: 'pay_1', razorpay_signature: sig('order_A', 'pay_1'), order_id: 'o1' };
  let r = await h(post(body));
  assert.equal((await r.json()).success, true);
  assert.equal(orders[0].payment_status, 'paid');
  assert.equal(orders[0].order_status, 'confirmed');
  assert.equal(orders[0].payment_amount, 499);
  r = await h(post(body));
  assert.equal((await r.json()).already_processed, true);
});

test('verify: a payment for another order or a smaller amount is refused', async () => {
  const orders = [{ id: 'o1', razorpay_order_id: 'order_A', payment_status: 'pending', total_amount: 999 }];
  const h = await load('verify-razorpay-payment', { orders }, { pay_low: { order_id: 'order_A', status: 'captured', amount: 49900 }, pay_other: { order_id: 'order_Z', status: 'captured', amount: 99900 } });
  for (const p of ['pay_low', 'pay_other']) {
    const r = await h(post({ razorpay_order_id: 'order_A', razorpay_payment_id: p, razorpay_signature: sig('order_A', p), order_id: 'o1' }));
    assert.equal(r.status, 400, p);
    assert.equal(orders[0].payment_status, 'pending', p);
  }
});

const hook = (event) => {
  const raw = JSON.stringify(event);
  return post(raw, { 'x-razorpay-signature': createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex') });
};

test('webhook: signature required; captured marks paid once; under-payment is held for review', async () => {
  const orders = [{ id: 'o1', razorpay_order_id: 'order_A', payment_status: 'pending', total_amount: 499 }, { id: 'o2', razorpay_order_id: 'order_B', payment_status: 'pending', total_amount: 999 }];
  const h = await load('razorpay-webhook', { orders, order_items: [] });
  const bad = await h(post({ event: 'payment.captured' }, { 'x-razorpay-signature': 'nope' }));
  assert.equal(bad.status, 401);
  await h(hook({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_1', order_id: 'order_A', amount: 49900, status: 'captured' } } } }));
  assert.equal(orders[0].payment_status, 'paid');
  await h(hook({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_2', order_id: 'order_B', amount: 10000, status: 'captured' } } } }));
  assert.equal(orders[1].payment_status, 'pending');
  assert.match(orders[1].failure_reason, /review/);
  // a late "failed" event never downgrades a paid order
  await h(hook({ event: 'payment.failed', payload: { payment: { entity: { id: 'pay_x', order_id: 'order_A', amount: 49900, error_description: 'x' } } } }));
  assert.equal(orders[0].payment_status, 'paid');
});

test('create order: only genuine customer upload paths are accepted', async () => {
  const tables = { frame_sizes: [{ name: 'A4', slug: 'a4', base_price: 499, active: true }], frame_colours: [{ name: 'Black', slug: 'black', active: true }], orders: [], order_items: [] };
  const h = await load('create-razorpay-order', tables);
  const customer = { name: 'T', mobile: '9876543210', address: 'x', city: 'Thane', pin: '421302' };
  const item = (paths) => ({ legacyId: 'custom', name: 'Custom', qty: 1, price: 499, size: 'A4', colour: 'Black', artworkPaths: paths });
  let r = await h(post({ items: [item(['masters/p018/1793401485400.jpg'])], customer }));
  assert.equal(r.status, 400);
  r = await h(post({ items: [item(['3f2a9c1e-1b2c-4d5e-8f90-123456789abc/1793401485400-0.jpg'])], customer, founderDelivery: { fee: 5000 } }));
  assert.equal(r.status, 400);
  assert.equal(tables.orders.length, 0);
});
