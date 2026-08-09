/* Gift discovery data — 20 occasions + 16 recipients.
   Schema mirrors future Supabase gift_occasions / gift_recipients tables.
   productIds reference existing products; add more as catalog grows. */

// Warm-muted color palette cycling across cards (6 tones, JHAYRA-appropriate)
const TONES = [
  {bg:'#F5EDD8',tc:'#5A3A1E'},
  {bg:'#F5E0E0',tc:'#5A1E1E'},
  {bg:'#F5EACC',tc:'#5A3A00'},
  {bg:'#E5EDE0',tc:'#2A4020'},
  {bg:'#E0E8F5',tc:'#1E3A5A'},
  {bg:'#EAE0F5',tc:'#3A1E5A'},
];
const tone = i => TONES[i % TONES.length];

export const OCCASIONS = [
  {id:'birthday',        label:'Birthday',        emoji:'🎂', description:'Make their day unforgettable',    productIds:['p001','p009','p010','p012'],  ...tone(0)},
  {id:'anniversary',     label:'Anniversary',     emoji:'💑', description:'Celebrate years of love',         productIds:['p001','p008','p009'],          ...tone(1)},
  {id:'wedding',         label:'Wedding',         emoji:'💒', description:'The most beautiful day',         productIds:['p001','p003','p008','p009'],   ...tone(2)},
  {id:'engagement',      label:'Engagement',      emoji:'💍', description:'The beginning of forever',        productIds:['p001','p008','p009'],          ...tone(3)},
  {id:'valentines',      label:"Valentine's Day", emoji:'❤️', description:'Say it with beauty',              productIds:['p001','p008','p009'],          ...tone(1)},
  {id:'mothers-day',     label:"Mother's Day",    emoji:'🌹', description:'Honor the most special person',  productIds:['p001','p009','p002'],          ...tone(0)},
  {id:'fathers-day',     label:"Father's Day",    emoji:'👔', description:'Celebrate the man who inspires', productIds:['p005','p012','p009'],          ...tone(4)},
  {id:'baby-shower',     label:'Baby Shower',     emoji:'🍼', description:'Welcome a new life',             productIds:['p001','p002','p009'],          ...tone(2)},
  {id:'housewarming',    label:'Housewarming',    emoji:'🏠', description:'Bless the new home',             productIds:['p003','p005','p002','p011'],   ...tone(3)},
  {id:'farewell',        label:'Farewell',        emoji:'✈️', description:'A heartfelt send-off',            productIds:['p002','p010','p011','p009'],   ...tone(5)},
  {id:'retirement',      label:'Retirement',      emoji:'🏖️', description:'Celebrate a lifetime of work',  productIds:['p012','p009','p002'],          ...tone(0)},
  {id:'graduation',      label:'Graduation',      emoji:'🎓', description:'Mark the big achievement',       productIds:['p012','p004','p010','p009'],   ...tone(4)},
  {id:'christmas',       label:'Christmas',       emoji:'🎄', description:'Spread the festive joy',         productIds:['p002','p009','p011'],          ...tone(1)},
  {id:'diwali',          label:'Diwali',          emoji:'🪔', description:'Light up their world',           productIds:['p003','p005','p006','p009'],   ...tone(2)},
  {id:'raksha-bandhan',  label:'Raksha Bandhan',  emoji:'🎀', description:"Celebrate sibling bonds",        productIds:['p001','p009','p010'],          ...tone(5)},
  {id:'friendship',      label:'Friendship',      emoji:'🤝', description:'For your forever person',        productIds:['p001','p010','p009'],          ...tone(3)},
  {id:'thank-you',       label:'Thank You',       emoji:'🙏', description:'Express heartfelt gratitude',    productIds:['p002','p010','p009'],          ...tone(0)},
  {id:'congratulations', label:'Congratulations', emoji:'🥂', description:'Celebrate every win',            productIds:['p012','p004','p009'],          ...tone(4)},
  {id:'festivals',       label:'Festivals',       emoji:'🎉', description:'For every celebration',          productIds:['p003','p005','p006','p008'],   ...tone(2)},
  {id:'milestones',      label:'Milestones',      emoji:'🏆', description:'Mark life\'s biggest moments',   productIds:['p009','p012','p001'],          ...tone(5)},
];

export const RECIPIENTS = [
  {id:'husband',   label:'Husband',      emoji:'🤵', description:'For the man you love',           productIds:['p001','p008','p009'],       ...tone(4)},
  {id:'wife',      label:'Wife',         emoji:'👰', description:'For the woman you love',         productIds:['p001','p008','p009'],       ...tone(1)},
  {id:'boyfriend', label:'Boyfriend',   emoji:'💙', description:'For him',                         productIds:['p001','p009','p010'],       ...tone(4)},
  {id:'girlfriend',label:'Girlfriend',  emoji:'💗', description:'For her',                         productIds:['p001','p008','p009'],       ...tone(1)},
  {id:'mother',    label:'Mother',       emoji:'🌹', description:'For the world\'s best mum',      productIds:['p001','p009','p002'],       ...tone(0)},
  {id:'father',    label:'Father',       emoji:'👔', description:'For the man who always shows up',productIds:['p005','p012','p009'],       ...tone(4)},
  {id:'parents',   label:'Parents',     emoji:'👨‍👩‍👧', description:'For those who gave you everything',productIds:['p001','p003','p005'],  ...tone(2)},
  {id:'brother',   label:'Brother',     emoji:'🤜', description:'For your partner in crime',       productIds:['p004','p010','p012'],       ...tone(5)},
  {id:'sister',    label:'Sister',      emoji:'🤛', description:'For your forever friend',         productIds:['p001','p010','p008'],       ...tone(1)},
  {id:'friend',    label:'Friend',      emoji:'😊', description:'For the one who gets you',        productIds:['p010','p004','p009'],       ...tone(3)},
  {id:'couple',    label:'Couple',      emoji:'💑', description:'For two hearts as one',           productIds:['p001','p008','p009'],       ...tone(2)},
  {id:'kids',      label:'Kids',        emoji:'🧒', description:'For the little ones',             productIds:['p002','p010','p004'],       ...tone(0)},
  {id:'grandparents',label:'Grandparents',emoji:'👴👵',description:'For wisdom and unconditional love',productIds:['p001','p002','p009'], ...tone(3)},
  {id:'colleague', label:'Colleague',   emoji:'💼', description:'For the work family',             productIds:['p010','p012','p004'],       ...tone(5)},
  {id:'boss',      label:'Boss / Mentor',emoji:'🏅', description:'For someone who made you better', productIds:['p012','p005','p004'],      ...tone(4)},
  {id:'family',    label:'Family',      emoji:'🏡', description:'For everyone who matters most',   productIds:['p001','p003','p005'],       ...tone(2)},
];

export const OCCASION_MAP = Object.fromEntries(OCCASIONS.map(o => [o.id, o]));
export const RECIPIENT_MAP = Object.fromEntries(RECIPIENTS.map(r => [r.id, r]));
