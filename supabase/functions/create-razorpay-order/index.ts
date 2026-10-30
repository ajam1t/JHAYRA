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

// Gift card & hidden-price packing, charged once per order when chosen.
const GIFT_FEE = 100;

// Personalised (customer-photo) frames are made in these size/finish pairs —
// the same list the storefront offers (src/lib/frames.js CUSTOM).
const CUSTOM_COMBOS = new Set([
  'A4_Black', 'A3+_Black', '18 × 24_Black', '18 × 24_Gold', '24 × 36_Black', '24 × 36_Gold', '24 × 36_Brown',
]);

type Tables = {
  sizes: Map<string, { slug: string; base_price: number }>;
  colours: Map<string, { slug: string }>;
};

// Live frame tables: prices come from the database, so a price changed in the
// admin is what customers are charged.
async function loadTables(supabase: ReturnType<typeof createClient>): Promise<Tables> {
  const [{ data: sizes }, { data: colours }] = await Promise.all([
    supabase.from('frame_sizes').select('name, slug, base_price').eq('active', true),
    supabase.from('frame_colours').select('name, slug').eq('active', true),
  ]);
  return {
    sizes: new Map((sizes || []).map((r: { name: string; slug: string; base_price: number }) => [r.name, { slug: r.slug, base_price: Number(r.base_price) }])),
    colours: new Map((colours || []).map((r: { name: string; slug: string }) => [r.name, { slug: r.slug }])),
  };
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });

  try {
    const { items, customer, gift } = await req.json();

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

    const tables = await loadTables(supabase);

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
      artworkPaths: string[] | null;
      customization: unknown | null;
      qty: number;
      price: number;
    }> = [];

    for (const item of items) {
      const { legacyId, name, qty, price, size, colour, orientation, category, artworkPaths, customization } = item;
      const cleanArtwork = Array.isArray(artworkPaths)
        ? artworkPaths.filter((p: unknown) => typeof p === 'string').slice(0, 20)
        : null;

      if (!legacyId || !qty || qty < 1 || qty > 50) {
        return json({ error: `Invalid item: ${legacyId}` }, 400);
      }
      // Signature pieces are sold through the concierge (WhatsApp) until this
      // function applies Signature pricing — see docs/SIGNATURE.md.
      if (item.signature) {
        return json({ error: 'Signature pieces are confirmed by our concierge on WhatsApp.' }, 400);
      }
      if (!price || price < 1 || price > 100000) {
        return json({ error: `Invalid price for: ${legacyId}` }, 400);
      }

      // Personalized custom frames have no catalog row (legacy_id 'custom' is not
      // seeded). Price comes from the live frame_sizes table
      // and record with product_id null (order_items.product_id is nullable).
      if (legacyId === 'custom') {
        if (!size || !colour) {
          return json({ error: 'Custom frame is missing its size/colour selection' }, 400);
        }
        const sizeRow = tables.sizes.get(size);
        if (!sizeRow || !tables.colours.has(colour) || !CUSTOM_COMBOS.has(`${size}_${colour}`)) {
          return json({ error: `Invalid frame option: ${size} / ${colour}` }, 400);
        }
        const framePriceMin = sizeRow.base_price;
        subtotal += framePriceMin * qty;
        validatedItems.push({
          productDbId: null,
          legacyId: 'custom',
          name: name || 'Custom Photo Frame',
          category: category || 'personalized',
          size,
          colour,
          orientation: orientation || null,
          artworkPaths: cleanArtwork,
          customization: customization ?? null,
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
      // validate against the live frame tables and product options.
      // Otherwise fall back to the product's base price.
      let expectedPrice = Number(product.price);
      if (size || colour) {
        // The size and finish must be offered for this product; the price is
        // the product's override for that size, else the size's base price.
        const sizeRow = size ? tables.sizes.get(size) : null;
        const colourRow = colour ? tables.colours.get(colour) : null;
        if ((size && !sizeRow) || (colour && !colourRow)) {
          return json({ error: `Invalid frame option: ${size} / ${colour}` }, 400);
        }
        const { data: opts } = await supabase
          .from('product_options')
          .select('option_type, option_slug, price_override')
          .eq('product_id', product.id);
        const offered = (type: string, slug: string) => !(opts || []).some((o: { option_type: string }) => o.option_type === type) || (opts || []).some((o: { option_type: string; option_slug: string }) => o.option_type === type && o.option_slug === slug);
        if ((sizeRow && !offered('size', sizeRow.slug)) || (colourRow && !offered('colour', colourRow.slug))) {
          return json({ error: `Option not available for: ${legacyId}` }, 400);
        }
        if (sizeRow) {
          const override = (opts || []).find((o: { option_type: string; option_slug: string; price_override: number | null }) => o.option_type === 'size' && o.option_slug === sizeRow.slug && o.price_override != null);
          expectedPrice = override ? Number(override.price_override) : sizeRow.base_price;
        }
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
        artworkPaths: cleanArtwork,
        customization: customization ?? null,
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

    const giftFee = gift === true || (Array.isArray(items) && items.some((i: { customization?: { gift?: unknown } }) => i?.customization?.gift)) ? GIFT_FEE : 0;
    const totalAmount = Math.max(0, subtotal - discountAmount) + giftFee;
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
      notes: giftFee ? `Gift card: ₹${giftFee}` : null,
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
      artwork_paths: item.artworkPaths,
      customization: item.customization,
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
