import SEO from '../components/SEO';

export default function CookiePolicy() {
  return (
    <div data-page="cookie-policy">
      <SEO
        title="Cookie Policy | JHAYRA"
        description="Learn how JHAYRA uses cookies to improve your shopping experience. Essential cookies for cart and wishlist. Manage your preferences anytime."
        path="/cookie-policy"
      />
      <div className="page-hero"><div className="container"><p className="eyebrow">Legal</p><h1>Cookie Policy</h1><p>How we use cookies</p></div></div>
      <div className="container">
        <div className="legal-wrap" style={{maxWidth:'720px',margin:'2rem auto 4rem',lineHeight:1.85}}>
          <h2>What Are Cookies?</h2>
          <p>Cookies are small text files stored on your device when you visit a website. They help us remember your preferences and improve your experience.</p>
          <h2>How We Use Cookies</h2>
          <p>We use cookies to remember your cart items and wishlist (stored in localStorage), maintain session state, and analyze site traffic to improve our services.</p>
          <h2>Types of Cookies We Use</h2>
          <p><strong>Essential:</strong> Required for the site to function (cart, wishlist). Cannot be disabled.</p>
          <p><strong>Analytics:</strong> Help us understand how visitors use our site. These are anonymized.</p>
          <h2>Your Choices</h2>
          <p>You can clear cookies and localStorage data from your browser settings at any time. Note that this will clear your saved cart and wishlist.</p>
          <h2>Contact</h2>
          <p>For questions about our cookie use, contact us at hello@jhayra.in.</p>
        </div>
      </div>
    </div>
  );
}
