import Icon from './Icon';
import { deliveryTimeline } from '../lib/site';

// Today's order, when it ships and when it should arrive, from the shop's
// standard timelines (made in 1–2 business days, then 5–7 in transit).
export default function DeliveryTimeline({ from }) {
  const t = deliveryTimeline(from);
  const steps = [
    ['bag', t.placed, 'Order placed'],
    ['truck', `${t.ship[0]} – ${t.ship[1]}`, 'Dispatched'],
    ['box', `${t.arrive[0]} – ${t.arrive[1]}`, 'Estimated delivery*'],
  ];
  return (
    <div className="dt">
      <ol className="dt-steps">
        {steps.map(([ic, when, label], i) => (
          <li key={label} style={{ '--i': i }}>
            <span className="dt-ic">
              <Icon name={ic} size={26} stroke={1.4} />
              <span className="dt-ok">
                <Icon name="check" size={10} stroke={3} />
              </span>
            </span>
            <b>{when}</b>
            <small>{label}</small>
          </li>
        ))}
      </ol>
      <p className="dt-note">*Free delivery across India. Business days, excluding Sundays; for very remote pincodes, WhatsApp us to confirm.</p>
    </div>
  );
}
