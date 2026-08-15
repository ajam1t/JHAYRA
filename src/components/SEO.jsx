import { useEffect } from 'react';

const BASE_URL = 'https://jhayra.com';
const DEFAULT_OG_IMAGE = `${BASE_URL}/Images/personalized.jpg`;

function setMeta(attr, name, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(url) {
  if (!url) return;
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

function setJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.setAttribute('type', 'application/ld+json');
    el.setAttribute('id', id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export default function SEO({
  title,
  description,
  path,
  ogImage,
  ogType = 'website',
  noindex = false,
  schema,
  schemaId = 'page-schema',
}) {
  const canonical = path ? `${BASE_URL}${path}` : null;
  const image = ogImage || DEFAULT_OG_IMAGE;

  useEffect(() => {
    const prevTitle = document.title;

    if (title) document.title = title;
    if (description) setMeta('name', 'description', description);
    if (canonical) setCanonical(canonical);

    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph
    if (title) setMeta('property', 'og:title', title);
    if (description) setMeta('property', 'og:description', description);
    if (canonical) setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:site_name', 'JHAYRA');
    setMeta('property', 'og:locale', 'en_IN');

    // Twitter Card
    setMeta('name', 'twitter:card', 'summary_large_image');
    if (title) setMeta('name', 'twitter:title', title);
    if (description) setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image);
    setMeta('name', 'twitter:site', '@jhayra.in');

    // JSON-LD — supports single object or array of schemas
    if (schema) {
      if (Array.isArray(schema)) {
        schema.forEach((s, i) => setJsonLd(`${schemaId}-${i}`, s));
      } else {
        setJsonLd(schemaId, schema);
      }
    }

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, canonical, image, ogType, noindex, schema, schemaId]);

  return null;
}
