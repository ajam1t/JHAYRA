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
      // City: among the offices that deliver, the Head Post Office's district,
      // else the most common one. (The first delivering office can sit in a
      // neighbouring district — 400001's is Elephanta Caves in Raigarh, though
      // the pincode is Mumbai GPO.)
      const pool = list.filter((p) => p.DeliveryStatus === 'Delivery');
      const from = pool.length ? pool : list;
      const tally = {};
      for (const p of from) if (p.District) tally[p.District] = (tally[p.District] || 0) + 1;
      const head = from.find((p) => /head post office/i.test(p.BranchType || ''));
      const district = head?.District || Object.keys(tally).sort((x, y) => tally[y] - tally[x])[0];
      const po = from.find((p) => p.District === district) || from[0];
      // Post-office localities under this pincode, so the customer can pick theirs.
      const areas = [...new Set(list.filter((p) => p.DeliveryStatus === 'Delivery').map((p) => p.Name.replace(/\s*\((?:[^)]*)\)\s*$/, '').trim()))].sort().slice(0, 40);
      return json({ ok: true, city: po.District || po.Name, state: po.State, areas });
    } catch {
      /* retry once, then give up */
    }
  }
  return json({ ok: false, reason: 'unavailable' }, 503, 'no-store');
}
