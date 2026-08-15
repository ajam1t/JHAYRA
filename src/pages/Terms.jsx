import SEO from '../components/SEO';

export default function Terms() {
  return (
    <div data-page="terms">
      <SEO
        title="Terms & Conditions | JHAYRA"
        description="Read JHAYRA's terms and conditions. By using our website and placing orders, you agree to these terms of service."
        path="/terms"
      />
      <div className="page-hero"><div className="container"><p className="eyebrow">Legal</p><h1>Terms of Service</h1><p>Last updated: January 2025</p></div></div>
      <div className="container">
        <div className="legal-wrap" style={{maxWidth:'720px',margin:'2rem auto 4rem',lineHeight:1.85}}>
          <h2>1. Acceptance of Terms</h2>
          <p>By using the JHAYRA website and placing orders, you agree to these Terms of Service. Please read them carefully.</p>
          <h2>2. Products and Orders</h2>
          <p>All products are made to order. Once an order is confirmed via WhatsApp, it enters production and cannot be modified unless within 2 hours of confirmation.</p>
          <h2>3. Pricing</h2>
          <p>All prices are in Indian Rupees (INR) and inclusive of applicable taxes. Shipping charges are added at checkout as applicable.</p>
          <h2>4. Intellectual Property</h2>
          <p>All content on the JHAYRA website, including designs, images, and text, is owned by JHAYRA and protected by copyright laws.</p>
          <h2>5. Limitation of Liability</h2>
          <p>JHAYRA is not liable for delays caused by courier partners or circumstances beyond our control. We will always work to resolve issues promptly.</p>
          <h2>6. Changes to Terms</h2>
          <p>We reserve the right to update these terms at any time. Continued use of our service constitutes acceptance of updated terms.</p>
        </div>
      </div>
    </div>
  );
}
