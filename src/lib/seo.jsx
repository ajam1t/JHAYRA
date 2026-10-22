import { useEffect } from 'react';
import { SITE } from './site';

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

// Per-page title, description, canonical, social tags and structured data.
export function Seo({ title, description, path = '/', image, noindex = false, jsonLd }) {
  useEffect(() => {
    const full = title ? (title.includes('JHAYRA') ? title : `${title} | JHAYRA`) : `${SITE.name} — Personalised Photo Frames & Wall Art`;
    const url = SITE.url + (path === '/' ? '/' : path.replace(/\/$/, ''));
    document.title = full;
    if (description) {
      setMeta('name', 'description', description);
      setMeta('property', 'og:description', description);
      setMeta('name', 'twitter:description', description);
    }
    setMeta('property', 'og:title', full);
    setMeta('name', 'twitter:title', full);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', image || SITE.ogImage);
    setMeta('name', 'twitter:image', image || SITE.ogImage);
    setMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow');
    setLink('canonical', url);

    const old = document.getElementById('page-jsonld');
    if (old) old.remove();
    if (jsonLd) {
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.id = 'page-jsonld';
      s.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(s);
    }
  }, [title, description, path, image, noindex, jsonLd && JSON.stringify(jsonLd)]);
  return null;
}
