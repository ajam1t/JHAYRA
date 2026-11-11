import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/* JHAYRA Gift Reveal — one reveal per order, valid until the order is delivered.

   Actions (POST JSON { action, ... }):
     verify  { orderNumber, mobile }      → proves ownership (order number + checkout mobile),
                                            returns a 2-hour session, the actual gifts and any existing reveal
     upload  { session, files:[{type}] }  → signed upload URLs into the reveal's private folder
     save    { session, mode, content }   → create (once) or edit the order's reveal
     open    { token }                    → the recipient's view, if published and the order is still on its way

   Never returned to a recipient: the order number, the order id, customer details or prices. */

const ALLOWED_ORIGINS = ['https://jhayra.com', 'https://www.jhayra.com', 'http://localhost:5173', 'http://localhost:5176', 'http://localhost:4173'];
const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) ? origin : 'https://jhayra.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  Vary: 'Origin',
});

const BUCKET = 'gift-reveals';
const ART_BUCKET = 'customer-artwork';
const ACTIVE = ['confirmed', 'personalization', 'processing', 'shipped'];
const OCCASIONS = ['Birthday', 'Anniversary', 'Wedding', 'Housewarming', 'Festival', 'Thank you', 'Just because'];
const THEMES = ['envelope', 'box', 'night', 'bloom', 'balloons', 'teddy', 'locket', 'butterfly', 'diya'];
const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
  'audio/webm': 'weba', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3', 'audio/ogg': 'ogg', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/aac': 'aac',
};
const SESSION_MS = 2 * 60 * 60 * 1000;
const MAX_FAILS_PER_ORDER = 8; // per hour
const MAX_FAILS_PER_IP = 25; // per hour

type Order = { id: string; order_number: string; customer_mobile: string; payment_status: string; order_status: string };

export function orderState(o: { payment_status: string; order_status: string }) {
  if (o.payment_status === 'refunded') return 'refunded';
  if (o.order_status === 'cancelled') return 'cancelled';
  if (o.order_status === 'delivered') return 'delivered';
  if (o.payment_status !== 'paid' || !ACTIVE.includes(o.order_status)) return 'unpaid';
  return 'active';
}
const last10 = (s: string) => String(s || '').replace(/\D/g, '').slice(-10);

/* ── signing ─────────────────────────────────────────────────────────── */
const enc = new TextEncoder();
const b64u = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
let keyP: Promise<CryptoKey> | null = null;
const signKey = () => (keyP ||= crypto.subtle.importKey('raw', enc.encode(`${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}:gift-reveal-v1`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']));
const hmac = async (msg: string) => new Uint8Array(await crypto.subtle.sign('HMAC', await signKey(), enc.encode(msg)));
const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
const folderFor = async (orderId: string) => hex(await hmac(`folder:${orderId}`)).slice(0, 32);
async function makeSession(orderId: string) {
  const body = b64u(enc.encode(JSON.stringify({ o: orderId, e: Date.now() + SESSION_MS })));
  return `${body}.${b64u(await hmac(`session:${body}`))}`;
}
async function readSession(s: unknown): Promise<string | null> {
  if (typeof s !== 'string' || !s.includes('.')) return null;
  const [body, sig] = s.split('.');
  const want = b64u(await hmac(`session:${body}`));
  if (want.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff) return null;
  try {
    const { o, e } = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof o === 'string' && e > Date.now() ? o : null;
  } catch {
    return null;
  }
}
const newToken = () => b64u(crypto.getRandomValues(new Uint8Array(32)));
const randHex = (n: number) => hex(crypto.getRandomValues(new Uint8Array(n)));

/* ── data helpers ────────────────────────────────────────────────────── */
type DB = ReturnType<typeof createClient>;

async function signedUrls(db: DB, bucket: string, paths: string[], secs = 3600) {
  const out: Record<string, string> = {};
  const list = [...new Set(paths.filter(Boolean))];
  if (!list.length) return out;
  const { data } = await db.storage.from(bucket).createSignedUrls(list, secs);
  (data || []).forEach((r: { path: string | null; signedUrl: string }) => r.path && r.signedUrl && (out[r.path] = r.signedUrl));
  return out;
}

// The actual purchased gifts: name, options, real product image and the
// customer's customised preview (template data + short-lived photo links).
async function giftsFor(db: DB, orderId: string) {
  const { data: items } = await db.from('order_items').select('id, product_id, legacy_id, name, frame_size, frame_colour, frame_orientation, quantity, artwork_paths, customization').eq('order_id', orderId).order('created_at');
  const rows = (items || []) as Array<Record<string, any>>;
  const pids = rows.map((r) => r.product_id).filter(Boolean);
  const images: Record<string, string> = {};
  if (pids.length) {
    const { data: imgs } = await db.from('product_images').select('product_id, url, is_primary, display_order').in('product_id', pids);
    ((imgs || []) as Array<Record<string, any>>)
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || (a.display_order ?? 0) - (b.display_order ?? 0))
      .forEach((i) => (images[i.product_id] ||= i.url));
  }
  const art = await signedUrls(db, ART_BUCKET, rows.flatMap((r) => r.artwork_paths || []));
  return rows.map((r) => {
    const c = r.customization || {};
    const paths: string[] = r.artwork_paths || [];
    let preview: Record<string, unknown> | null = null;
    if (c.source === 'template' && (c.templateSnapshot || c.templateId)) {
      preview = {
        kind: 'template',
        template: c.templateSnapshot || null,
        templateId: c.templateId || null,
        transforms: c.transforms || {},
        texts: c.textsRaw || c.texts || {},
        calendar: c.calendar || null,
        photos: paths.map((p, i) => ({ url: art[p] || null, slot: (c.artworkMeta || []).find((m: any) => m.path === p)?.slot || Object.keys(c.transforms || {})[i] || null })),
      };
    } else if (paths.length && art[paths[0]]) {
      preview = { kind: 'photo', url: art[paths[0]] };
    }
    return {
      name: r.name || 'Your JHAYRA gift',
      qty: r.quantity || 1,
      size: r.frame_size || null,
      colour: r.frame_colour || null,
      orientation: r.frame_orientation || null,
      image: r.product_id ? images[r.product_id] || null : null,
      preview,
    };
  });
}

async function revealView(db: DB, rev: Record<string, any>) {
  const media = await signedUrls(db, BUCKET, [...(rev.photos || []), rev.clip_path].filter(Boolean));
  return {
    to: rev.recipient_name,
    from: rev.sender_name,
    occasion: rev.occasion,
    message: rev.message,
    theme: rev.theme,
    sound: rev.sound,
    photos: (rev.photos || []).map((p: string) => ({ path: p, url: media[p] || null })).filter((p: { url: string | null }) => p.url),
    clip: rev.clip_path && media[rev.clip_path] ? { path: rev.clip_path, kind: rev.clip_kind, mime: rev.clip_mime, url: media[rev.clip_path] } : null,
  };
}

const summary = (rev: Record<string, any>) => ({
  token: rev.token,
  publish_at: rev.publish_at,
  views: rev.views,
  first_opened_at: rev.first_opened_at,
  created_at: rev.created_at,
  updated_at: rev.updated_at,
});

async function isAdmin(db: DB, req: Request) {
  const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!jwt || jwt.startsWith('sb_')) return false;
  try {
    const { data } = await db.auth.getUser(jwt);
    if (!data?.user) return false;
    const { data: p } = await db.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
    return p?.role === 'admin';
  } catch {
    return false;
  }
}

/* ── handler ─────────────────────────────────────────────────────────── */
export async function handle(req: Request, db: DB): Promise<Response> {
  const origin = req.headers.get('Origin');
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors(origin), 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(origin) });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  const loadOrder = async (id: string) => (await db.from('orders').select('id, order_number, customer_mobile, payment_status, order_status').eq('id', id).maybeSingle()).data as Order | null;

  /* verify ─────────────────────────────────────────────────────────── */
  if (body.action === 'verify') {
    const num = String(body.orderNumber || '').trim().toUpperCase();
    const mob = last10(body.mobile);
    if (!/^[A-Z0-9-]{6,40}$/.test(num) || mob.length !== 10) return json({ error: 'Please enter your order number and the 10-digit mobile number used at checkout.' }, 400);
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    const since = new Date(Date.now() - 3600_000).toISOString();
    const [{ count: byNum }, { count: byIp }] = await Promise.all([
      db.from('gift_reveal_attempts').select('id', { count: 'exact', head: true }).eq('order_number', num).eq('ok', false).gte('at', since),
      ip ? db.from('gift_reveal_attempts').select('id', { count: 'exact', head: true }).eq('ip', ip).eq('ok', false).gte('at', since) : Promise.resolve({ count: 0 }),
    ]);
    if ((byNum || 0) >= MAX_FAILS_PER_ORDER || (byIp || 0) >= MAX_FAILS_PER_IP) return json({ error: 'Too many attempts. Please try again in an hour, or WhatsApp us.' }, 429);
    const { data: order } = await db.from('orders').select('id, order_number, customer_mobile, payment_status, order_status').eq('order_number', num).maybeSingle();
    const ok = !!order && last10((order as Order).customer_mobile) === mob;
    await db.from('gift_reveal_attempts').insert({ order_number: num, ip, ok });
    if (!ok) return json({ error: 'We couldn’t find an order with that number and mobile. Please check both — the order number is in your confirmation.' }, 404);
    const o = order as Order;
    const state = orderState(o);
    const { data: rev } = await db.from('gift_reveals').select('*').eq('order_id', o.id).maybeSingle();
    if (state !== 'active') return json({ state, hasReveal: !!rev });
    return json({
      state,
      orderNumber: o.order_number,
      orderStatus: o.order_status,
      session: await makeSession(o.id),
      gifts: await giftsFor(db, o.id),
      reveal: rev ? { ...summary(rev as Record<string, any>), content: await revealView(db, rev as Record<string, any>) } : null,
    });
  }

  /* upload / save need a verified, still-active order ──────────────── */
  if (body.action === 'upload' || body.action === 'save') {
    const orderId = await readSession(body.session);
    if (!orderId) return json({ error: 'Your session has ended. Please enter your order details again.', code: 'session' }, 401);
    const o = await loadOrder(orderId);
    if (!o) return json({ error: 'Order not found.' }, 404);
    const state = orderState(o);
    if (state !== 'active') return json({ error: state === 'delivered' ? 'This order has been delivered, so its Gift Reveal can no longer be changed.' : 'This order is no longer active, so a Gift Reveal can’t be saved.', state }, 409);
    const folder = await folderFor(o.id);

    if (body.action === 'upload') {
      const files = Array.isArray(body.files) ? body.files.slice(0, 5) : [];
      const out = [];
      for (const f of files) {
        const ext = MIME_EXT[String(f?.type || '').split(';')[0]];
        if (!ext) return json({ error: 'That file type isn’t supported. Please use JPG/PNG/WebP photos and MP4/WebM/MP3/M4A media.' }, 400);
        const path = `${folder}/${Date.now()}-${randHex(6)}.${ext}`;
        const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
        if (error || !data) return json({ error: 'Upload could not be prepared. Please try again.' }, 500);
        out.push({ path, token: data.token });
      }
      return json({ uploads: out });
    }

    // save
    const c = body.content || {};
    const clean = (v: unknown, n: number) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, n);
    const recipient = clean(c.to, 40);
    const sender = clean(c.from, 40);
    const message = clean(c.message, 600);
    const occasion = OCCASIONS.includes(c.occasion) ? c.occasion : null;
    const theme = THEMES.includes(c.theme) ? c.theme : null;
    const inFolder = (p: unknown) => typeof p === 'string' && p.startsWith(`${folder}/`) && /^[a-f0-9]{32}\/\d{10,16}-[a-f0-9]{12}\.[a-z0-9]{2,5}$/.test(p);
    const photos: string[] = Array.isArray(c.photos) ? c.photos.filter(inFolder).slice(0, 4) : [];
    const clip = c.clip && inFolder(c.clip.path) && ['video', 'voice'].includes(c.clip.kind) ? { path: c.clip.path, kind: c.clip.kind, mime: clean(c.clip.mime, 60) } : null;
    if (!recipient || !sender) return json({ error: 'Please add the recipient’s name and your name.' }, 400);
    if (!occasion || !theme) return json({ error: 'Please choose an occasion and a reveal style.' }, 400);
    if (!message && !photos.length) return json({ error: 'Please add a message or at least one photo.' }, 400);
    let publishAt = new Date();
    if (c.publishAt) {
      const t = new Date(c.publishAt);
      if (isNaN(t.getTime())) return json({ error: 'Please choose a valid reveal date and time.' }, 400);
      if (t.getTime() > Date.now() + 120 * 864e5) return json({ error: 'Please schedule the reveal within the next 120 days.' }, 400);
      publishAt = t.getTime() < Date.now() ? new Date() : t;
    }
    // every referenced file must really exist in this order's folder
    const { data: listed } = await db.storage.from(BUCKET).list(folder, { limit: 100 });
    const present = new Set(((listed || []) as Array<{ name: string }>).map((f) => `${folder}/${f.name}`));
    const missing = [...photos, ...(clip ? [clip.path] : [])].filter((p) => !present.has(p));
    if (missing.length) return json({ error: 'Some of your files didn’t finish uploading. Please add them again.' }, 400);

    const fields = {
      recipient_name: recipient,
      sender_name: sender,
      occasion,
      message,
      theme,
      sound: c.sound !== false,
      photos,
      clip_path: clip?.path || null,
      clip_kind: clip?.kind || null,
      clip_mime: clip?.mime || null,
      publish_at: publishAt.toISOString(),
    };
    let row: Record<string, any> | null = null;
    let created = false;
    if (body.mode === 'create') {
      // One per order, enforced by the unique key: a second (or simultaneous) create inserts nothing.
      const { data: ins } = await db.from('gift_reveals').upsert({ order_id: o.id, token: newToken(), media_folder: folder, ...fields }, { onConflict: 'order_id', ignoreDuplicates: true }).select('*');
      if (ins && ins.length) {
        row = ins[0] as Record<string, any>;
        created = true;
      } else {
        const { data: existing } = await db.from('gift_reveals').select('*').eq('order_id', o.id).maybeSingle();
        return json({ error: 'A Gift Reveal already exists for this order — you can edit it instead.', code: 'exists', reveal: existing ? { ...summary(existing as Record<string, any>), content: await revealView(db, existing as Record<string, any>) } : null }, 409);
      }
    } else {
      const { data: cur } = await db.from('gift_reveals').select('edit_count').eq('order_id', o.id).maybeSingle();
      if (!cur) return json({ error: 'There is no Gift Reveal for this order yet.', code: 'missing' }, 404);
      const { data: upd } = await db.from('gift_reveals').update({ ...fields, edit_count: ((cur as any).edit_count || 0) + 1, updated_at: new Date().toISOString() }).eq('order_id', o.id).select('*');
      row = (upd && upd[0]) as Record<string, any>;
    }
    // tidy: remove files no longer used by the reveal
    const keep = new Set([...photos, ...(clip ? [clip.path] : [])]);
    const stale = [...present].filter((p) => !keep.has(p));
    if (stale.length) await db.storage.from(BUCKET).remove(stale);
    return json({ created, reveal: { ...summary(row!), content: await revealView(db, row!) } });
  }

  /* open (recipient) ───────────────────────────────────────────────── */
  if (body.action === 'open') {
    const token = String(body.token || '');
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return json({ status: 'not_found' });
    const { data: rev } = await db.from('gift_reveals').select('*').eq('token', token).maybeSingle();
    if (!rev) return json({ status: 'not_found' });
    const r = rev as Record<string, any>;
    const o = await loadOrder(r.order_id);
    const state = o ? orderState(o) : 'cancelled';
    if (state === 'delivered') return json({ status: 'delivered' });
    if (state !== 'active') return json({ status: 'closed' });
    if (new Date(r.publish_at).getTime() > Date.now()) return json({ status: 'scheduled', publish_at: r.publish_at });
    if (!(await isAdmin(db, req))) {
      await db.from('gift_reveals').update({ views: (r.views || 0) + 1, first_opened_at: r.first_opened_at || new Date().toISOString() }).eq('id', r.id);
    }
    return json({ status: 'ok', data: { ...(await revealView(db, r)), gifts: await giftsFor(db, r.order_id) } });
  }

  return json({ error: 'Unknown action' }, 400);
}

if (typeof Deno !== 'undefined' && !(globalThis as any).__GIFT_REVEAL_TEST__) {
  serve((req) => handle(req, createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)).catch((e) => {
    console.error('gift-reveal error', e);
    return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), { status: 500, headers: { ...cors(req.headers.get('Origin')), 'Content-Type': 'application/json' } });
  }));
}
