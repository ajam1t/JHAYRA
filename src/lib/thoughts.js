// Thought of the day: short, well-known lines from scripture across faiths,
// in common English translation. One per day, the same for every visitor.
// Each one can be framed with the Spiritual Quote template (quote ≤ 80
// characters, source ≤ 20 characters).
export const THOUGHTS = [
  { text: 'You have a right to your actions, never to their fruits.', source: 'Bhagavad Gita 2.47', faith: 'Hindu' },
  { text: 'One Creator. Truth is the Name.', source: 'Mool Mantar', faith: 'Sikh' },
  { text: 'Be still, and know that I am God.', source: 'Psalm 46:10', faith: 'Christian' },
  { text: 'Indeed, with hardship comes ease.', source: 'Quran 94:6', faith: 'Islamic' },
  { text: 'Hatred is never ended by hatred, but by love alone.', source: 'Dhammapada 5', faith: 'Buddhist' },
  { text: 'Souls render service to one another.', source: 'Tattvartha Sutra', faith: 'Jain' },
  { text: 'Truth alone triumphs.', source: 'Mundaka Upanishad', faith: 'Hindu' },
  { text: 'The world is one family.', source: 'Maha Upanishad', faith: 'Hindu' },
  { text: 'Love your neighbour as yourself.', source: 'Mark 12:31', faith: 'Christian' },
  { text: 'Mind precedes all things; mind is their chief.', source: 'Dhammapada 1', faith: 'Buddhist' },
  { text: 'Lift yourself by your own self; never let yourself down.', source: 'Bhagavad Gita 6.5', faith: 'Hindu' },
  { text: 'Non-violence is the highest duty.', source: 'Mahabharata', faith: 'Hindu' },
];

export function thoughtOfTheDay(date = new Date()) {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const day = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 86400000);
  return THOUGHTS[(day + date.getFullYear()) % THOUGHTS.length];
}

export const frameThoughtLink = (q) => `/customize/tmpl-spiritual-quote?text.quote=${encodeURIComponent(q.text)}&text.language=${encodeURIComponent(q.source)}`;
