// Sample photos shown inside personalised-template previews until the
// customer adds their own. Cropped from JHAYRA's own product photography
// (public/samples). They never reach the print file: the editor requires
// real photos in every required slot.
const n = (prefix, count) => Array.from({ length: count }, (_, i) => `/samples/${prefix}-${i + 1}.webp`);
const P = {
  couple: n('couple', 3),
  wedding: n('wedding', 2),
  family: n('family', 3),
  kids: n('kids', 2),
  portrait: n('portrait', 2),
  pets: n('pets', 2),
  travel: n('travel', 6),
};
const PEOPLE = [...P.couple, ...P.family, ...P.portrait, ...P.kids, ...P.wedding];

const BY_GROUP = {
  wedding: [...P.wedding, ...P.couple],
  anniversary: [...P.couple, ...P.wedding],
  love: P.couple,
  'couple-frame': [...P.couple, ...P.wedding],
  'moon-style': P.couple,
  family: P.family,
  parents: [...P.family, ...P.couple],
  festivals: [...P.family, ...P.portrait],
  spiritual: P.family,
  baby: [...P.kids, ...P.family],
  birthday: [...P.portrait, ...P.kids],
  milestones: [...P.kids, ...P.portrait],
  pets: P.pets,
  travel: [...P.travel, ...P.couple],
  friendship: [...P.portrait, ...P.travel],
};

const BY_LABEL = [
  [/pet|dog|cat|puppy/i, P.pets],
  [/baby|kid|child|newborn|son|daughter/i, P.kids],
  [/wedding|bride|groom|vivah|shaadi/i, P.wedding],
  [/couple|us\b|together|partner|husband|wife/i, P.couple],
  [/family|parents|mom|dad|grand/i, P.family],
  [/trip|travel|place|view|destination|journey/i, P.travel],
];

const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function samplePhoto(t, slot, i) {
  const byLabel = BY_LABEL.find(([re]) => re.test(slot?.label || ''));
  const pool = byLabel?.[1] || BY_GROUP[t.group] || PEOPLE;
  return pool[(hash(t.id) + i) % pool.length];
}
