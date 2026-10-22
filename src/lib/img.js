// Product photos are uploaded as multi-megabyte PNGs. wsrv.nl is a free, cached
// image CDN that resizes them and converts to WebP on the fly (~25x smaller).
// If it is ever unreachable, <Img> falls back to the original URL.

const WIDTHS = [320, 480, 640, 900, 1200, 1600];

export function isRemote(src) {
  return typeof src === 'string' && /^https?:\/\//.test(src);
}

export function absolute(src) {
  if (!src) return '';
  if (isRemote(src)) return src;
  if (typeof window !== 'undefined') return new URL(src, window.location.origin).href;
  return 'https://www.jhayra.com' + src;
}

export function optimized(src, w = 640, q = 74) {
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) return src;
  const url = absolute(src);
  if (/localhost|127\.0\.0\.1/.test(url)) return src;
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${w}&q=${q}&output=webp&we`;
}

export function srcSet(src, max = 1600) {
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) return undefined;
  return WIDTHS.filter((w) => w <= max).map((w) => `${optimized(src, w)} ${w}w`).join(', ');
}
