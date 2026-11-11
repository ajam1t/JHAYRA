// Gift Reveal Edge Function tests: the real function source, bundled with
// esbuild, against an in-memory database and storage. No network, no real data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fakeDb, load } from './gift-reveal-harness.mjs';

const post = (body, headers = {}) => new Request('https://x/fn', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.2.3.4', ...headers }, body: JSON.stringify(body) });
const call = async (db, body, headers) => {
  const { handle } = await load();
  const r = await handle(post(body, headers), db);
  return { status: r.status, body: await r.json() };
};
const world = (over = {}) => {
  const tables = {
    orders: [{ id: 'o1', order_number: 'JHY-20261111-000001', customer_mobile: '+91 98765 43210', customer_name: 'Secret Name', customer_email: 'x@y.z', payment_status: 'paid', order_status: 'processing', total_amount: 999, ...over }],
    order_items: [
      { id: 'i1', order_id: 'o1', product_id: 'p1', name: 'Radha Krishna', frame_size: 'A3+', frame_colour: 'Black', frame_orientation: 'Vertical', quantity: 1, unit_price: 999, artwork_paths: [], customization: {}, created_at: '1' },
      { id: 'i2', order_id: 'o1', product_id: null, name: 'Our Story', frame_size: 'A4', frame_colour: 'White', frame_orientation: 'Vertical', quantity: 2, unit_price: 499, artwork_paths: ['o1/a.jpg'], customization: { source: 'template', templateId: 'tpl-1', transforms: { s1: {} }, texts: { hero: 'Us' }, artworkMeta: [{ path: 'o1/a.jpg', slot: 's1' }] }, created_at: '2' },
    ],
    product_images: [{ product_id: 'p1', url: 'https://img/p1.webp', is_primary: true, display_order: 0 }],
    gift_reveals: [],
    gift_reveal_attempts: [],
    profiles: [{ id: 'admin-1', role: 'admin' }],
  };
  const files = new Set();
  return { tables, files, db: fakeDb(tables, files) };
};
const content = (extra = {}) => ({ to: 'Meera', from: 'Aarav', occasion: 'Birthday', message: 'Happy birthday', theme: 'box', sound: true, photos: [], clip: null, ...extra });

test('orderState follows the real order status', async () => {
  const { orderState } = await load();
  assert.equal(orderState({ payment_status: 'paid', order_status: 'shipped' }), 'active');
  assert.equal(orderState({ payment_status: 'pending', order_status: 'pending' }), 'unpaid');
  assert.equal(orderState({ payment_status: 'paid', order_status: 'pending' }), 'unpaid');
  assert.equal(orderState({ payment_status: 'paid', order_status: 'delivered' }), 'delivered');
  assert.equal(orderState({ payment_status: 'paid', order_status: 'cancelled' }), 'cancelled');
  assert.equal(orderState({ payment_status: 'refunded', order_status: 'shipped' }), 'refunded');
});

test('verify: wrong mobile reveals nothing; right one returns the real gifts without prices or customer data', async () => {
  const { db, tables } = world();
  let r = await call(db, { action: 'verify', orderNumber: 'JHY-20261111-000001', mobile: '9999999999' });
  assert.equal(r.status, 404);
  assert.deepEqual(Object.keys(r.body), ['error']);
  r = await call(db, { action: 'verify', orderNumber: 'jhy-20261111-000001', mobile: '98765 43210' });
  assert.equal(r.status, 200);
  assert.equal(r.body.state, 'active');
  assert.equal(r.body.gifts.length, 2);
  assert.equal(r.body.gifts[0].image, 'https://img/p1.webp');
  assert.equal(r.body.gifts[1].preview.kind, 'template');
  assert.equal(r.body.gifts[1].preview.photos[0].slot, 's1');
  assert.equal(r.body.gifts[1].preview.photos[0].url, 'https://signed/o1/a.jpg');
  const text = JSON.stringify(r.body);
  for (const secret of ['999', 'Secret Name', 'x@y.z', '98765']) assert.ok(!text.includes(secret), `leaked ${secret}`);
  assert.equal(r.body.reveal, null);
  assert.equal(tables.gift_reveal_attempts.length, 2);
});

test('verify: brute force is rate-limited per order number', async () => {
  const { db } = world();
  for (let i = 0; i < 8; i++) await call(db, { action: 'verify', orderNumber: 'JHY-20261111-000001', mobile: '9000000000' });
  const r = await call(db, { action: 'verify', orderNumber: 'JHY-20261111-000001', mobile: '9876543210' });
  assert.equal(r.status, 429);
});

test('verify: inactive orders get only their state', async () => {
  for (const [over, state] of [[{ payment_status: 'pending', order_status: 'pending' }, 'unpaid'], [{ order_status: 'delivered' }, 'delivered'], [{ order_status: 'cancelled' }, 'cancelled'], [{ payment_status: 'refunded' }, 'refunded']]) {
    const { db } = world(over);
    const r = await call(db, { action: 'verify', orderNumber: 'JHY-20261111-000001', mobile: '9876543210' });
    assert.deepEqual(r.body, { state, hasReveal: false });
  }
});

test('one reveal per order: create once, second create is refused, edits keep the same link', async () => {
  const { db, tables, files } = world();
  const v = await call(db, { action: 'verify', orderNumber: 'JHY-20261111-000001', mobile: '9876543210' });
  const session = v.body.session;
  const up = await call(db, { action: 'upload', session, files: [{ type: 'image/jpeg' }, { type: 'audio/webm' }] });
  assert.equal(up.body.uploads.length, 2);
  const [photo, voice] = up.body.uploads.map((u) => u.path);
  assert.match(photo, /^[a-f0-9]{32}\/\d+-[a-f0-9]{12}\.jpg$/);
  assert.ok(!photo.includes('o1'), 'folder must not contain the order id');
  // files not uploaded yet → refused
  let r = await call(db, { action: 'save', session, mode: 'create', content: content({ photos: [photo] }) });
  assert.equal(r.status, 400);
  files.add(photo);
  files.add(voice);
  r = await call(db, { action: 'save', session, mode: 'create', content: content({ photos: [photo], clip: { path: voice, kind: 'voice', mime: 'audio/webm' } }) });
  assert.equal(r.status, 200);
  assert.equal(r.body.created, true);
  const token = r.body.reveal.token;
  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(tables.gift_reveals.length, 1);
  // a second create (another tab / device) inserts nothing
  r = await call(db, { action: 'save', session, mode: 'create', content: content({ to: 'Someone else' }) });
  assert.equal(r.status, 409);
  assert.equal(r.body.code, 'exists');
  assert.equal(r.body.reveal.content.to, 'Meera');
  assert.equal(tables.gift_reveals.length, 1);
  // edit: same token, edit_count up, removed files deleted
  r = await call(db, { action: 'save', session, mode: 'update', content: content({ message: 'Edited', photos: [photo] }) });
  assert.equal(r.status, 200);
  assert.equal(r.body.reveal.token, token);
  assert.equal(tables.gift_reveals[0].edit_count, 1);
  assert.equal(tables.gift_reveals[0].clip_path, null);
  assert.ok(!files.has(voice) && files.has(photo));
  // paths outside the order's folder are ignored
  r = await call(db, { action: 'save', session, mode: 'update', content: content({ photos: ['ffffffffffffffffffffffffffffffff/1700000000000-aaaaaaaaaaaa.jpg'] }) });
  assert.deepEqual(tables.gift_reveals[0].photos, []);
});

test('sessions: forged or tampered sessions are refused', async () => {
  const { db } = world();
  const v = await call(db, { action: 'verify', orderNumber: 'JHY-20261111-000001', mobile: '9876543210' });
  const [body, sig] = v.body.session.split('.');
  const forged = Buffer.from(JSON.stringify({ o: 'o2', e: Date.now() + 1e7 })).toString('base64url');
  for (const s of [`${forged}.${sig}`, `${body}.${sig.slice(0, -2)}xx`, 'nope', null]) {
    const r = await call(db, { action: 'save', session: s, mode: 'create', content: content() });
    assert.equal(r.status, 401);
  }
});

test('open: scheduled stays closed, published opens with gifts, delivery/cancel/refund close it', async () => {
  const { db, tables } = world();
  const v = await call(db, { action: 'verify', orderNumber: 'JHY-20261111-000001', mobile: '9876543210' });
  const later = new Date(Date.now() + 864e5).toISOString();
  const s = await call(db, { action: 'save', session: v.body.session, mode: 'create', content: content({ publishAt: later }) });
  const token = s.body.reveal.token;
  let r = await call(db, { action: 'open', token });
  assert.equal(r.body.status, 'scheduled');
  assert.ok(!('data' in r.body));
  tables.gift_reveals[0].publish_at = new Date(Date.now() - 1000).toISOString();
  r = await call(db, { action: 'open', token });
  assert.equal(r.body.status, 'ok');
  assert.equal(r.body.data.to, 'Meera');
  assert.equal(r.body.data.gifts.length, 2);
  const text = JSON.stringify(r.body);
  for (const secret of ['JHY-', 'o1"', 'Secret Name', '98765', '999']) assert.ok(!text.includes(secret), `leaked ${secret}`);
  assert.equal(tables.gift_reveals[0].views, 1);
  // admins opening it don't count as a view
  await call(db, { action: 'open', token }, { Authorization: 'Bearer admin-jwt' });
  assert.equal(tables.gift_reveals[0].views, 1);
  // a delivered order closes it, even though it was published
  tables.orders[0].order_status = 'delivered';
  assert.equal((await call(db, { action: 'open', token })).body.status, 'delivered');
  // and it can no longer be edited
  r = await call(db, { action: 'save', session: v.body.session, mode: 'update', content: content() });
  assert.equal(r.status, 409);
  assert.equal(r.body.state, 'delivered');
  tables.orders[0].order_status = 'cancelled';
  assert.equal((await call(db, { action: 'open', token })).body.status, 'closed');
  tables.orders[0].order_status = 'shipped';
  tables.orders[0].payment_status = 'refunded';
  assert.equal((await call(db, { action: 'open', token })).body.status, 'closed');
  assert.equal((await call(db, { action: 'open', token: 'A'.repeat(43) })).body.status, 'not_found');
  assert.equal((await call(db, { action: 'open', token: '../etc' })).body.status, 'not_found');
});

test('save: validation — names required, schedule within 120 days, unknown file types refused', async () => {
  const { db } = world();
  const v = await call(db, { action: 'verify', orderNumber: 'JHY-20261111-000001', mobile: '9876543210' });
  const session = v.body.session;
  assert.equal((await call(db, { action: 'save', session, mode: 'create', content: content({ to: ' ' }) })).status, 400);
  assert.equal((await call(db, { action: 'save', session, mode: 'create', content: content({ message: '' }) })).status, 400);
  assert.equal((await call(db, { action: 'save', session, mode: 'create', content: content({ publishAt: new Date(Date.now() + 200 * 864e5).toISOString() }) })).status, 400);
  assert.equal((await call(db, { action: 'upload', session, files: [{ type: 'application/x-msdownload' }] })).status, 400);
  assert.equal((await call(db, { action: 'save', session, mode: 'update', content: content() })).body.code, 'missing');
});
