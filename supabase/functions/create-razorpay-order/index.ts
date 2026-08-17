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

const VALID_COUPONS: Record<string, number> = { JHAYRA10: 10, JHAYRA15: 15 };

// Server-authoritative frame prices — must stay in sync with src/data/frameOptions.js
const FRAME_PRICES: Record<string, number> = {
  'A4_Black':       499,
  'A3+_Black':      999,
  '18 × 24_Black': 1499,
  '18 × 24_Gold':  1499,
  '24 × 36_Black': 2999,
  '24 × 36_Gold':  2999,
  '24 × 36_Brown': 2999,
};

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });

  try {
    const { items, customer } = await req.json();

    // Basic shape validation
    if (!Array.isArray(items) || !items.length) return json({ error: 'No items' }, 400);
    if (!customer?.name?.trim()) return json({ error: 'Customer name required' }, 400);
    if (!customer?.mobile?.trim()) return json({ error: 'Customer mobile required' }, 400);
    if (!/^\d{10}$/.test(customer.mobile.replace(/\D/g, ''))) {
      return json({ error: 'Mobile number must be exactly 10 digits' }, 400);
    }
    if (!customer?.address?.trim() || !customer?.city?.trim() || !customer?.pin?.trim()) {
      return json({ error: 'Delivery address incomplete' }, 400);
    }
    if (!/^\d{6}$/.test(customer.pin)) return json({ error: 'Invalid pincode' }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Validate each item against Supabase and accumulate server-side subtotal
    let subtotal = 0;
    const validatedItems: Array<{
      productDbId: string | null;
      legacyId: string;
      name: string;
      category: string | null;
      size: string | null;
      colour: string | null;
      orientation: string | null;
      qty: number;
      price: number;
    }> = [];

    for (const item of items) {
      const { legacyId, name, qty, price, size, colour, orientation, category } = item;

      if (!legacyId || !qty || qty < 1 || qty > 50) {
        return json({ error: `Invalid item: ${legacyId}` }, 400);
      }
      if (!price || price < 1 || price > 100000) {
        return json({ error: `Invalid price for: ${legacyId}` }, 400);
      }

      // Personalized custom frames have no catalog row (legacy_id 'custom' is not
      // seeded). Price is fully frame-authoritative — validate against FRAME_PRICES
      // and record with product_id null (order_items.product_id is nullable).
      if (legacyId === 'custom') {
        if (!size || !colour) {
          return json({ error: 'Custom frame is missing its size/colour selection' }, 400);
        }
        const frameKey = `${size}_${colour}`;
        const framePriceMin = FRAME_PRICES[frameKey];
        if (framePriceMin === undefined) {
          return json({ error: `Invalid frame option: ${size} / ${colour}` }, 400);
        }
        if (price < framePriceMin) {
          return json({ error: `Price below minimum for: ${legacyId}` }, 400);
        }
        subtotal += framePriceMin * qty;
        validatedItems.push({
          productDbId: null,
          legacyId: 'custom',
          name: name || 'Custom Photo Frame',
          category: category || 'personalized',
          size,
          colour,
          orientation: orientation || null,
          qty,
          price: framePriceMin,
        });
        continue;
      }

      // Confirm product exists and is active in Supabase
      const { data: product, error } = await supabase
        .from('products')
        .select('id, legacy_id, name, price, active')
        .eq('legacy_id', legacyId)
        .maybeSingle();

      if (error || !product) return json({ error: `Product not found: ${legacyId}` }, 400);
      if (!product.active) return json({ error: `Product unavailable: ${legacyId}` }, 400);

      // Server-side price validation: if a frame size+colour is specified,
      // validate against the authoritative FRAME_PRICES table.
      // Otherwise fall back to the product's base price.
      let expectedPrice = Number(product.price);
      if (size && colour) {
        const frameKey = `${size}_${colour}`;
        const framePriceMin = FRAME_PRICES[frameKey];
        if (framePriceMin === undefined) {
          return json({ error: `Invalid frame option: ${size} / ${colour}` }, 400);
        }
        expectedPrice = framePriceMin;
      }
      if (price < expectedPrice) {
        return json({ error: `Price below minimum for: ${legacyId}` }, 400);
      }

      subtotal += expectedPrice * qty;
      validatedItems.push({
        productDbId: product.id,
        legacyId,
        name: name || product.name,
        category: category || null,
        size: size || null,
        colour: colour || null,
        orientation: orientation || null,
        qty,
        price: expectedPrice,
      });
    }

    // Server-side coupon validation
    let discountAmount = 0;
    const coupon = customer.coupon?.trim().toUpperCase();
    if (coupon && VALID_COUPONS[coupon]) {
      discountAmount = Math.round(subtotal * VALID_COUPONS[coupon] / 100);
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);
    const amountPaise = Math.round(totalAmount * 100); // Razorpay uses paise

    if (amountPaise < 100) return json({ error: 'Order total too low (minimum ₹1)' }, 400);

    // Create Razorpay order (server-side only)
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const auth = btoa(`${keyId}:${keySecret}`);

    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
        notes: {
          customer_name: customer.name,
          customer_mobile: customer.mobile,
          customer_email: customer.email || '',
        },
      }),
    });

    if (!rzpRes.ok) {
      const err = await rzpRes.text();
      console.error('Razorpay error:', err);
      return json({ error: 'Payment gateway error. Please try again.' }, 502);
    }

    const rzpOrder = await rzpRes.json();

    // Persist order to Supabase (service role — bypasses RLS)
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        customer_name: customer.name.trim(),
        customer_email: customer.email?.trim() || null,
        customer_mobile: customer.mobile.trim(),
        address: customer.address.trim(),
        city: customer.city.trim(),
        state: customer.state?.trim() || null,
        pin: customer.pin.trim(),
        subtotal,
        discount_amount: discountAmount,
        coupon_code: coupon || null,
        shipping: 0,
        total_amount: totalAmount,
        razorpay_order_id: rzpOrder.id,
        payment_status: 'pending',
        currency: 'INR',
        order_status: 'pending',
      })
      .select('id, order_number')
      .single();

    if (orderErr) {
      console.error('Order insert error:', orderErr);
      return json({ error: 'Failed to create order record' }, 500);
    }

    // Persist order items
    const orderItemsData = validatedItems.map((item) => ({
      order_id: order.id,
      product_id: item.productDbId,
      legacy_id: item.legacyId,
      name: item.name,
      category: item.category,
      frame_size: item.size,
      frame_colour: item.colour,
      frame_orientation: item.orientation,
      quantity: item.qty,
      unit_price: item.price,
      total_price: item.price * item.qty,
    }));

    const { error: itemsErr } = await supabase.from('order_items').insert(orderItemsData);
    if (itemsErr) {
      console.error('Order items insert error:', itemsErr);
      // Prevent orphaned orders — mark as cancelled so admin can see the failure
      await supabase.from('orders').update({
        order_status: 'cancelled',
        notes: `Auto-cancelled: order items failed to persist — ${itemsErr.message}`,
      }).eq('id', order.id);
      return json({ error: 'Failed to record order details. Please try again or contact support.' }, 500);
    }

    // Return ONLY what the frontend needs
    return json({
      razorpay_order_id: rzpOrder.id,
      amount: amountPaise,
      currency: 'INR',
      key_id: keyId,
      order_id: order.id,
      order_number: order.order_number,
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
});
