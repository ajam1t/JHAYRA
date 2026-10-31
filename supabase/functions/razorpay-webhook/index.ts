import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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


// WhatsApp alert to the owner for each newly paid order (CallMeBot). Needs the
// secrets CALLMEBOT_PHONE (e.g. 917070728989) and CALLMEBOT_APIKEY; without
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
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const rawBody = await req.text();
  const incomingSig = req.headers.get('x-razorpay-signature') ?? '';
  const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ?? '';

  if (!webhookSecret) {
    console.error('RAZORPAY_WEBHOOK_SECRET not set');
    return new Response('Configuration error', { status: 500 });
  }

  const computed = await hmacSHA256(rawBody, webhookSecret);
  const timingSafeEqual = (a: string, b: string): boolean => {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return result === 0;
  };
  if (!timingSafeEqual(computed, incomingSig)) {
    console.error('Invalid webhook signature');
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const eventType = event.event as string;
  const payment = (event.payload as Record<string, { entity: Record<string, unknown> }>)?.payment?.entity;

  if (!payment) return new Response(JSON.stringify({ received: true }), { status: 200 });

  const razorpayOrderId = payment.order_id as string;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: order } = await supabase
    .from('orders')
    .select('id, payment_status')
    .eq('razorpay_order_id', razorpayOrderId)
    .maybeSingle();

  if (!order) {
    // Order not found — log and acknowledge (Razorpay expects 200)
    console.warn('Webhook: order not found for razorpay_order_id', razorpayOrderId);
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  if (eventType === 'payment.captured' && order.payment_status !== 'paid') {
    const { data: changed } = await supabase.from('orders').update({
      razorpay_payment_id: payment.id,
      payment_status: 'paid',
      payment_amount: Number(payment.amount) / 100,
      paid_at: new Date().toISOString(),
      order_status: 'confirmed',
    }).eq('id', order.id).neq('payment_status', 'paid').select('id');
    if (changed?.length) await notifyOwner(supabase, order.id);
  } else if (eventType === 'payment.failed' && order.payment_status === 'pending') {
    await supabase.from('orders').update({
      payment_status: 'failed',
      failure_reason: (payment.error_description as string) || 'Payment failed',
    }).eq('id', order.id);
  }
  // All other events: acknowledge without action (idempotent)

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
