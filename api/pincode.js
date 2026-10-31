// Pincode → city and state for checkout. Runs on our own domain so it works
// on networks that block or slow the India Post lookup service, and caches
// answers at the edge (pincodes don't change).
export const config = { runtime: 'edge' };

const json = (body, status = 200, cache = 'public, s-maxage=2592000, max-age=86400') =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': cache } });

export default async function handler(req) {
  const pin = new URL(req.url).searchParams.get('pin') || '';
  if (!/^[1-9]\d{5}$/.test(pin)) return json({ ok: false, reason: 'invalid' }, 400, 'no-store');
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: AbortSignal.timeout(4500), headers: { Accept: 'application/json' } });
      if (!r.ok) continue;
      const res = await r.json();
      const list = res?.[0]?.PostOffice || [];
      if (res?.[0]?.Status !== 'Success' || !list.length) return json({ ok: false, reason: 'not_found' });
      const po = list.find((p) => p.DeliveryStatus === 'Delivery') || list[0];
      return json({ ok: true, city: po.District || po.Name, state: po.State });
    } catch {
      /* retry once, then give up */
    }
  }
  return json({ ok: false, reason: 'unavailable' }, 503, 'no-store');
}
