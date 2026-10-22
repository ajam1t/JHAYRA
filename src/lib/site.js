export const SITE = {
  name: 'JHAYRA',
  url: 'https://www.jhayra.com',
  tagline: 'Crafting Memories Into Art',
  whatsapp: '917070728989',
  phoneDisplay: '+91 70707 28989',
  email: 'hello@jhayra.in',
  instagram: 'https://www.instagram.com/jhayra.in/',
  ogImage: 'https://www.jhayra.com/Images/personalized.jpg',
  hours: [
    ['Mon – Sat', '9:00 AM – 7:00 PM'],
    ['Sunday', '10:00 AM – 4:00 PM'],
  ],
};

export function waLink(text = '') {
  return `https://wa.me/${SITE.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export const money = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');

// Made to order: 1–2 business days to craft, then 5–7 business days in transit.
export function deliveryWindow(from = new Date()) {
  const addBiz = (d, n) => {
    const x = new Date(d);
    while (n > 0) {
      x.setDate(x.getDate() + 1);
      if (x.getDay() !== 0) n--;
    }
    return x;
  };
  const fmt = (d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  return { early: fmt(addBiz(from, 6)), late: fmt(addBiz(from, 9)) };
}
