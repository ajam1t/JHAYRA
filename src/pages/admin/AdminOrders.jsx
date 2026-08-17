import { useEffect, useState, Fragment } from 'react';
import { supabase } from '../../lib/supabase';

const STATUS_COLOR = {
  paid: '#22873A',
  pending: '#c9a96e',
  failed: '#e05c5c',
  refunded: '#888',
};

const ORDER_STATUS_COLOR = {
  confirmed: '#22873A',
  pending: '#c9a96e',
  personalization: '#9b59b6',
  processing: '#4a90d9',
  shipped: '#4a90d9',
  delivered: '#22873A',
  cancelled: '#e05c5c',
};

const s = {
  heading: { fontFamily: 'var(--fd, serif)', fontSize: '1.5rem', color: '#c9a96e', marginBottom: '1.5rem' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#111', borderRadius: '10px', overflow: 'hidden', fontSize: '.82rem' },
  th: { padding: '.75rem 1rem', textAlign: 'left', color: '#666', fontWeight: 500, fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', borderBottom: '1px solid #1e1e1e' },
  td: { padding: '.75rem 1rem', borderBottom: '1px solid #1a1a1a', color: '#c8c0b4', verticalAlign: 'top' },
  badge: (color) => ({ display: 'inline-block', padding: '.2rem .55rem', borderRadius: '4px', fontSize: '.7rem', fontWeight: 600, background: `${color}22`, color }),
  detail: { background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '1rem 1.25rem', marginTop: '1rem' },
  detailRow: { display: 'flex', gap: '.5rem', marginBottom: '.4rem', fontSize: '.8rem' },
  detailLabel: { color: '#666', minWidth: '120px', flexShrink: 0 },
  detailVal: { color: '#c8c0b4' },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [orderItems, setOrderItems] = useState({});
  const [statusError, setStatusError] = useState(null);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      setOrders(data || []);
      setLoading(false);
    }
    load();
  }, []);

  async function toggleExpand(orderId) {
    if (expanded === orderId) { setExpanded(null); return; }
    setExpanded(orderId);
    if (orderItems[orderId]) return;
    const { data } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);
    setOrderItems((prev) => ({ ...prev, [orderId]: data || [] }));
  }

  async function updateOrderStatus(orderId, field, value) {
    setStatusError(null);
    const ALLOWED_FIELDS = ['order_status'];
    if (!ALLOWED_FIELDS.includes(field)) return;
    const { error } = await supabase.from('orders').update({ [field]: value }).eq('id', orderId);
    if (error) {
      setStatusError(`Failed to update status to "${value}": ${error.message}`);
      return;
    }
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, [field]: value } : o));
  }

  if (loading) return <div style={{ color: '#666', padding: '2rem' }}>Loading orders…</div>;

  return (
    <div>
      <h1 style={s.heading}>Orders</h1>
      {statusError && (
        <div style={{ background: '#3a0000', border: '1px solid #e05c5c', borderRadius: '6px', color: '#e05c5c', fontSize: '.82rem', padding: '.65rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{statusError}</span>
          <button onClick={() => setStatusError(null)} style={{ background: 'none', border: 'none', color: '#e05c5c', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>✕</button>
        </div>
      )}
      {orders.length === 0 ? (
        <div style={{ color: '#666', fontSize: '.9rem' }}>No orders yet.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Order ID</th>
                <th style={s.th}>Customer</th>
                <th style={s.th}>Amount</th>
                <th style={s.th}>Payment</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Date</th>
                <th style={s.th} />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <Fragment key={o.id}>
                  <tr style={{ cursor: 'pointer' }} onClick={() => toggleExpand(o.id)}>
                    <td style={s.td}>
                      <span style={{ fontFamily: 'monospace', fontSize: '.75rem', color: '#888' }}>
                        {o.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={{ fontWeight: 600, color: '#e8e0d4' }}>{o.customer_name}</div>
                      <div style={{ fontSize: '.72rem', color: '#666' }}>{o.customer_mobile}</div>
                    </td>
                    <td style={s.td}>
                      <span style={{ fontWeight: 700, color: '#c9a96e' }}>
                        ₹{Number(o.total_amount).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span style={s.badge(STATUS_COLOR[o.payment_status] || '#888')}>
                        {o.payment_status}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span style={s.badge(ORDER_STATUS_COLOR[o.order_status] || '#888')}>
                        {o.order_status}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span style={{ color: '#666', fontSize: '.75rem' }}>
                        {new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span style={{ color: '#555', fontSize: '.8rem' }}>{expanded === o.id ? '▲' : '▼'}</span>
                    </td>
                  </tr>
                  {expanded === o.id && (
                    <tr>
                      <td colSpan={7} style={{ ...s.td, background: '#0d0d0d', padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '1.5rem' }}>
                          <div>
                            <div style={{ fontSize: '.72rem', color: '#666', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '.5rem' }}>Customer</div>
                            {[
                              ['Name', o.customer_name],
                              ['Mobile', o.customer_mobile],
                              ['Email', o.customer_email || '—'],
                              ['Address', `${o.address}, ${o.city}${o.state ? ', ' + o.state : ''} - ${o.pin}`],
                            ].map(([label, val]) => (
                              <div key={label} style={s.detailRow}>
                                <span style={s.detailLabel}>{label}</span>
                                <span style={s.detailVal}>{val}</span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <div style={{ fontSize: '.72rem', color: '#666', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '.5rem' }}>Payment</div>
                            {[
                              ['Subtotal', `₹${Number(o.subtotal).toLocaleString('en-IN')}`],
                              ['Discount', o.discount_amount > 0 ? `−₹${Number(o.discount_amount).toLocaleString('en-IN')} (${o.coupon_code})` : '—'],
                              ['Total', `₹${Number(o.total_amount).toLocaleString('en-IN')}`],
                              ['Razorpay Order', o.razorpay_order_id || '—'],
                              ['Razorpay Payment', o.razorpay_payment_id || '—'],
                              ['Paid At', o.paid_at ? new Date(o.paid_at).toLocaleString('en-IN') : '—'],
                              ['Failure', o.failure_reason || '—'],
                            ].map(([label, val]) => (
                              <div key={label} style={s.detailRow}>
                                <span style={s.detailLabel}>{label}</span>
                                <span style={{ ...s.detailVal, fontFamily: label.includes('Razorpay') ? 'monospace' : 'inherit', fontSize: label.includes('Razorpay') ? '.72rem' : 'inherit', wordBreak: 'break-all' }}>{val}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Items */}
                        <div style={{ marginTop: '1rem' }}>
                          <div style={{ fontSize: '.72rem', color: '#666', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '.5rem' }}>Items</div>
                          {(orderItems[o.id] || []).map((item) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.4rem 0', borderBottom: '1px solid #1a1a1a', fontSize: '.8rem' }}>
                              <div>
                                <span style={{ color: '#e8e0d4' }}>{item.name}</span>
                                {item.frame_size && <span style={{ color: '#666', marginLeft: '.4rem' }}>{item.frame_size} · {item.frame_colour}</span>}
                                {item.frame_orientation && <span style={{ color: '#666', marginLeft: '.4rem' }}>· {item.frame_orientation}</span>}
                                <span style={{ color: '#666', marginLeft: '.4rem' }}>× {item.quantity}</span>
                                <span style={{ color: '#555', marginLeft: '.4rem' }}>(₹{Number(item.unit_price).toLocaleString('en-IN')} ea)</span>
                              </div>
                              <span style={{ color: '#c9a96e', fontWeight: 600 }}>₹{Number(item.total_price).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                          {!orderItems[o.id] && <span style={{ color: '#666', fontSize: '.78rem' }}>Loading…</span>}
                        </div>

                        {/* Update order status */}
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: '.75rem', color: '#666' }}>Update order status:</span>
                          {['pending', 'confirmed', 'personalization', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
                            <button
                              key={st}
                              onClick={(e) => { e.stopPropagation(); updateOrderStatus(o.id, 'order_status', st); }}
                              style={{ padding: '.25rem .6rem', borderRadius: '4px', border: `1px solid ${o.order_status === st ? ORDER_STATUS_COLOR[st] : '#333'}`, background: o.order_status === st ? `${ORDER_STATUS_COLOR[st]}22` : 'transparent', color: o.order_status === st ? ORDER_STATUS_COLOR[st] : '#666', cursor: 'pointer', fontSize: '.72rem' }}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
