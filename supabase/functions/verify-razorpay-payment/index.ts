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


// WhatsApp alert to the owner for each newly paid order (CallMeBot). Needs the
// secrets CALLMEBOT_PHONE (e.g. 918446440469) and CALLMEBOT_APIKEY; without
// them it does nothing. Never blocks or fails the payment flow.
async function notifyOwner(supabase: ReturnType<typeof createClient>, orderId: string) {
  const phone = Deno.env.get('CALLMEBOT_PHONE');
  const key = Deno.env.get('CALLMEBOT_APIKEY');
  if (!phone || !key) return;
  try {
    const { data: o } = await supabase.from('orders').select('order_number, total_amount, customer_name, city, notes').eq('id', orderId).maybeSingle();
    const { data: items } = await supabase.from('order_items').select('name, quantity, frame_size, frame_colour, artwork_paths').eq('order_id', orderId);
    if (!o) return;
    const lines = (items || []).map((i: { name: string; quantity: number; frame_size: string | null; frame_colour: string | null; artwork_paths: string[] | null }) => {
      const photos = i.artwork_paths?.length ? ` — ${i.artwork_paths.length} photo${i.artwork_paths.length > 1 ? 's' : ''} to print` : '';
      return `• ${i.name} · ${[i.frame_size, i.frame_colour].filter(Boolean).join(' ')} ×${i.quantity}${photos}`;
    });
    const text = [`New paid order ${o.order_number || ''}`, `Rs ${Math.round(Number(o.total_amount))} · ${o.customer_name} · ${o.city}`, ...lines, o.notes || '', 'Open: https://www.jhayra.com/admin/orders'].filter(Boolean).join('\n');
    await fetch(`https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(6000) });
  } catch (e) {
    console.error('Owner alert failed:', e);
  }
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

    // Only the first confirmation (here or the webhook) flips the order to
    // paid, so the owner alert is sent exactly once.
    const { data: changed } = await supabase.from('orders').update({
      razorpay_payment_id,
      razorpay_signature,
      payment_status: 'paid',
      payment_amount: order.total_amount,
      paid_at: new Date().toISOString(),
      order_status: 'confirmed',
    }).eq('id', order_id).neq('payment_status', 'paid').select('id');
    if (changed?.length) await notifyOwner(supabase, order_id);

    return json({ success: true, order_id });
  } catch (err) {
    console.error('verify-razorpay-payment error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
});
