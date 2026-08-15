import SEO from '../components/SEO';

export default function Privacy() {
  return (
    <div data-page="privacy">
      <SEO
        title="Privacy Policy | JHAYRA"
        description="Read JHAYRA's privacy policy. We are committed to protecting your personal information and never selling your data."
        path="/privacy"
      />
      <div className="page-hero"><div className="container"><p className="eyebrow">Legal</p><h1>Privacy Policy</h1><p>Last updated: January 2025</p></div></div>
      <div className="container">
        <div className="legal-wrap" style={{maxWidth:'720px',margin:'2rem auto 4rem',lineHeight:1.85}}>
          <h2>1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as your name, email address, phone number, and delivery address when you place an order or contact us.</p>
          <h2>2. How We Use Your Information</h2>
          <p>We use your information to process orders, communicate order status, provide customer support, and improve our services. We do not sell your personal data.</p>
          <h2>3. WhatsApp Communications</h2>
          <p>JHAYRA uses WhatsApp for order confirmation and customer support. By initiating a conversation, you consent to receive order-related messages from us.</p>
          <h2>4. Data Security</h2>
          <p>We implement appropriate security measures to protect your personal information. Payment transactions are processed through secure channels.</p>
          <h2>5. Contact Us</h2>
          <p>If you have questions about this privacy policy, contact us via WhatsApp at +91 70707 28989 or through our <a href="/contact" style={{color:'var(--gold)'}}>Contact page</a>.</p>
        </div>
      </div>
    </div>
  );
}
