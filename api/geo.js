// Approximate visitor location for anonymous analytics: country, Indian
// state and city, read from Vercel's edge headers. The IP address itself is
// never returned or stored.
export const config = { runtime: 'edge' };

const STATES = {
  AN: 'Andaman & Nicobar', AP: 'Andhra Pradesh', AR: 'Arunachal Pradesh', AS: 'Assam', BR: 'Bihar', CH: 'Chandigarh',
  CT: 'Chhattisgarh', CG: 'Chhattisgarh', DH: 'Dadra & Nagar Haveli and Daman & Diu', DN: 'Dadra & Nagar Haveli and Daman & Diu', DD: 'Dadra & Nagar Haveli and Daman & Diu',
  DL: 'Delhi', GA: 'Goa', GJ: 'Gujarat', HP: 'Himachal Pradesh', HR: 'Haryana', JH: 'Jharkhand', JK: 'Jammu & Kashmir',
  KA: 'Karnataka', KL: 'Kerala', LA: 'Ladakh', LD: 'Lakshadweep', MH: 'Maharashtra', ML: 'Meghalaya', MN: 'Manipur',
  MP: 'Madhya Pradesh', MZ: 'Mizoram', NL: 'Nagaland', OR: 'Odisha', OD: 'Odisha', PB: 'Punjab', PY: 'Puducherry',
  RJ: 'Rajasthan', SK: 'Sikkim', TN: 'Tamil Nadu', TG: 'Telangana', TS: 'Telangana', TR: 'Tripura', UP: 'Uttar Pradesh',
  UK: 'Uttarakhand', UT: 'Uttarakhand', WB: 'West Bengal',
};

const clean = (v, n = 60) => (v ? decodeURIComponent(v).replace(/[^\p{L}\p{N} .,'&-]/gu, '').slice(0, n) : null);

export default function handler(req) {
  const h = req.headers;
  const country = clean(h.get('x-vercel-ip-country'), 2);
  const region = clean(h.get('x-vercel-ip-country-region'), 3);
  const state = country === 'IN' ? STATES[region] || null : country ? `Outside India (${country})` : null;
  const body = { country, state, city: clean(h.get('x-vercel-ip-city')) };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' } });
}
