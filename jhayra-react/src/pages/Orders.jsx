import { Link } from 'react-router-dom';

export default function Orders() {
  return (
    <div data-page="orders">
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow">Your Account</p>
          <h1>My Orders</h1>
          <p>Track and manage your JHAYRA orders</p>
        </div>
      </div>
      <div className="container">
        <div style={{textAlign:'center',padding:'5rem 0 6rem',maxWidth:'480px',margin:'0 auto'}}>
          <div style={{fontSize:'3.5rem',marginBottom:'1.5rem'}}>📦</div>
          <h3 style={{fontFamily:'var(--fd)',fontSize:'1.4rem',marginBottom:'.75rem'}}>No orders yet</h3>
          <p style={{color:'var(--muted)',lineHeight:1.75,marginBottom:'2rem'}}>
            Orders placed via WhatsApp are confirmed directly with our team. To check the status of your order, message us on WhatsApp with your order details.
          </p>
          <div style={{display:'flex',gap:'.75rem',justifyContent:'center',flexWrap:'wrap'}}>
            <a
              href="https://wa.me/917070728989?text=Hi%20JHAYRA!%20I'd%20like%20to%20track%20my%20order."
              target="_blank" rel="noopener noreferrer"
              className="btn btn-gold"
            >
              🟢 Track via WhatsApp
            </a>
            <Link to="/shop" className="btn btn-outline">Shop Now</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
