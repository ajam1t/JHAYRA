import { Link } from 'react-router-dom';
import Frame from '../components/Frame';
import { Seo } from '../lib/seo';

export default function NotFound() {
  return (
    <>
      <Seo title="Page Not Found" path="/404" noindex />
      <section className="wrap section center nf">
        <div className="nf-frame">
          <Frame colour="#B8932A" ratio={{ w: 12, h: 14 }} tilt>
            <div className="nf-empty">404</div>
          </Frame>
        </div>
        <h1 className="h1" style={{ marginTop: 40 }}>
          This wall is <em>empty.</em>
        </h1>
        <p className="lead" style={{ margin: '14px auto 28px' }}>
          The page you’re looking for has moved or never existed. Let’s find you something beautiful.
        </p>
        <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn">
            Go home
          </Link>
          <Link to="/shop" className="btn btn-ghost">
            Shop frames
          </Link>
        </div>
      </section>
    </>
  );
}
