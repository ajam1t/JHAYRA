import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function Refund() {
  return (
    <div data-page="refund">
      <SEO
        title="Refund Policy | JHAYRA"
        description="JHAYRA's refund and replacement policy. Personalized products are made to order. Replacement support is available for eligible issues — damaged items, quality defects and incorrect personalization."
        path="/refund"
      />
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow">Legal</p>
          <h1>Refund Policy</h1>
          <p>Personalized products, made exclusively for you</p>
        </div>
      </div>
      <div className="container">
        <div className="legal-wrap" style={{ maxWidth: '720px', margin: '2rem auto 4rem', lineHeight: 1.85 }}>
          <h2>Personalized &amp; Made-to-Order Products</h2>
          <p>
            All JHAYRA products are personalized and made to order specifically for each customer.
            Because every piece is created exclusively for you, we are generally unable to accept
            returns or issue financial refunds for a change of mind, personal preference, or an
            incorrect choice made by the customer.
          </p>
          <p>
            We encourage you to carefully review all personalization details — spelling, names, dates,
            photographs, and product specifications — before placing your order.
          </p>

          <h2>Replacement Support</h2>
          <p>
            If your order arrives damaged, defective, or does not match the personalization details
            confirmed in your order, please contact us. JHAYRA will assess the situation and, where
            eligible, arrange a replacement at no additional cost to you.
          </p>
          <p>
            Eligible replacement cases include: product damaged during delivery, incorrect
            personalization created by JHAYRA, wrong product received, manufacturing or quality
            defect, or product materially different from the confirmed order.
          </p>
          <p>
            For full details, please read our{' '}
            <Link to="/replacement-policy" style={{ color: 'var(--gold)', fontWeight: 600 }}>
              Replacement &amp; Order Care
            </Link>{' '}
            page.
          </p>

          <h2>If Your Item Arrives Damaged</h2>
          <p>
            Please take clear photographs or a short video of the package and product before
            discarding the packaging. Contact us within 48 hours of delivery via WhatsApp at{' '}
            +91 70707 28989 with your order number and evidence of the damage. We will arrange
            an appropriate resolution promptly.
          </p>

          <h2>Delivery &amp; Address Issues</h2>
          <p>
            If a parcel cannot be delivered due to an incorrect address, customer unavailability,
            refusal to accept, or repeated failed delivery attempts, additional shipping or
            re-dispatch charges may apply. We recommend keeping your phone available around the
            expected delivery date.
          </p>

          <h2>Contact Us</h2>
          <p>
            For any order concern, contact us via WhatsApp at +91 70707 28989 or through our{' '}
            <Link to="/contact" style={{ color: 'var(--gold)' }}>Contact page</Link>.
            Please have your order number and relevant photographs ready when you reach out.
          </p>
        </div>
      </div>
    </div>
  );
}
