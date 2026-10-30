// Structured data (schema.org JSON-LD) shared by the app and the build-time
// prerender, so search engines see the same facts either way. Only real data:
// prices and sizes come from the catalogue tables, delivery and returns mirror
// the published policies. Ratings are deliberately not emitted — there are no
// individual customer reviews on the site to back them.

export const SITE_URL = 'https://www.jhayra.com';
const ORG_ID = `${SITE_URL}/#organization`;

export const ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'JHAYRA',
  alternateName: 'Jhayra',
  slogan: 'Crafting Memories Into Art',
  description: 'JHAYRA is an Indian online store for framed wall art and personalised photo frames, handcrafted to order and delivered free across India.',
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/icon-512.png`,
  image: `${SITE_URL}/og-image.jpg`,
  email: 'hello@jhayra.in',
  telephone: '+91-84464-40469',
  foundingDate: '2017',
  founder: { '@type': 'Person', name: 'Sandeep Jha' },
  areaServed: { '@type': 'Country', name: 'India' },
  sameAs: ['https://www.instagram.com/thejhayra/'],
  contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer service', telephone: '+91-84464-40469', email: 'hello@jhayra.in', areaServed: 'IN' }],
};

export const WEBSITE = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: 'JHAYRA',
  alternateName: 'Jhayra',
  url: `${SITE_URL}/`,
  inLanguage: 'en-IN',
  publisher: { '@id': ORG_ID },
  potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/shop?q={search_term_string}` }, 'query-input': 'required name=search_term_string' },
};

// Free delivery across India: 1–2 business days to make, 5–7 in transit.
export const SHIPPING = {
  '@type': 'OfferShippingDetails',
  shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'INR' },
  shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
  deliveryTime: {
    '@type': 'ShippingDeliveryTime',
    handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
    transitTime: { '@type': 'QuantitativeValue', minValue: 5, maxValue: 7, unitCode: 'DAY' },
  },
};

// Made to order: no change-of-mind returns; damaged or incorrect orders are
// replaced free (see /refund and /replacement-policy).
export const RETURNS = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'IN',
  returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
  merchantReturnLink: `${SITE_URL}/refund`,
};

export const breadcrumbLd = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE_URL + path })),
});

// sizes: [{ slug, name, dimensions, price }]; colours: [{ name }]
export function productLd({ id, name, description, images = [], category, sizes = [], colours = [], material }) {
  const url = `${SITE_URL}/product/${id}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name,
    description,
    url,
    image: images.slice(0, 6),
    sku: id,
    mpn: id,
    brand: { '@type': 'Brand', name: 'JHAYRA' },
    ...(category ? { category } : {}),
    ...(material ? { material } : {}),
    ...(colours.length ? { color: colours.map((c) => c.name).join(' / ') } : {}),
    ...(sizes.length ? { size: sizes.map((s) => `${s.name} (${s.dimensions})`).join(', ') } : {}),
    offers: sizes.map((s) => ({
      '@type': 'Offer',
      sku: `${id}-${s.slug}`,
      name: `${name} — ${s.name}${s.dimensions ? ` (${s.dimensions})` : ''}`,
      price: Math.round(s.price),
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      url: `${url}?size=${s.slug}`,
      seller: { '@id': ORG_ID },
      shippingDetails: SHIPPING,
      hasMerchantReturnPolicy: RETURNS,
    })),
  };
}
