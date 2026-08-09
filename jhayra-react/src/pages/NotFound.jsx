import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div data-page="not-found">
      <div className="container" style={{textAlign:'center',padding:'8rem 1rem 6rem'}}>
        <div style={{fontSize:'5rem',marginBottom:'1.5rem',lineHeight:1}}>🖼️</div>
        <h1 style={{fontFamily:'var(--fd)',fontSize:'clamp(2rem,5vw,3.5rem)',marginBottom:'.75rem'}}>Page Not Found</h1>
        <p style={{color:'var(--muted)',fontSize:'1.05rem',marginBottom:'2.5rem',maxWidth:'400px',margin:'0 auto 2.5rem'}}>
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div style={{display:'flex',gap:'1rem',justifyContent:'center',flexWrap:'wrap'}}>
          <Link to="/" className="btn btn-gold btn-lg">Go Home</Link>
          <Link to="/shop" className="btn btn-outline btn-lg">Browse Collection</Link>
        </div>
      </div>
    </div>
  );
}
