import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function ReplacementPolicy() {
  return (
    <div data-page="replacement-policy">
      <SEO
        title="Replacement & Order Care | JHAYRA"
        description="JHAYRA stands behind every personalised creation. Learn about our replacement support for eligible orders — damaged products, manufacturing defects and incorrect personalization covered."
        path="/replacement-policy"
      />

      {/* Hero */}
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow">Order Care</p>
          <h1>Replacement &amp; Order Care</h1>
          <p>
            At JHAYRA, every personalized creation is made especially for you. We carefully review
            your order details, personalize your product, carry out a quality check, and pack it
            securely before dispatch. Our goal is simple: your JHAYRA should reach you exactly as
            you imagined it.
          </p>
        </div>
      </div>

      <div className="container">
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2.5rem 0 5rem' }}>

          {/* ── Section 1: Our Replacement Promise ──────────────────── */}
          <section style={{ marginBottom: '2.25rem' }}>
            <div style={{
              background: '#fff',
              borderRadius: '1.25rem',
              padding: '1.85rem',
              boxShadow: 'var(--sh)',
              borderLeft: '4px solid var(--gold)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%',
                  background: 'rgba(182,141,64,.1)', border: '1.5px solid rgba(182,141,64,.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h2 style={{ fontFamily: 'var(--fd)', fontSize: '1.2rem', margin: 0, color: '#1A1208' }}>
                  Our Replacement Promise
                </h2>
              </div>

              <p style={{ color: 'var(--muted)', lineHeight: 1.8, fontSize: '.9rem', marginBottom: '1.15rem' }}>
                If your order arrives with an issue caused by us or during transit, please contact us
                and we will work with you to arrange a replacement.
              </p>

              <p style={{
                fontWeight: 600, fontSize: '.75rem', letterSpacing: '.07em',
                textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '.65rem',
              }}>
                Replacement support applies in cases such as:
              </p>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.45rem', marginBottom: '1.2rem' }}>
                {[
                  'Product damaged during delivery',
                  'Incorrect personalization created by JHAYRA',
                  'Wrong product received',
                  'Manufacturing or quality defect',
                  'Product materially different from the confirmed order',
                ].map((item, i) => (
                  <li key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '.55rem',
                    fontSize: '.88rem', color: 'var(--text)', lineHeight: 1.65,
                  }}>
                    <span style={{ color: 'var(--gold)', fontWeight: 700, marginTop: '.05rem', flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              <p style={{
                color: 'var(--muted)', lineHeight: 1.75, fontSize: '.86rem',
                background: 'rgba(182,141,64,.06)', borderRadius: '.6rem',
                padding: '.7rem 1rem', border: '1px solid rgba(182,141,64,.15)',
              }}>
                Where the issue is confirmed as eligible, JHAYRA will arrange the replacement at{' '}
                <strong>no additional product or shipping cost</strong> to you.
              </p>
            </div>
          </section>

          {/* ── Section 2: Personalized Creations ───────────────────── */}
          <section style={{ marginBottom: '2.25rem' }}>
            <h2 style={{ fontFamily: 'var(--fd)', fontSize: '1.2rem', marginBottom: '.8rem', color: '#1A1208' }}>
              Personalized Creations
            </h2>
            <div style={{ background: 'var(--bg)', borderRadius: '1rem', padding: '1.4rem 1.5rem', lineHeight: 1.8 }}>
              <p style={{ color: 'var(--muted)', fontSize: '.88rem', marginBottom: '.75rem' }}>
                Because personalized products are created specifically for each customer, they are made
                exclusively for you and generally cannot be resold.
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '.88rem', marginBottom: '.75rem' }}>
                For this reason, requests based solely on a change of mind, personal preference, or an
                incorrect choice made by the customer may not qualify for replacement.
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '.88rem' }}>
                We always encourage you to carefully review your personalization details — spelling, names,
                dates, photographs, and other information — before placing your order.
              </p>
            </div>
          </section>

          <hr style={{ border: 'none', borderTop: '1px solid var(--cream)', margin: '0 0 2.25rem' }} />

          {/* ── Section 3: Package Arrives Damaged ───────────────────── */}
          <section style={{ marginBottom: '2.25rem' }}>
            <h2 style={{ fontFamily: 'var(--fd)', fontSize: '1.2rem', marginBottom: '.8rem', color: '#1A1208' }}>
              If Your Package Arrives Damaged
            </h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8, fontSize: '.88rem', marginBottom: '1rem' }}>
              Please take clear photographs or a short video of the package and product{' '}
              <strong>before discarding the packaging</strong>. Contact us within 48 hours of
              delivery with:
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '.65rem',
              marginBottom: '.9rem',
            }}>
              {[
                { n: '1', text: 'Your order number' },
                { n: '2', text: 'Photos or video of the package' },
                { n: '3', text: 'Photos of the damaged product' },
                { n: '4', text: 'A brief description of the issue' },
              ].map(({ n, text }) => (
                <div key={n} style={{
                  background: '#fff', borderRadius: '.75rem', padding: '.9rem 1rem',
                  boxShadow: 'var(--sh)', display: 'flex', alignItems: 'center', gap: '.65rem',
                }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    background: 'rgba(182,141,64,.11)', color: 'var(--gold)',
                    fontWeight: 700, fontSize: '.76rem', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {n}
                  </div>
                  <span style={{ fontSize: '.85rem', color: 'var(--text)', lineHeight: 1.45 }}>{text}</span>
                </div>
              ))}
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '.86rem', lineHeight: 1.75 }}>
              This helps us quickly verify the issue and arrange the appropriate resolution.
            </p>
          </section>

          {/* ── Section 4: If We Made a Mistake ─────────────────────── */}
          <section style={{ marginBottom: '2.25rem' }}>
            <h2 style={{ fontFamily: 'var(--fd)', fontSize: '1.2rem', marginBottom: '.8rem', color: '#1A1208' }}>
              If We Made a Mistake
            </h2>
            <div style={{
              background: '#fff', borderRadius: '1rem', padding: '1.4rem 1.5rem',
              boxShadow: 'var(--sh)', lineHeight: 1.8,
            }}>
              <p style={{ color: 'var(--muted)', fontSize: '.88rem', marginBottom: '.6rem' }}>
                If the personalization or product does not match the details confirmed in your order,
                please contact us.
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '.88rem' }}>
                Once verified, we will arrange a replacement with the correct product.
              </p>
            </div>
          </section>

          {/* ── Section 5: Delivery Issues ───────────────────────────── */}
          <section style={{ marginBottom: '2.25rem' }}>
            <h2 style={{ fontFamily: 'var(--fd)', fontSize: '1.2rem', marginBottom: '.8rem', color: '#1A1208' }}>
              Delivery Issues
            </h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8, fontSize: '.88rem', marginBottom: '.7rem' }}>
              If a parcel cannot be delivered because of an incorrect or incomplete address, customer
              unavailability, refusal to accept the shipment, or repeated failed delivery attempts,
              additional shipping or re-dispatch charges may apply.
            </p>
            <p style={{ color: 'var(--muted)', lineHeight: 1.75, fontSize: '.88rem' }}>
              We recommend keeping your phone available around the expected delivery date so our
              delivery partner can contact you when required.
            </p>
          </section>

          <hr style={{ border: 'none', borderTop: '1px solid var(--cream)', margin: '0 0 2.25rem' }} />

          {/* ── Section 6: Before You Place Your Order ───────────────── */}
          <section style={{ marginBottom: '2.25rem' }}>
            <h2 style={{ fontFamily: 'var(--fd)', fontSize: '1.2rem', marginBottom: '.8rem', color: '#1A1208' }}>
              Before You Place Your Order
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '.88rem', lineHeight: 1.8, marginBottom: '.9rem' }}>
              Please check your:
            </p>
            <div style={{
              background: 'var(--bg)', borderRadius: '1rem',
              padding: '.5rem 1.5rem', marginBottom: '.9rem',
            }}>
              {[
                'Name and spelling',
                'Dates and messages',
                'Photograph selection',
                'Product size and design',
                'Delivery address',
                'Contact number',
              ].map((item, i, arr) => (
                <div key={i} style={{
                  display: 'flex', gap: '.55rem', alignItems: 'center',
                  padding: '.55rem 0',
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,.05)' : 'none',
                }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '.85rem', flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: '.88rem', color: 'var(--text)' }}>{item}</span>
                </div>
              ))}
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '.85rem', lineHeight: 1.75 }}>
              Once an order enters production, changes may not be possible because personalized
              products are created specifically for you.
            </p>
          </section>

          {/* ── Section 7: How to Request Help ───────────────────────── */}
          <section style={{
            background: '#fff', borderRadius: '1.25rem',
            padding: '1.85rem', boxShadow: 'var(--sh)',
          }}>
            <h2 style={{ fontFamily: 'var(--fd)', fontSize: '1.2rem', marginBottom: '.8rem', color: '#1A1208' }}>
              How to Request Help
            </h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8, fontSize: '.88rem', marginBottom: '1.2rem' }}>
              We're here to help. For any issue with your order, contact us with your order number
              and relevant photographs or videos. Our team will review the request and guide you
              through the next steps.
            </p>
            <div style={{ display: 'flex', gap: '.7rem', flexWrap: 'wrap' }}>
              <a
                href="https://wa.me/917070728989"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-gold"
                style={{ fontSize: '.85rem' }}
              >
                Contact on WhatsApp
              </a>
              <Link to="/contact" className="btn btn-outline" style={{ fontSize: '.85rem' }}>
                Contact Page
              </Link>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
