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
  if (computed !== incomingSig) {
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
    await supabase.from('orders').update({
      razorpay_payment_id: payment.id,
      payment_status: 'paid',
      payment_amount: Number(payment.amount) / 100,
      paid_at: new Date().toISOString(),
      order_status: 'confirmed',
    }).eq('id', order.id);
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
