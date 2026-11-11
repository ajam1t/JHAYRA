// Gift Reveal end-to-end: the built site in a real browser, talking to the REAL
// gift-reveal Edge Function code (bundled, run in this process) over an
// in-memory database and storage. Nothing touches production.
//
// Run:  npm run build && npx vite preview --port 4173 &
//       PW=<path to playwright> node tests/e2e/gift-reveal.mjs [outDir] [baseUrl]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fakeDb, load } from '../gift-reveal-harness.mjs';

const require = createRequire(import.meta.url);
const { chromium, devices } = require(process.env.PW);
const OUT = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'gift-reveal-'));
const BASE = process.argv[3] || 'http://localhost:4173';
const MEDIA = 'https://media.test/';
fs.mkdirSync(OUT, { recursive: true });

const tables = {
  orders: [
    { id: 'o1', order_number: 'JHY-20261111-000001', customer_mobile: '9876543210', customer_name: 'Test', payment_status: 'paid', order_status: 'processing' },
    { id: 'o2', order_number: 'JHY-20261111-000002', customer_mobile: '9876543210', customer_name: 'Test', payment_status: 'paid', order_status: 'delivered' },
  ],
  order_items: [
    { id: 'i1', order_id: 'o1', product_id: 'p1', name: 'Radha Krishna', frame_size: 'A3+', frame_colour: 'Black', frame_orientation: 'Vertical', quantity: 1, artwork_paths: [], customization: {}, created_at: '1' },
    { id: 'i2', order_id: 'o1', product_id: null, name: 'Years Together', frame_size: 'A4', frame_colour: 'White', frame_orientation: 'Vertical', quantity: 1, artwork_paths: ['art/a.jpg', 'art/b.jpg'], customization: { source: 'template', templateId: 'tmpl-years-together', transforms: { s1: {}, s2: {} }, texts: {}, artworkMeta: [{ path: 'art/a.jpg', slot: 's1' }, { path: 'art/b.jpg', slot: 's2' }] }, created_at: '2' },
  ],
  product_images: [{ product_id: 'p1', url: `${BASE}/Images/religious.jpg`, is_primary: true, display_order: 0 }],
  gift_reveals: [],
  gift_reveal_attempts: [],
  profiles: [],
};
const files = new Set();
const blobs = { 'art/a.jpg': fs.readFileSync('public/Images/canvas.jpg'), 'art/b.jpg': fs.readFileSync('public/Images/nature.jpg') };
const db = fakeDb(tables, files, MEDIA);
const { handle } = await load();

let pass = 0;
let fail = 0;
const check = (ok, name) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
  ok ? pass++ : fail++;
};
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };

async function wire(ctx) {
  await ctx.route('**/functions/v1/gift-reveal', async (r) => {
    if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 200, headers: cors });
    const res = await handle(new Request('https://fn/gift-reveal', { method: 'POST', headers: { 'content-type': 'application/json', ...r.request().headers() }, body: r.request().postData() }), db);
    r.fulfill({ status: res.status, headers: cors, contentType: 'application/json', body: await res.text() });
  });
  await ctx.route('**/storage/v1/object/upload/sign/gift-reveals/**', async (r) => {
    if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 200, headers: cors });
    const p = decodeURIComponent(new URL(r.request().url()).pathname.split('/gift-reveals/')[1]);
    const buf = r.request().postDataBuffer();
    // supabase-js sends a multipart form; keep the file part
    const s = buf.toString('latin1');
    const i = s.indexOf('\r\n\r\n');
    const j = s.lastIndexOf('\r\n--');
    blobs[p] = s.startsWith('--') && i > 0 && j > i ? Buffer.from(s.slice(i + 4, j), 'latin1') : buf;
    files.add(p);
    r.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ Key: `gift-reveals/${p}` }) });
  });
  await ctx.route(`${MEDIA}**`, (r) => {
    const p = r.request().url().slice(MEDIA.length);
    const b = blobs[p];
    if (!b) return r.fulfill({ status: 404 });
    r.fulfill({ status: 200, body: b, contentType: /\.jpg$/.test(p) ? 'image/jpeg' : /\.wav$/.test(p) ? 'audio/wav' : 'application/octet-stream' });
  });
}

const browser = await chromium.launch();
const errors = [];
try {
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  await wire(ctx);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));

  // 1 · verification: nothing shown before it; wrong mobile refused
  await page.goto(`${BASE}/gift-reveal`);
  await page.getByRole('heading', { name: 'Create your Gift Reveal' }).waitFor();
  check(!(await page.getByText('Radha Krishna').count()), 'no order data before verification');
  await page.getByLabel('Order number').fill('JHY-20261111-000001');
  await page.getByLabel('Mobile number').fill('9000000000');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('alert').waitFor();
  check(/couldn’t find an order/.test(await page.getByRole('alert').innerText()), 'wrong mobile is refused');

  // 2 · delivered order: closed
  await page.getByLabel('Order number').fill('JHY-20261111-000002');
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('This order has been delivered').waitFor();
  check(true, 'delivered order cannot create a reveal');
  await page.getByRole('button', { name: 'Check another order' }).click();

  // 3 · active order: the real gifts, names NOT auto-filled
  await page.getByLabel('Order number').fill('jhy-20261111-000001');
  await page.getByLabel('Mobile number').fill('98765 43210');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Order JHY-20261111-000001').waitFor();
  check((await page.locator('.gr-item').count()) === 2, 'both purchased gifts are shown');
  check((await page.locator('.gr-item .tc').count()) === 1, 'the customised template design is drawn');
  check((await page.getByLabel('Their name').inputValue()) === '' && (await page.getByLabel('Your name').inputValue()) === '', 'names are not auto-filled');
  await page.screenshot({ path: `${OUT}/1-order.png`, fullPage: true });

  // 4 · fill in and create
  await page.getByLabel('Their name').fill('Meera');
  await page.getByLabel('Your name').fill('Aarav');
  await page.getByRole('button', { name: 'Anniversary' }).click();
  await page.getByLabel('Your message').fill('Ten years, and every one of them a gift.');
  await page.locator('input[type=file][accept="image/*"]').setInputFiles(['public/Images/modern.jpg', 'public/Images/horses.jpg']);
  await page.locator('.gr-photo').nth(1).waitFor();
  await page.getByRole('button', { name: /Teddy Hug/ }).click();
  await page.getByRole('button', { name: 'Create my Gift Reveal' }).click();
  await page.getByText('Your Gift Reveal', { exact: true }).waitFor();
  const link = await page.getByLabel('Private reveal link').inputValue();
  check(/\/gift\/[A-Za-z0-9_-]{43}$/.test(link), 'private link with an unguessable token');
  check(!/JHY|o1|9876/.test(link), 'link carries no order or customer details');
  check(tables.gift_reveals.length === 1 && tables.gift_reveals[0].photos.length === 2, 'reveal saved with 2 photos');
  check(await page.locator('.gr-qr').waitFor({ timeout: 5000 }).then(() => true, () => false), 'QR code shown');
  await page.screenshot({ path: `${OUT}/2-created.png`, fullPage: true });

  // 5 · edit (same link), then try a second create in a fresh tab → it becomes an edit
  await page.getByLabel('Your message').fill('Ten years, and every one of them a gift. Here is to forever.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByRole('button', { name: 'Saved' }).waitFor();
  check(tables.gift_reveals[0].edit_count === 1 && /forever/.test(tables.gift_reveals[0].message), 'edit saved to the same reveal');
  check(link.endsWith(tables.gift_reveals[0].token), 'token unchanged by edits');

  const p2 = await ctx.newPage();
  await p2.goto(`${BASE}/gift-reveal`);
  await p2.getByLabel('Order number').fill('JHY-20261111-000001');
  await p2.getByLabel('Mobile number').fill('9876543210');
  await p2.getByRole('button', { name: 'Continue' }).click();
  await p2.getByText('Order JHY-20261111-000001').waitFor();
  check((await p2.getByLabel('Their name').inputValue()) === 'Meera', 'second visit opens the existing reveal for editing');
  check((await p2.getByRole('button', { name: 'Create my Gift Reveal' }).count()) === 0, 'no second create offered');
  await p2.close();

  // 6 · recipient: the full experience
  const r = await ctx.newPage();
  r.on('pageerror', (e) => errors.push(e.message));
  await r.goto(link.replace(/^https?:\/\/[^/]+/, BASE));
  await r.getByRole('button', { name: 'Open your gift reveal' }).waitFor();
  check(/Meera/.test(await r.locator('.grv-to').innerText()), 'welcome shows the recipient name');
  check((await r.locator('.grv-t-teddy').count()) === 1, 'chosen theme applied (Teddy Hug, one of the new six)');
  await r.screenshot({ path: `${OUT}/3-welcome.png` });
  await r.getByRole('button', { name: 'Open your gift reveal' }).tap({ force: true });
  await r.locator('.grv-memory').waitFor({ timeout: 6000 });
  check((await r.locator('.grv-photo-stack img').count()) === 2, 'memories: both photos');
  check(/forever/.test(await r.locator('.grv-msg').innerText()), 'memories: the edited message');
  await r.waitForTimeout(1200);
  await r.screenshot({ path: `${OUT}/4-memory.png` });
  await r.getByRole('button', { name: 'See your gifts' }).click();
  await r.locator('.grv-gift').waitFor();
  check(/Gift 1 of 2/.test(await r.locator('.grv-gift-nav').innerText()), 'both gifts in one reveal');
  check((await r.locator('.grv-gift-slide img[src*="religious"]').count()) === 1, 'real product image');
  check((await r.locator('.grv-gift-slide .tc').count()) === 1, 'real customised design');
  await r.waitForTimeout(1500);
  await r.screenshot({ path: `${OUT}/5-gift.png` });
  await r.getByRole('button', { name: 'Next gift' }).click();
  await r.waitForTimeout(900);
  await r.screenshot({ path: `${OUT}/6-gift2.png` });
  await r.getByRole('button', { name: 'Continue' }).click();
  await r.locator('.grv-thanks').waitFor();
  const closing = await r.locator('.grv-thanks').innerText();
  check(/Some gifts are opened\.\s*Some memories last forever\./.test(closing) && /Crafted with love by JHAYRA\./.test(closing), 'closing lines');
  await r.waitForTimeout(2600);
  await r.screenshot({ path: `${OUT}/7-closing.png` });
  check(tables.gift_reveals[0].views === 1, 'view counted');

  // 7 · schedule for later → recipient sees a countdown, no content
  await page.getByRole('button', { name: 'At a time I choose' }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByRole('button', { name: 'Saved' }).waitFor();
  await r.reload();
  await r.getByText('Not just yet…').waitFor();
  check((await r.locator('.grv-count').count()) === 1 && !(await r.getByText('Meera').count()), 'scheduled: countdown only');
  await r.screenshot({ path: `${OUT}/8-scheduled.png` });

  // 8 · delivered → closed, even before the scheduled time
  tables.orders[0].order_status = 'delivered';
  await r.reload();
  await r.getByText('Your gift has arrived').waitFor();
  check(true, 'delivered: reveal closed');
  await page.getByLabel('Your message').fill('one more edit');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByText('This order has been delivered').waitFor();
  check(true, 'delivered: edits refused');
  tables.orders[0].order_status = 'cancelled';
  await r.reload();
  await r.getByText('no longer available').waitFor();
  check(true, 'cancelled: reveal closed');
  await r.goto(`${BASE}/gift/${'A'.repeat(43)}`);
  await r.getByText('couldn’t find this reveal').waitFor();
  check(true, 'unknown token: not found');

  // 9 · layout: no horizontal overflow on phone
  tables.orders[0].order_status = 'processing';
  const w = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(w <= 0, `creator page fits the phone (${w}px)`);
} finally {
  check(!errors.length, `no page errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed · screenshots in ${OUT}`);
  process.exit(fail ? 1 : 0);
}
