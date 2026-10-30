import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = ['https://jhayra.com', 'https://www.jhayra.com', 'http://localhost:5173', 'http://localhost:5176'];

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : 'https://jhayra.com';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}

async function hmacSHA256(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      return json({ error: 'Missing payment verification fields' }, 400);
    }

    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const expected = await hmacSHA256(`${razorpay_order_id}|${razorpay_payment_id}`, keySecret);
    const isValid = timingSafeEqual(expected, razorpay_signature);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (!isValid) {
      await supabase.from('orders').update({
        payment_status: 'failed',
        failure_reason: 'Signature verification failed',
      }).eq('id', order_id);
      return json({ success: false, error: 'Payment verification failed' }, 400);
    }

    // Fetch the order — confirm it belongs to this Razorpay order ID
    const { data: order } = await supabase
      .from('orders')
      .select('id, razorpay_order_id, payment_status, total_amount')
      .eq('id', order_id)
      .eq('razorpay_order_id', razorpay_order_id)
      .maybeSingle();

    if (!order) return json({ success: false, error: 'Order not found' }, 404);

    // Idempotency — already marked paid (webhook may have beaten us)
    if (order.payment_status === 'paid') {
      return json({ success: true, order_id, already_processed: true });
    }

    await supabase.from('orders').update({
      razorpay_payment_id,
      razorpay_signature,
      payment_status: 'paid',
      payment_amount: order.total_amount,
      paid_at: new Date().toISOString(),
      order_status: 'confirmed',
    }).eq('id', order_id);

    return json({ success: true, order_id });
  } catch (err) {
    console.error('verify-razorpay-payment error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
});
