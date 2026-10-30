// Bag totals: count, subtotal, coupon discount (a percentage, rounded to the
// rupee) and the amount payable. The payment function recomputes the charge
// on the server; this keeps what the customer sees in step with it.
export function cartTotals(items = [], coupon = null) {
  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const pct = Math.min(100, Math.max(0, Number(coupon?.discount) || 0));
  const discount = Math.round((subtotal * pct) / 100);
  return { count, subtotal, discount, total: Math.max(0, subtotal - discount) };
}
