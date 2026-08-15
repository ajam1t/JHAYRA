import SEO from '../components/SEO';

export default function Refund() {
  return (
    <div data-page="refund">
      <SEO
        title="Returns & Refund Policy | JHAYRA"
        description="JHAYRA's hassle-free 7-day return policy. Returns on eligible orders — damaged or defective items replaced at no cost. Contact us on WhatsApp to initiate a return."
        path="/refund"
      />
      <div className="page-hero"><div className="container"><p className="eyebrow">Legal</p><h1>Returns &amp; Refunds</h1><p>Hassle-free 7-day return policy</p></div></div>
      <div className="container">
        <div className="legal-wrap" style={{maxWidth:'720px',margin:'2rem auto 4rem',lineHeight:1.85}}>
          <h2>Return Policy</h2>
          <p>We want you to love your JHAYRA purchase. If you're not satisfied, you may return it within 7 days of delivery for a replacement or refund.</p>
          <h2>Eligibility</h2>
          <p>Items must be returned in original condition and packaging. Personalised items are non-returnable unless damaged or defective.</p>
          <h2>How to Return</h2>
          <p>Contact us via WhatsApp at +91 70707 28989 with your order ID and reason for return. We'll arrange a pickup at no additional cost.</p>
          <h2>Refund Timeline</h2>
          <p>Once we receive and inspect the returned item, refunds are processed within 5–7 business days to your original payment method.</p>
          <h2>Damaged Items</h2>
          <p>If your item arrives damaged, please share photos via WhatsApp within 48 hours of delivery. We'll replace it at no cost.</p>
        </div>
      </div>
    </div>
  );
}
