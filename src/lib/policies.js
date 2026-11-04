// Policy pages (privacy, terms, refund, replacement, shipping, cookies).
// Plain data so the build-time prerender can publish the same text.
export const LEGAL = {
  privacy: {
    title: 'Privacy Policy',
    desc: 'How JHAYRA collects, uses and protects your personal information and photos.',
    sections: [
      ['Information we collect', 'Your name, mobile number, email (optional) and delivery address when you order or contact us, and the photos and text you add to personalised products.'],
      ['How we use it', 'To make and deliver your order, send order updates on WhatsApp/SMS, provide support and improve our service. We never sell your personal data.'],
      ['Your photos', 'Photos you upload are stored privately and used only to produce your order. They are visible only to our production team, and are not used for marketing without your written permission.'],
      ['Visit statistics', 'We count anonymous visits — page, device type, referring website, page-load speed and an approximate state and city, linked to a random browser ID — to improve the site. No names, emails, mobile numbers or IP addresses are recorded, and nothing is counted if your browser sends Do Not Track or Global Privacy Control. See our Cookie Policy.'],
      ['Payments', 'Online payments are processed by Razorpay. We do not receive or store your card, UPI or banking credentials.'],
      ['WhatsApp communications', 'When you message us or order, you agree to receive order-related messages from us on WhatsApp.'],
      ['Data security', 'We use industry-standard safeguards to protect your information. No system is perfectly secure, but we take care to keep your data safe.'],
      ['Your choices', 'You can ask us to delete your personal data or uploaded photos once your order is complete — just contact us.'],
    ],
  },
  terms: {
    title: 'Terms of Service',
    desc: 'Terms for using the JHAYRA website and placing orders.',
    sections: [
      ['Acceptance', 'By using the JHAYRA website and placing orders, you agree to these terms.'],
      ['Made-to-order products', 'All products are made to order. Please check names, dates, spellings and photos carefully — we print exactly what you provide. Changes are possible within 2 hours of ordering; after production begins they may not be.'],
      ['Pricing', 'All prices are in Indian Rupees and include applicable taxes. Delivery is free across India.'],
      ['Your content', 'You confirm that you have the right to use the photos and text you upload, and you allow us to reproduce them solely to make your order.'],
      ['Intellectual property', 'All designs, images and text on this website belong to JHAYRA and are protected by copyright.'],
      ['Limitation of liability', 'We are not liable for courier delays or events beyond our control, but we will always work to resolve issues quickly.'],
      ['Changes', 'We may update these terms. Continued use of the site means you accept the updated terms.'],
    ],
  },
  refund: {
    title: 'Refund Policy',
    desc: 'Personalised products, made exclusively for you — and our replacement promise.',
    sub: 'Personalised products, made exclusively for you',
    sections: [
      ['Made-to-order products', 'Every JHAYRA piece is personalised and made for one customer, so we can’t accept returns or refunds for a change of mind, personal preference or an incorrect choice made when ordering.'],
      ['Replacement instead', 'If your order arrives damaged, defective, or doesn’t match the personalisation you confirmed, we will replace it at no extra cost.'],
      ['Eligible cases', ['Damaged during delivery', 'Incorrect personalisation made by JHAYRA', 'Wrong product received', 'Manufacturing or quality defect', 'Product materially different from the confirmed order']],
      ['If it arrives damaged', 'Take photos or a short video of the package and product before discarding the packaging, and contact us within 48 hours of delivery on WhatsApp with your order number.'],
      ['Delivery & address issues', 'If a parcel can’t be delivered due to an incorrect address, unavailability, refusal or repeated failed attempts, re-dispatch charges may apply.'],
    ],
  },
  'replacement-policy': {
    title: 'Our Replacement Promise',
    desc: 'If your JHAYRA arrives damaged or not as ordered, we replace it free.',
    sub: 'Your JHAYRA should reach you exactly as you imagined it.',
    sections: [
      ['Our promise', 'Every order is personalised, quality-checked and packed securely. If something goes wrong because of us or in transit, we replace it at no extra product or shipping cost.'],
      ['Covered', ['Damaged during delivery', 'Incorrect personalisation created by JHAYRA', 'Wrong product received', 'Manufacturing or quality defect', 'Product materially different from the confirmed order']],
      ['How to request help', ['Your order number', 'Photos or video of the package', 'Photos of the damaged product', 'A short description of the issue']],
      ['Within 48 hours', 'Please reach us within 48 hours of delivery so we can verify the issue with the courier quickly.'],
      ['Personalised creations', 'Because each piece is made only for you, requests based on a change of mind or personal preference may not qualify — please review spellings, dates and photos before ordering.'],
    ],
  },
  'shipping-policy': {
    title: 'Shipping Policy',
    desc: 'Free delivery across India on every order. Made to order in 1–2 days, delivered in 5–7.',
    sub: 'Free delivery across India — on every order',
    sections: [
      ['Free delivery, no minimum', 'Delivery is free on every order, whatever the size or value.'],
      ['Timeline', 'Every piece is made to order: allow 1–2 business days for crafting and quality checks, then 5–7 business days for delivery.'],
      ['Tracking', 'We send your tracking link on WhatsApp and SMS as soon as your parcel ships.'],
      ['Coverage', 'We ship to cities and towns across India. For very remote pincodes, WhatsApp us to confirm before ordering.'],
      ['Festive deadlines', 'Ordering for a festival or birthday? Check the delivery estimate on the product page or WhatsApp us — we’ll tell you honestly whether we can make your date.'],
    ],
  },
  'cookie-policy': {
    title: 'Cookie Policy',
    desc: 'Exactly what JHAYRA keeps in your browser, why, and how to clear it.',
    sections: [
      ['In short', 'JHAYRA sets no advertising or cross-site tracking cookies. We keep a few items in your browser’s local and session storage so the shop works, plus anonymous visit statistics you can switch off.'],
      ['Needed for the shop (local storage)', 'Your bag, wishlist, recently viewed designs, saved delivery details, the pincode you checked, the words and choices of an unfinished personalised design (for 14 days — never its photos) and the orders placed on this device (order number, items, total and the mobile number used, so “My orders” can show live status). They stay on your device until you clear them and are never shared.'],
      ['Needed during payment (session storage)', 'While you pay, we remember the payment order created for your bag for up to 25 minutes, so pressing Pay again never creates a duplicate order. It is cleared when your payment is confirmed or the tab is closed.'],
      ['Payment window', 'Online payments open Razorpay’s secure checkout, which may set its own cookies to process and protect your payment. See Razorpay’s privacy policy for details.'],
      ['Visit statistics', 'To learn which pages help and how fast they load, we count visits with a random ID in local storage and a session ID in session storage. We record the page, device type, the website that sent you, page-load timings and an approximate state and city worked out from your connection — never your name, email, mobile or IP address. We skip all of this if your browser sends “Do Not Track” or Global Privacy Control.'],
      ['Your choices', 'Turn on “Do Not Track” or Global Privacy Control in your browser to stop visit statistics. You can clear site data from your browser settings at any time; this also empties your bag, wishlist, saved details and the order list on this device (your orders themselves are safe — track them any time with your order number and mobile).'],
    ],
  },
};
