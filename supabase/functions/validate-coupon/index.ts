import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Coupon codes live here only — never shipped to the browser
const VALID_COUPONS: Record<string, number> = { JHAYRA10: 10, JHAYRA15: 15 };

const ALLOWED_ORIGINS = [
  'https://jhayra.com',
  'https://www.jhayra.com',
  'http://localhost:5173',
  'http://localhost:5176',
];

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : 'https://jhayra.com';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();
    const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';
    if (!code) return json({ valid: false }, 400);

    const discount = VALID_COUPONS[code];
    if (discount !== undefined) {
      return json({ valid: true, discount });
    }
    return json({ valid: false });
  } catch {
    return json({ valid: false }, 400);
  }
});
