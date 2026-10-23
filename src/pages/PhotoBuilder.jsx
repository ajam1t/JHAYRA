import { Link } from 'react-router-dom';
import LivingStudio from '../components/LivingStudio';
import { Seo } from '../lib/seo';
import { useProducts } from '../lib/catalog';
import { money } from '../lib/site';
import { SIZES } from '../lib/frames';

export function useSamplePhoto() {
  const { data: products } = useProducts();
  const p = (products || []).find((x) => x.category === 'family' && x.thumbnail) || (products || []).find((x) => x.category === 'photography' && x.thumbnail);
  return p?.thumbnail;
}

export default function PhotoBuilder() {
  const sample = useSamplePhoto();
  return (
    <>
      <Seo
        title="Living Art Studio — Turn Your Photo Into Framed Art"
        description={`Upload a photo, choose a treatment (original, monochrome, vintage, pencil sketch, soft glow), add names or a date, and order it in a black frame from ${money(SIZES[0].price)}. Free delivery across India.`}
        path="/customize/photo"
      />
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden>/</span>
          <Link to="/customize">Personalised Art</Link>
          <span aria-hidden>/</span>
          <span>Living Art Studio</span>
        </nav>
      </div>
      <section className="wrap studio-page">
        <header className="studio-head">
          <span className="eyebrow">The Living Art Studio</span>
          <h1 className="h1">
            Your photograph, <em>made into art.</em>
          </h1>
          <p className="lead">Upload a photo, choose how it should feel, add a name or a date, and see the finished piece in its black frame — the preview is exactly what we print.</p>
        </header>
        <LivingStudio samplePhoto={sample} />
      </section>
    </>
  );
}
