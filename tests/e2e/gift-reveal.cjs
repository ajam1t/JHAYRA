// Gift Reveal end-to-end test against a simulated backend that follows the same
// rules as docs/sql/2026-11-10-gift-reveals.sql. Nothing touches production.
//
// Run:  npm run build && npx vite preview --port 4173 &
//       PW=<path to playwright> node tests/e2e/gift-reveal.cjs [outDir] [baseUrl]
// (Playwright is not a project dependency; point PW at any installed copy.)
const { chromium } = require(process.env.PW);
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const ROOT = path.resolve(__dirname, '../..');
const S = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'gift-reveal-'));
const BASE = process.argv[3] || 'http://localhost:4173';
fs.mkdirSync(S + '/gr', { recursive: true });
// a 2-second voice note (440 Hz tone) for the upload test
const VOICE = S + '/gr/voice.wav';
{
  const sr = 22050, n = sr * 2, d = Buffer.alloc(44 + n * 2);
  d.write('RIFF', 0); d.writeUInt32LE(36 + n * 2, 4); d.write('WAVEfmt ', 8); d.writeUInt32LE(16, 16); d.writeUInt16LE(1, 20); d.writeUInt16LE(1, 22);
  d.writeUInt32LE(sr, 24); d.writeUInt32LE(sr * 2, 28); d.writeUInt16LE(2, 32); d.writeUInt16LE(16, 34); d.write('data', 36); d.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) d.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / sr) * 12000), 44 + i * 2);
  fs.writeFileSync(VOICE, d);
}
const db = { reveals: {}, files: {} };
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

async function mock(ctx) {
  await ctx.route('**/rest/v1/rpc/*_gift_reveal', async (r) => {
    if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 200, headers: cors });
    const fn = r.request().url().split('/rpc/')[1].split('?')[0];
    const a = JSON.parse(r.request().postData() || '{}');
    const ok = (body) => r.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify(body) });
    const bad = (m) => r.fulfill({ status: 400, headers: cors, contentType: 'application/json', body: JSON.stringify({ message: m }) });
    if (fn === 'create_gift_reveal') {
      if (!a.p_payload || a.p_payload.length < 40 || a.p_payload.length > 60000) return bad('invalid payload');
      if (![7, 30, 90].includes(a.p_days)) return bad('invalid expiry');
      if ((a.p_media || []).length > 6 || (a.p_media || []).some((m) => !/^[a-f0-9]{32}\.bin$/.test(m))) return bad('invalid file');
      const id = crypto.randomBytes(16).toString('hex');
      db.reveals[id] = { payload: a.p_payload, media: a.p_media || [], manage: sha(a.p_manage_secret), expires: Date.now() + a.p_days * 864e5, revoked: false, deleted: false, views: 0 };
      return ok(id);
    }
    const x = db.reveals[a.p_id];
    if (fn === 'open_gift_reveal') {
      if (!x || x.deleted) return ok({ status: 'not_found' });
      if (x.revoked) return ok({ status: 'off' });
      if (x.expires < Date.now()) return ok({ status: 'expired' });
      if (a.p_count !== false) x.views++;
      return ok({ status: 'ok', payload: x.payload, media: x.media, expires_at: new Date(x.expires).toISOString() });
    }
    if (fn === 'manage_gift_reveal') {
      if (!x || x.deleted || x.manage !== sha(a.p_manage_secret || '')) return ok({ status: 'not_found' });
      if (a.p_action === 'off') x.revoked = true;
      else if (a.p_action === 'on') x.revoked = false;
      else if (a.p_action === 'extend') x.expires = Date.now() + a.p_days * 864e5;
      else if (a.p_action === 'delete') { x.deleted = true; x.payload = ''; return ok({ status: 'deleted' }); }
      return ok({ status: 'ok', revoked: x.revoked, expires_at: new Date(x.expires).toISOString(), expired: x.expires < Date.now(), views: x.views, first_opened_at: null });
    }
    return bad('unknown');
  });
  await ctx.route('**/storage/v1/object/gift-reveals/**', async (r) => {
    const m = r.request().method();
    if (m === 'OPTIONS') return r.fulfill({ status: 200, headers: cors });
    const name = r.request().url().split('/gift-reveals/')[1].split('?')[0];
    if (m === 'POST') {
      if (!/^[a-f0-9]{32}\.bin$/.test(name)) return r.fulfill({ status: 403, headers: cors, body: '{}' });
      // uploads arrive as multipart form data: keep only the file part
      let buf = r.request().postDataBuffer();
      const ct = r.request().headers()['content-type'] || '';
      const bm = ct.match(/boundary=(.+)$/);
      if (bm) {
        const head = buf.indexOf(Buffer.from('filename='));
        const start = buf.indexOf(Buffer.from('\r\n\r\n'), head) + 4;
        const end = buf.indexOf(Buffer.from('\r\n--' + bm[1]), start);
        buf = buf.subarray(start, end);
      }
      db.files[name] = buf;
      return r.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ Key: name }) });
    }
    // readable only while an active reveal lists it (the storage rule)
    const live = Object.values(db.reveals).some((x) => x.media.includes(name) && !x.revoked && !x.deleted && x.expires > Date.now());
    if (!live || !db.files[name]) return r.fulfill({ status: 400, headers: cors, contentType: 'application/json', body: JSON.stringify({ error: 'not found' }) });
    return r.fulfill({ status: 200, headers: cors, contentType: 'application/octet-stream', body: db.files[name] });
  });
}

const results = [];
const check = (name, pass, extra = '') => { results.push(pass); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); };

(async () => {
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const vp = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1.5 };
  // ── sender ──
  const sctx = await b.newContext({ ...vp, permissions: ['clipboard-read', 'clipboard-write'] }); await mock(sctx);
  const s = await sctx.newPage(); const errs = []; s.on('pageerror', (e) => errs.push(e.message));
  await s.goto(BASE + '/gift-reveal/?nointro', { waitUntil: 'networkidle' }); await s.waitForTimeout(800);
  await s.screenshot({ path: S + '/gr/c-0.png' });
  await s.getByPlaceholder('e.g. Meera').fill('Meera'); await s.getByPlaceholder('e.g. Aarav').fill('Aarav');
  await s.getByRole('button', { name: 'Anniversary', exact: true }).click();
  await s.locator('textarea').fill('Five years, and I would choose you again every single day.\nHappy anniversary, my love.');
  await s.locator('input[type=file][accept="image/*"]').setInputFiles([ROOT + '/public/samples/couple-3.webp', ROOT + '/public/samples/couple-1.webp']); await s.waitForTimeout(1500);
  check('two photos added', (await s.locator('.gr-photo').count()) === 2);
  await s.locator('input[type=file][accept="video/*,audio/*"]').setInputFiles(VOICE); await s.waitForTimeout(500);
  check('voice file attached', (await s.locator('.gr-clip audio').count()) === 1);
  await s.getByPlaceholder('Search our designs…').fill('Radha'); await s.waitForTimeout(600);
  await s.locator('.gr-gift').first().click();
  check('gift selected', (await s.locator('.gr-gift[aria-pressed="true"]').count()) === 1);
  await s.locator('.gr-theme').nth(1).click();
  await s.locator('.gr-theme').first().scrollIntoViewIfNeeded(); await s.waitForTimeout(300); await s.screenshot({ path: S + '/gr/c-1.png' });
  // preview = the same experience
  await s.getByRole('button', { name: /Preview the reveal/ }).click(); await s.waitForTimeout(1200);
  check('preview shows recipient name', (await s.locator('.grv-to').innerText()).includes('Meera'));
  await s.screenshot({ path: S + '/gr/p-0.png' });
  await s.locator('.grv-opener').tap({ force: true }); await s.waitForTimeout(1300); await s.screenshot({ path: S + '/gr/p-1.png' });
  await s.waitForTimeout(2600); await s.screenshot({ path: S + '/gr/p-2.png' });
  check('preview reaches the memory with the message', (await s.locator('.grv-msg').innerText()).includes('Five years'));
  await s.getByRole('button', { name: 'Close preview' }).click();
  check('nothing uploaded before creating', Object.keys(db.files).length === 0 && Object.keys(db.reveals).length === 0);
  await s.getByRole('button', { name: /Create my reveal link/ }).click();
  await s.waitForSelector('.gr-done', { timeout: 30000 }); await s.waitForTimeout(800);
  const link = await s.locator('.gr-link input').inputValue();
  check('link has an unguessable id and a key after #', /\/gift\/[a-f0-9]{32}#[A-Za-z0-9_-]{43}$/.test(link), link.replace(/#.*/, '#<key>'));
  check('QR code generated', (await s.locator('.gr-qr').getAttribute('src')).startsWith('data:image/png'));
  await s.screenshot({ path: S + '/gr/c-2.png', fullPage: false });
  const id = link.match(/gift\/([a-f0-9]{32})/)[1]; const rec = db.reveals[id];
  check('3 encrypted files stored (2 photos + voice)', rec.media.length === 3 && rec.media.every((m) => db.files[m]));
  const plain = ['Meera', 'Aarav', 'Five years', 'Anniversary', 'Radha'];
  check('stored message is ciphertext (no names or words readable)', !plain.some((w) => rec.payload.includes(w) || Buffer.from(rec.payload, 'base64').toString('latin1').includes(w)));
  const f0 = db.files[rec.media[0]];
  check('stored photo is ciphertext (not a JPEG)', !(f0[0] === 0xff && f0[1] === 0xd8) && !f0.includes(Buffer.from('JFIF')));
  check('the key never reached the server', !JSON.stringify(rec).includes(link.split('#')[1]));
  // ── recipient: a different browser with no saved data ──
  const rctx = await b.newContext(vp); await mock(rctx);
  const r = await rctx.newPage(); r.on('pageerror', (e) => errs.push('recipient: ' + e.message));
  const local = link.replace('https://www.jhayra.com', BASE);
  await r.goto(local, { waitUntil: 'networkidle' }); await r.waitForSelector('.grv-to', { timeout: 20000 }); await r.waitForTimeout(900);
  check('recipient sees their name and the invitation', (await r.locator('.grv-to').innerText()).includes('Meera') && (await r.locator('.grv-line').first().innerText()).includes('beautiful memory waiting'));
  check('no shop header or nav on the reveal', (await r.locator('header.header, .bottom-nav, .wa-fab').count()) === 0);
  await r.screenshot({ path: S + '/gr/r-0.png' });
  await r.locator('.grv-opener').tap({ force: true }); await r.waitForTimeout(1200); await r.screenshot({ path: S + '/gr/r-1.png' });
  await r.waitForSelector('.grv-memory', { timeout: 8000 }); await r.waitForTimeout(1500);
  const img = await r.locator('.grv-photo-stack img.on').evaluate((i) => ({ w: i.naturalWidth, src: i.src.slice(0, 5) }));
  check('photo decrypted and shown', img.w > 300 && img.src === 'blob:', `${img.w}px wide`);
  check('message and sender shown', (await r.locator('.grv-msg').innerText()).includes('choose you again') && (await r.locator('.grv-from').innerText()).includes('Aarav'));
  await r.screenshot({ path: S + '/gr/r-2.png' });
  await r.locator('.grv-clip-load').click(); await r.waitForSelector('.grv-audio', { timeout: 10000 });
  const dur = await r.locator('.grv-audio').evaluate((a) => new Promise((res) => (a.readyState >= 1 ? res(a.duration) : (a.onloadedmetadata = () => res(a.duration)))));
  check('voice note decrypted and playable', dur > 1.5 && dur < 2.5, `${dur.toFixed(2)} s`);
  await r.getByRole('button', { name: /Continue/ }).click(); await r.waitForTimeout(1800);
  check('final surprise line', (await r.locator('.grv-forever h2').innerText()).replace(/\s+/g, ' ').includes('A memory, crafted to stay forever.'));
  await r.screenshot({ path: S + '/gr/r-3.png' });
  await r.getByRole('button', { name: /See your gift/ }).click(); await r.waitForTimeout(2200);
  const gimg = await r.locator('.grv-frame img').evaluate((i) => new Promise((res) => (i.complete ? res(i.naturalWidth) : (i.onload = () => res(i.naturalWidth), i.onerror = () => res(0)))));
  check('gift product image shown with "on its way"', gimg > 100 && (await r.locator('.grv-onway').innerText()).includes('on its way'), await r.locator('.grv-product').innerText());
  await r.screenshot({ path: S + '/gr/r-4.png' });
  await r.getByRole('button', { name: /Continue/ }).click(); await r.waitForTimeout(1500);
  check('closing with sender and JHAYRA branding', (await r.locator('.grv-thanks h2').innerText()).includes('Aarav') && (await r.locator('.grv-tagline').innerText()).includes('Crafting Memories Into Art'));
  await r.screenshot({ path: S + '/gr/r-5.png' });
  check('view was counted', rec.views === 1);
  // ── privacy controls ──
  const open = async (u) => { const p = await rctx.newPage(); await p.goto(u, { waitUntil: 'networkidle' }); await p.waitForSelector('.grv-state h1, .grv-to', { timeout: 15000 }); const t = await p.locator('.grv-state h1, .grv-to').first().innerText(); await p.close(); return t; };
  check('link without the key is refused', (await open(local.split('#')[0])).includes('incomplete'));
  check('wrong key cannot decrypt', (await open(local.split('#')[0] + '#' + 'A'.repeat(43))).includes('doesn’t open'));
  check('guessing another id finds nothing', (await open(BASE + '/gift/' + 'ab'.repeat(16) + '#' + link.split('#')[1])).includes('couldn’t find'));
  // sender switches it off from "Your gift reveals"
  await s.getByRole('button', { name: 'Switch off' }).first().click(); await s.waitForTimeout(900);
  check('sender switched the link off', rec.revoked === true && (await s.locator('.gr-badge').first().innerText()).includes('Switched off'));
  check('recipient now sees it resting', (await open(local)).includes('resting'));
  check('encrypted files unreadable while off', await rctx.request.get('https://gwxdzemazqontjobqnyy.supabase.co/storage/v1/object/gift-reveals/' + rec.media[0]).then((x) => x.status() !== 200).catch(() => true));
  await s.getByRole('button', { name: 'Switch on' }).first().click(); await s.waitForTimeout(900);
  check('switched back on, opens again', (await open(local)).includes('Meera'));
  rec.expires = Date.now() - 1000;
  check('expired link is closed', (await open(local)).includes('closed'));
  rec.expires = Date.now() + 864e5;
  s.once('dialog', (d) => d.accept());
  await s.getByRole('button', { name: 'Delete' }).first().click(); await s.waitForTimeout(900);
  check('deleted: message erased and link gone', rec.deleted && rec.payload === '' && (await open(local)).includes('couldn’t find'));
  check('no page errors', errs.length === 0, errs.join(' | ').slice(0, 200));
  console.log(`\n${results.filter(Boolean).length}/${results.length} checks passed`);
  fs.writeFileSync(S + '/gr/result.json', JSON.stringify({ pass: results.filter(Boolean).length, total: results.length }));
  await b.close();
})().catch((e) => { console.error('TEST CRASH', e.message.split('\n')[0]); process.exit(1); });
