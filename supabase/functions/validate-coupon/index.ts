import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Coupon codes live in the coupons table (Admin → Coupons) — never shipped to
// the browser. A code is valid while active and inside its optional dates.
async function couponPercent(code: string): Promise<number | null> {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data } = await supabase.from('coupons').select('percent, active, starts_at, ends_at').eq('code', code).maybeSingle();
  const now = Date.now();
  if (!data || !data.active) return null;
  if (data.starts_at && new Date(data.starts_at).getTime() > now) return null;
  if (data.ends_at && new Date(data.ends_at).getTime() < now) return null;
  return Number(data.percent) || null;
}

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

    const discount = /^[A-Z0-9]{3,20}$/.test(code) ? await couponPercent(code) : null;
    if (discount) {
      return json({ valid: true, discount });
    }
    return json({ valid: false });
  } catch {
    return json({ valid: false }, 400);
  }
});
