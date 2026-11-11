// Gift Reveal words shared by the page, the creator and the prerender script
// (plain data, no imports, so the build script can read it too).

export const THEMES = [
  { id: 'envelope', name: 'Ivory Letter', line: 'A wax seal breaks and the letter rises' },
  { id: 'box', name: 'Champagne Gift Box', line: 'The ribbon slips and the lid lifts to light' },
  { id: 'night', name: 'Midnight Keepsake', line: 'An espresso case opens in a gold glow' },
  { id: 'bloom', name: 'Lotus Bloom', line: 'Golden petals unfold around a glowing light' },
  { id: 'balloons', name: 'Balloon Surprise', line: 'Pastel balloons float the lid away' },
  { id: 'teddy', name: 'Teddy Hug', line: 'A sleepy teddy wakes up with a heart for them' },
  { id: 'locket', name: 'Heart Locket', line: 'A rose-gold locket clicks open' },
  { id: 'butterfly', name: 'Butterfly Garden', line: 'The lid lifts and butterflies flutter free' },
  { id: 'diya', name: 'Festival Diya', line: 'A diya lights up and a rangoli blooms' },
];
export const THEME_IDS = THEMES.map((t) => t.id);
export const DARK_THEMES = ['night', 'diya'];

export const HOW_IT_WORKS = [
  ['Order your JHAYRA gift', 'Choose wall art or design a personalised frame, and check out as usual. The reveal is made around the gift you actually ordered.'],
  ['Write the reveal', 'Enter your order number and mobile. Add their name, your message, up to four photos, and a voice note or video if you like. Then choose one of nine opening animations.'],
  ['Share the link or QR code', 'Send it on WhatsApp, or print the QR code on a card. They open it on any phone, with no app and no account. Send it now, or schedule it for the exact moment.'],
];

export const JOURNEY = [
  ['A welcome with their name', 'The reveal opens on their name, the occasion and the box, letter or locket you chose, waiting to be tapped.'],
  ['The opening', 'One tap starts the opening animation, with an optional soft chime.'],
  ['Your words and memories', 'Your message as a letter, your photos as a gentle slideshow, and your voice note or video.'],
  ['The gift itself', 'The actual frame you ordered: the real artwork, or the personalised design made with your photos and words.'],
  ['A last line to remember', '“Some gifts are opened. Some memories last forever.” Then they can send you a thank-you on WhatsApp.'],
];

export const GR_FAQ = [
  ['What is a JHAYRA Gift Reveal?', 'It is a private digital unboxing that goes with a JHAYRA order. Before the frame arrives, the person you are gifting opens a link or QR code and sees your message, your photos, an opening animation and the actual gift you ordered for them.'],
  ['How much does it cost?', 'Nothing. A Gift Reveal is included free with every paid JHAYRA order.'],
  ['How do I create one?', 'After ordering, tap “Send a Gift Reveal” on the order confirmation or in My Orders. You can also open this page and enter your order number and the mobile number used at checkout.'],
  ['Can I create more than one reveal for an order?', 'Each order has one Gift Reveal. You can keep editing it — the message, photos, animation and timing — until the order is delivered, and the link stays the same.'],
  ['Can I schedule it for a birthday or anniversary?', 'Yes. Choose a date and time and the link will show a countdown until then. Schedule it within 120 days and before delivery, because the reveal closes once the gift arrives.'],
  ['How long does the link work?', 'From the moment you publish it until the order is delivered. It is a surprise for the wait, so it closes when the real gift is in their hands. It also closes if an order is cancelled or refunded.'],
  ['Is it private?', 'Yes. The link carries a long random code and no order number, name, phone number or price. Photos and videos are stored privately and shown through short-lived secure links. Only people you share the link with can open it.'],
  ['Do they need an app or account?', 'No. It opens in any phone or computer browser, from a WhatsApp link or by scanning the QR code.'],
  ['What can I add?', 'Their name, your name, the occasion, a message of up to 600 characters, up to four photos, and one video or voice note. You also choose one of nine animations: Ivory Letter, Champagne Gift Box, Midnight Keepsake, Lotus Bloom, Balloon Surprise, Teddy Hug, Heart Locket, Butterfly Garden or Festival Diya.'],
  ['Will they see the price?', 'Never. The reveal shows the gift and your message, not what you paid.'],
];
