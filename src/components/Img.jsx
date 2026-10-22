import { useState } from 'react';
import { optimized, srcSet } from '../lib/img';

// Responsive, lazy, CDN-optimised image that falls back to the original URL.
export default function Img({ src, alt = '', sizes = '(max-width: 700px) 50vw, 25vw', width = 640, max = 1600, priority = false, className = '', style, onLoad }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (!src) return <div className={`img-empty ${className}`} style={style} aria-hidden="true" />;
  const useCdn = !failed;
  return (
    <img
      src={useCdn ? optimized(src, width) : src}
      srcSet={useCdn ? srcSet(src, max) : undefined}
      sizes={useCdn ? sizes : undefined}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchpriority={priority ? 'high' : undefined}
      decoding="async"
      className={`${className} ${loaded ? 'is-loaded' : 'is-loading'}`}
      style={style}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      onError={() => !failed && setFailed(true)}
    />
  );
}
