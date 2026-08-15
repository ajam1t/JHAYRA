/* Master catalog — 15 categories with subcategories.
   Schema mirrors the future Supabase collections/subcategories tables.
   UI reads from this file; swap to API call later without touching components. */

export const CATALOG = [
  {
    id:'cat-01', name:'Personalized', slug:'personalized',
    description:'Unique photo frames and wall art crafted with your personal memories and photographs.',
    thumbnail:'/Images/personalized.jpg', icon:'🖼️', sortOrder:1, featured:true, active:true,
    subcategories:[
      {id:'sc-0101',name:'Couple & Wedding',slug:'couple-wedding',parentId:'cat-01',sortOrder:1,active:true,description:'Custom frames celebrating your love story'},
      {id:'sc-0102',name:'Anniversary',slug:'anniversary',parentId:'cat-01',sortOrder:2,active:true,description:'Mark every milestone together'},
      {id:'sc-0103',name:'Birthday',slug:'birthday-personal',parentId:'cat-01',sortOrder:3,active:true,description:'Personalized birthday surprise frames'},
      {id:'sc-0104',name:'Family',slug:'family-personal',parentId:'cat-01',sortOrder:4,active:true,description:'Beautiful family photo compositions'},
      {id:'sc-0105',name:'Parents',slug:'parents',parentId:'cat-01',sortOrder:5,active:true,description:'Honor and celebrate your parents'},
      {id:'sc-0106',name:'Baby & Kids',slug:'baby-kids-personal',parentId:'cat-01',sortOrder:6,active:true,description:'Capture precious baby moments forever'},
      {id:'sc-0107',name:'Friendship',slug:'friendship',parentId:'cat-01',sortOrder:7,active:true,description:'Celebrate your most treasured friendships'},
      {id:'sc-0108',name:'Pets',slug:'pets-personal',parentId:'cat-01',sortOrder:8,active:true,description:'Preserve beloved pet memories'},
      {id:'sc-0109',name:'Travel Memories',slug:'travel',parentId:'cat-01',sortOrder:9,active:true,description:'Cherish your travel adventures'},
      {id:'sc-0110',name:'Names & Initials',slug:'names-initials',parentId:'cat-01',sortOrder:10,active:true,description:'Stylized name-based personalization'},
      {id:'sc-0111',name:'Memorial',slug:'memorial',parentId:'cat-01',sortOrder:11,active:true,description:'Timeless tributes to cherished ones'},
    ]
  },
  {
    id:'cat-02', name:'Religious & Spiritual', slug:'religious',
    description:'Divine wall art featuring sacred deities and spiritual motifs crafted with reverence.',
    thumbnail:'/Images/religious.jpg', icon:'🙏', sortOrder:2, featured:true, active:true,
    subcategories:[
      {id:'sc-0201',name:'Ganesha',slug:'ganesha',parentId:'cat-02',sortOrder:1,active:true,description:'Lord Ganesha — remover of obstacles'},
      {id:'sc-0202',name:'Shiva',slug:'shiva',parentId:'cat-02',sortOrder:2,active:true,description:'Mahadev — the divine destroyer and creator'},
      {id:'sc-0203',name:'Krishna',slug:'krishna',parentId:'cat-02',sortOrder:3,active:true,description:'Lord Krishna divine art'},
      {id:'sc-0204',name:'Radha Krishna',slug:'radha-krishna',parentId:'cat-02',sortOrder:4,active:true,description:'The eternal love of Radha & Krishna'},
      {id:'sc-0205',name:'Ram',slug:'ram',parentId:'cat-02',sortOrder:5,active:true,description:'Lord Ram — the ideal king'},
      {id:'sc-0206',name:'Hanuman',slug:'hanuman',parentId:'cat-02',sortOrder:6,active:true,description:'Devotional Hanuman art'},
      {id:'sc-0207',name:'Durga',slug:'durga',parentId:'cat-02',sortOrder:7,active:true,description:'Maa Durga — the divine mother'},
      {id:'sc-0208',name:'Lakshmi',slug:'lakshmi',parentId:'cat-02',sortOrder:8,active:true,description:'Goddess Lakshmi — prosperity and wealth'},
      {id:'sc-0209',name:'Saraswati',slug:'saraswati',parentId:'cat-02',sortOrder:9,active:true,description:'Goddess Saraswati — knowledge and arts'},
      {id:'sc-0210',name:'Sai Baba',slug:'sai-baba',parentId:'cat-02',sortOrder:10,active:true,description:'Shirdi Sai Baba divine art'},
      {id:'sc-0211',name:'Buddha',slug:'buddha',parentId:'cat-02',sortOrder:11,active:true,description:'Buddha — peace and enlightenment'},
      {id:'sc-0212',name:'Jain Art',slug:'jain',parentId:'cat-02',sortOrder:12,active:true,description:'Sacred Jain spiritual art'},
      {id:'sc-0213',name:'Sikh Art',slug:'sikh',parentId:'cat-02',sortOrder:13,active:true,description:'Sikh devotional art and calligraphy'},
      {id:'sc-0214',name:'Islamic Art',slug:'islamic',parentId:'cat-02',sortOrder:14,active:true,description:'Islamic art and calligraphy frames'},
      {id:'sc-0215',name:'Spiritual Art',slug:'spiritual-art',parentId:'cat-02',sortOrder:15,active:true,description:'Universal spiritual themes'},
    ]
  },
  {
    id:'cat-03', name:'Love & Romance', slug:'love-romance',
    description:'Romantic wall art and personalized frames celebrating love, connection and togetherness.',
    thumbnail:'/Images/personalized.jpg', icon:'❤️', sortOrder:3, featured:true, active:true,
    subcategories:[
      {id:'sc-0301',name:'Couples',slug:'couples',parentId:'cat-03',sortOrder:1,active:true,description:'Beautiful couple photo frames'},
      {id:'sc-0302',name:"Valentine's Day",slug:'valentines',parentId:'cat-03',sortOrder:2,active:true,description:"Express your love this Valentine's"},
      {id:'sc-0303',name:'Proposal',slug:'proposal',parentId:'cat-03',sortOrder:3,active:true,description:'Preserve the magic of your proposal'},
      {id:'sc-0304',name:'First Date',slug:'first-date',parentId:'cat-03',sortOrder:4,active:true,description:'Remember where it all began'},
      {id:'sc-0305',name:'Love Story',slug:'love-story',parentId:'cat-03',sortOrder:5,active:true,description:'Tell your unique love story'},
      {id:'sc-0306',name:'Long Distance',slug:'long-distance',parentId:'cat-03',sortOrder:6,active:true,description:'Bridges for hearts apart'},
      {id:'sc-0307',name:'Romantic Quotes',slug:'romantic-quotes',parentId:'cat-03',sortOrder:7,active:true,description:'Beautiful love quotes as wall art'},
      {id:'sc-0308',name:'Couple Memories',slug:'couple-memories',parentId:'cat-03',sortOrder:8,active:true,description:'A collage of cherished moments'},
    ]
  },
  {
    id:'cat-04', name:'Wedding & Marriage', slug:'wedding',
    description:'Elegant wedding wall art — from engagement through forever, beautifully framed.',
    thumbnail:'/Images/personalized.jpg', icon:'💒', sortOrder:4, featured:true, active:true,
    subcategories:[
      {id:'sc-0401',name:'Wedding',slug:'wedding-art',parentId:'cat-04',sortOrder:1,active:true,description:'Stunning wedding day keepsakes'},
      {id:'sc-0402',name:'Engagement',slug:'engagement',parentId:'cat-04',sortOrder:2,active:true,description:'Celebrate your engagement beautifully'},
      {id:'sc-0403',name:'Bride & Groom',slug:'bride-groom',parentId:'cat-04',sortOrder:3,active:true,description:'Portrait frames for the happy couple'},
      {id:'sc-0404',name:'Wedding Memories',slug:'wedding-memories',parentId:'cat-04',sortOrder:4,active:true,description:'Preserve your wedding day forever'},
      {id:'sc-0405',name:'Wedding Calendar',slug:'wedding-calendar',parentId:'cat-04',sortOrder:5,active:true,description:'Photo calendar marking your special date'},
      {id:'sc-0406',name:'Wedding Timeline',slug:'wedding-timeline',parentId:'cat-04',sortOrder:6,active:true,description:'Your love story, told chronologically'},
      {id:'sc-0407',name:'Wedding Collage',slug:'wedding-collage',parentId:'cat-04',sortOrder:7,active:true,description:'Multi-photo wedding day compositions'},
      {id:'sc-0408',name:'Anniversary',slug:'anniversary-art',parentId:'cat-04',sortOrder:8,active:true,description:'Celebrating years of togetherness'},
    ]
  },
  {
    id:'cat-05', name:'Birthday', slug:'birthday',
    description:'Celebrate every birthday with personalized frames that capture joy and milestones.',
    thumbnail:'/Images/modern.jpg', icon:'🎂', sortOrder:5, featured:false, active:true,
    subcategories:[
      {id:'sc-0501',name:'Birthday Collage',slug:'birthday-collage',parentId:'cat-05',sortOrder:1,active:true,description:'Multi-photo birthday celebration frames'},
      {id:'sc-0502',name:'Birthday Calendar',slug:'birthday-calendar',parentId:'cat-05',sortOrder:2,active:true,description:'Photo calendar for the birthday year'},
      {id:'sc-0503',name:'Milestone Birthday',slug:'milestone-birthday',parentId:'cat-05',sortOrder:3,active:true,description:'Mark the big milestone birthdays'},
      {id:'sc-0504',name:'Kids Birthday',slug:'kids-birthday',parentId:'cat-05',sortOrder:4,active:true,description:'Fun and colorful kids birthday frames'},
      {id:'sc-0505',name:'Adult Birthday',slug:'adult-birthday',parentId:'cat-05',sortOrder:5,active:true,description:'Elegant birthday frames for grown-ups'},
      {id:'sc-0506',name:'18th Birthday',slug:'birthday-18',parentId:'cat-05',sortOrder:6,active:true,description:'Celebrate the big 18'},
      {id:'sc-0507',name:'21st Birthday',slug:'birthday-21',parentId:'cat-05',sortOrder:7,active:true,description:'A coming-of-age celebration'},
      {id:'sc-0508',name:'25th Birthday',slug:'birthday-25',parentId:'cat-05',sortOrder:8,active:true,description:'Silver jubilee birthday'},
      {id:'sc-0509',name:'30th Birthday',slug:'birthday-30',parentId:'cat-05',sortOrder:9,active:true,description:'Thirty & thriving'},
      {id:'sc-0510',name:'40th Birthday',slug:'birthday-40',parentId:'cat-05',sortOrder:10,active:true,description:'Fabulous at forty'},
      {id:'sc-0511',name:'50th Birthday & Beyond',slug:'birthday-50plus',parentId:'cat-05',sortOrder:11,active:true,description:'Grand milestone celebrations'},
    ]
  },
  {
    id:'cat-06', name:'Family & Memories', slug:'family',
    description:'Heartwarming family portraits and memory frames that bring generations together.',
    thumbnail:'/Images/personalized.jpg', icon:'👨‍👩‍👧‍👦', sortOrder:6, featured:false, active:true,
    subcategories:[
      {id:'sc-0601',name:'Family Portraits',slug:'family-portraits',parentId:'cat-06',sortOrder:1,active:true,description:'Classic family portrait compositions'},
      {id:'sc-0602',name:'Parents',slug:'parents-family',parentId:'cat-06',sortOrder:2,active:true,description:'Honoring your mom and dad'},
      {id:'sc-0603',name:'Grandparents',slug:'grandparents',parentId:'cat-06',sortOrder:3,active:true,description:'Treasuring grandparent memories'},
      {id:'sc-0604',name:'Siblings',slug:'siblings',parentId:'cat-06',sortOrder:4,active:true,description:'Brothers and sisters bond forever'},
      {id:'sc-0605',name:'Family Tree',slug:'family-tree',parentId:'cat-06',sortOrder:5,active:true,description:'Visual family heritage compositions'},
      {id:'sc-0606',name:'Family Collage',slug:'family-collage',parentId:'cat-06',sortOrder:6,active:true,description:'Multi-photo family memory collages'},
      {id:'sc-0607',name:'Family Memories',slug:'family-memories',parentId:'cat-06',sortOrder:7,active:true,description:'A gallery of family life moments'},
    ]
  },
  {
    id:'cat-07', name:'Baby & Kids', slug:'baby-kids',
    description:"Precious baby milestones and children's memories preserved in beautiful frames.",
    thumbnail:'/Images/personalized.jpg', icon:'👶', sortOrder:7, featured:false, active:true,
    subcategories:[
      {id:'sc-0701',name:'Newborn',slug:'newborn',parentId:'cat-07',sortOrder:1,active:true,description:'Celebrate your newest family member'},
      {id:'sc-0702',name:'Baby Milestones',slug:'baby-milestones',parentId:'cat-07',sortOrder:2,active:true,description:'First smile, first step, first word'},
      {id:'sc-0703',name:'First Year',slug:'first-year',parentId:'cat-07',sortOrder:3,active:true,description:'12 months of precious moments'},
      {id:'sc-0704',name:'Birth Announcement',slug:'birth-announcement',parentId:'cat-07',sortOrder:4,active:true,description:'Announce your bundle of joy beautifully'},
      {id:'sc-0705',name:'First Birthday',slug:'first-birthday',parentId:'cat-07',sortOrder:5,active:true,description:'Celebrate one glorious year'},
      {id:'sc-0706',name:'Kids Memories',slug:'kids-memories',parentId:'cat-07',sortOrder:6,active:true,description:'Growing-up memories in one frame'},
      {id:'sc-0707',name:'Baby Name Designs',slug:'baby-name',parentId:'cat-07',sortOrder:7,active:true,description:'Personalized name art for nurseries'},
    ]
  },
  {
    id:'cat-08', name:'Gifts', slug:'gifts',
    description:'Curated giftable wall art and personalized frames for every occasion and recipient.',
    thumbnail:'/Images/personalized.jpg', icon:'🎁', sortOrder:8, featured:true, active:true,
    subcategories:[
      {id:'sc-0801',name:'Ready-Made Gifts',slug:'ready-gifts',parentId:'cat-08',sortOrder:1,active:true,description:'Beautifully crafted, ready to gift'},
      {id:'sc-0802',name:'Personalized Gifts',slug:'personalized-gifts',parentId:'cat-08',sortOrder:2,active:true,description:'Custom gifts made uniquely for them'},
      {id:'sc-0803',name:'By Occasion',slug:'gifts-by-occasion',parentId:'cat-08',sortOrder:3,active:true,description:'The perfect gift for every celebration'},
      {id:'sc-0804',name:'By Recipient',slug:'gifts-by-recipient',parentId:'cat-08',sortOrder:4,active:true,description:'Find the ideal gift for anyone'},
    ]
  },
  {
    id:'cat-09', name:'Occasions & Celebrations', slug:'occasions',
    description:"Beautiful art and frames for life's most important celebrations and milestones.",
    thumbnail:'/Images/modern.jpg', icon:'🎉', sortOrder:9, featured:false, active:true,
    subcategories:[
      {id:'sc-0901',name:'Anniversary',slug:'occasion-anniversary',parentId:'cat-09',sortOrder:1,active:true,description:'Mark years of love beautifully'},
      {id:'sc-0902',name:'Wedding',slug:'occasion-wedding',parentId:'cat-09',sortOrder:2,active:true,description:'The most beautiful day'},
      {id:'sc-0903',name:'Engagement',slug:'occasion-engagement',parentId:'cat-09',sortOrder:3,active:true,description:'Say yes and celebrate it'},
      {id:'sc-0904',name:'Housewarming',slug:'housewarming',parentId:'cat-09',sortOrder:4,active:true,description:'Make any new house feel like home'},
      {id:'sc-0905',name:'Graduation',slug:'graduation',parentId:'cat-09',sortOrder:5,active:true,description:'Celebrating academic achievement'},
      {id:'sc-0906',name:'Retirement',slug:'retirement',parentId:'cat-09',sortOrder:6,active:true,description:'A lifetime of achievement honored'},
      {id:'sc-0907',name:'Farewell',slug:'farewell',parentId:'cat-09',sortOrder:7,active:true,description:'Beautiful goodbyes and new beginnings'},
      {id:'sc-0908',name:'Congratulations',slug:'congratulations',parentId:'cat-09',sortOrder:8,active:true,description:'Celebrate every achievement'},
      {id:'sc-0909',name:'Thank You',slug:'thank-you',parentId:'cat-09',sortOrder:9,active:true,description:'Heartfelt gratitude in a frame'},
      {id:'sc-0910',name:'Festivals',slug:'festivals',parentId:'cat-09',sortOrder:10,active:true,description:'Celebrate Indian and global festivals'},
    ]
  },
  {
    id:'cat-10', name:'Nature & Landscapes', slug:'nature',
    description:'Breathtaking natural scenery that brings the outdoors into your living space.',
    thumbnail:'/Images/nature.jpg', icon:'🌿', sortOrder:10, featured:false, active:true,
    subcategories:[
      {id:'sc-1001',name:'Mountains',slug:'mountains',parentId:'cat-10',sortOrder:1,active:true,description:'Majestic mountain landscapes'},
      {id:'sc-1002',name:'Lakes & Rivers',slug:'lakes',parentId:'cat-10',sortOrder:2,active:true,description:'Serene waterscapes'},
      {id:'sc-1003',name:'Beaches',slug:'beaches',parentId:'cat-10',sortOrder:3,active:true,description:'Coastal calm and ocean views'},
      {id:'sc-1004',name:'Forests',slug:'forests',parentId:'cat-10',sortOrder:4,active:true,description:'Lush green forest escapes'},
      {id:'sc-1005',name:'Flowers & Botanicals',slug:'flowers',parentId:'cat-10',sortOrder:5,active:true,description:'Floral art and botanical beauty'},
      {id:'sc-1006',name:'Sunset & Sunrise',slug:'sunset',parentId:'cat-10',sortOrder:6,active:true,description:'Golden hour captured in art'},
      {id:'sc-1007',name:'Wildlife',slug:'wildlife-nature',parentId:'cat-10',sortOrder:7,active:true,description:'Wild animals in their natural habitat'},
      {id:'sc-1008',name:'Scenic Landscapes',slug:'scenic',parentId:'cat-10',sortOrder:8,active:true,description:'Sweeping panoramic landscapes'},
      {id:'sc-1009',name:'Travel Scenery',slug:'travel-scenery',parentId:'cat-10',sortOrder:9,active:true,description:'Famous landscapes from around the world'},
    ]
  },
  {
    id:'cat-11', name:'Animals & Pets', slug:'animals-pets',
    description:'Celebrate animals — from beloved pets to magnificent wildlife — as stunning wall art.',
    thumbnail:'/Images/horses.jpg', icon:'🐾', sortOrder:11, featured:false, active:true,
    subcategories:[
      {id:'sc-1101',name:'Dogs',slug:'dogs',parentId:'cat-11',sortOrder:1,active:true,description:"Man's best friend, beautifully framed"},
      {id:'sc-1102',name:'Cats',slug:'cats',parentId:'cat-11',sortOrder:2,active:true,description:'Elegant feline portraits'},
      {id:'sc-1103',name:'Birds',slug:'birds',parentId:'cat-11',sortOrder:3,active:true,description:'Beautiful bird art and photography'},
      {id:'sc-1104',name:'Horses',slug:'horses',parentId:'cat-11',sortOrder:4,active:true,description:'Majestic horse art and Vastu designs'},
      {id:'sc-1105',name:'Pet Portraits',slug:'pet-portraits',parentId:'cat-11',sortOrder:5,active:true,description:'Custom portrait frames for your pet'},
      {id:'sc-1106',name:'Pet Memories',slug:'pet-memories',parentId:'cat-11',sortOrder:6,active:true,description:'Preserve precious pet moments'},
      {id:'sc-1107',name:'Wildlife',slug:'wildlife',parentId:'cat-11',sortOrder:7,active:true,description:'Lions, tigers, elephants and more'},
    ]
  },
  {
    id:'cat-12', name:'Art & Abstract', slug:'art-abstract',
    description:'Contemporary and abstract art prints for the modern art lover and design-conscious home.',
    thumbnail:'/Images/modern.jpg', icon:'🎨', sortOrder:12, featured:false, active:true,
    subcategories:[
      {id:'sc-1201',name:'Modern Art',slug:'modern-art',parentId:'cat-12',sortOrder:1,active:true,description:'Contemporary modern art prints'},
      {id:'sc-1202',name:'Abstract',slug:'abstract',parentId:'cat-12',sortOrder:2,active:true,description:'Bold and expressive abstract art'},
      {id:'sc-1203',name:'Minimalist',slug:'minimalist',parentId:'cat-12',sortOrder:3,active:true,description:'Clean, minimal, impactful art'},
      {id:'sc-1204',name:'Geometric',slug:'geometric',parentId:'cat-12',sortOrder:4,active:true,description:'Precision and pattern in art'},
      {id:'sc-1205',name:'Contemporary',slug:'contemporary',parentId:'cat-12',sortOrder:5,active:true,description:'Current and cutting-edge art styles'},
      {id:'sc-1206',name:'Line Art',slug:'line-art',parentId:'cat-12',sortOrder:6,active:true,description:'Elegant single-line art illustrations'},
      {id:'sc-1207',name:'Artistic Portraits',   slug:'artistic-portraits', parentId:'cat-12',sortOrder:7,active:true,description:'People and faces as fine art'},
      {id:'sc-1208',name:'Mithila Painting',     slug:'mithila-painting',   parentId:'cat-12',sortOrder:8,active:true,description:'Traditional Mithila folk art with geometric patterns and fish motifs'},
      {id:'sc-1209',name:'Madhubani Painting',   slug:'madhubani-painting', parentId:'cat-12',sortOrder:9,active:true,description:'Vibrant Madhubani folk paintings from Bihar with nature motifs'},
    ]
  },
  {
    id:'cat-13', name:'Quotes & Typography', slug:'quotes',
    description:'Words that inspire, comfort and move — beautifully set in premium typographic frames.',
    thumbnail:'/Images/canvas.jpg', icon:'✍️', sortOrder:13, featured:false, active:true,
    subcategories:[
      {id:'sc-1301',name:'Love Quotes',slug:'love-quotes',parentId:'cat-13',sortOrder:1,active:true,description:'Romantic quotes about love and togetherness'},
      {id:'sc-1302',name:'Life Quotes',slug:'life-quotes',parentId:'cat-13',sortOrder:2,active:true,description:'Wisdom about life, joy and meaning'},
      {id:'sc-1303',name:'Motivational',slug:'motivational',parentId:'cat-13',sortOrder:3,active:true,description:'Fuel your drive every single day'},
      {id:'sc-1304',name:'Inspirational',slug:'inspirational',parentId:'cat-13',sortOrder:4,active:true,description:'Lift your spirits and your space'},
      {id:'sc-1305',name:'Family Quotes',slug:'family-quotes',parentId:'cat-13',sortOrder:5,active:true,description:'Words celebrating family bonds'},
      {id:'sc-1306',name:'Mother Quotes',slug:'mother-quotes',parentId:'cat-13',sortOrder:6,active:true,description:"Tributes to the world's most important person"},
      {id:'sc-1307',name:'Father Quotes',slug:'father-quotes',parentId:'cat-13',sortOrder:7,active:true,description:'Words honoring fathers and father figures'},
      {id:'sc-1308',name:'Friendship Quotes',slug:'friendship-quotes',parentId:'cat-13',sortOrder:8,active:true,description:'Celebrating the gift of true friendship'},
      {id:'sc-1309',name:'Spiritual Quotes',slug:'spiritual-quotes',parentId:'cat-13',sortOrder:9,active:true,description:'Words of peace, faith and inner strength'},
      {id:'sc-1310',name:'Hindi Quotes',slug:'hindi-quotes',parentId:'cat-13',sortOrder:10,active:true,description:'Soulful quotes in Hindi'},
      {id:'sc-1311',name:'English Quotes',slug:'english-quotes',parentId:'cat-13',sortOrder:11,active:true,description:'Timeless quotes in English'},
      {id:'sc-1312',name:'Personalized Quotes',slug:'personalized-quotes',parentId:'cat-13',sortOrder:12,active:true,description:'Your own words, beautifully framed'},
      {id:'sc-1313',name:'Couple Quotes',slug:'couple-quotes',parentId:'cat-13',sortOrder:13,active:true,description:'Words that speak to two hearts as one'},
      {id:'sc-1314',name:'Attitude Quotes',slug:'attitude-quotes',parentId:'cat-13',sortOrder:14,active:true,description:'Bold and confident expressions'},
      {id:'sc-1315',name:'Minimal Typography',slug:'minimal-typography',parentId:'cat-13',sortOrder:15,active:true,description:'Clean typographic art with minimal design'},
      {id:'sc-1316',name:'Poetry',slug:'poetry',parentId:'cat-13',sortOrder:16,active:true,description:'Poems and verses as beautiful wall art'},
    ]
  },
  {
    id:'cat-14', name:'Home & Vastu', slug:'home-vastu',
    description:'Vastu-approved art that brings positive energy, prosperity and harmony to your home.',
    thumbnail:'/Images/horses.jpg', icon:'🏠', sortOrder:14, featured:false, active:true,
    subcategories:[
      {id:'sc-1401',name:'7 Running Horses',slug:'running-horses',parentId:'cat-14',sortOrder:1,active:true,description:'Vastu-approved symbol of speed and success'},
      {id:'sc-1402',name:'Vastu Art',slug:'vastu-art',parentId:'cat-14',sortOrder:2,active:true,description:'Art aligned with Vastu Shastra principles'},
      {id:'sc-1403',name:'Buddha',slug:'buddha-home',parentId:'cat-14',sortOrder:3,active:true,description:'Peace and positivity with Buddha art'},
      {id:'sc-1404',name:'Positive Energy',slug:'positive-energy',parentId:'cat-14',sortOrder:4,active:true,description:'Art that uplifts the energy of your space'},
      {id:'sc-1405',name:'Nature Decor',slug:'nature-decor',parentId:'cat-14',sortOrder:5,active:true,description:'Nature-inspired art for harmonious living'},
      {id:'sc-1406',name:'Spiritual Decor',slug:'spiritual-decor',parentId:'cat-14',sortOrder:6,active:true,description:'Devotional and spiritual home decor'},
      {id:'sc-1407',name:'Prosperity & Success',slug:'prosperity',parentId:'cat-14',sortOrder:7,active:true,description:'Art symbolizing abundance and achievement'},
    ]
  },
  {
    id:'cat-15', name:'Photography & Memories', slug:'photography',
    description:'Fine art photography prints — from cinematic travel shots to timeless black & white.',
    thumbnail:'/Images/canvas.jpg', icon:'📸', sortOrder:15, featured:false, active:true,
    subcategories:[
      {id:'sc-1501',name:'Travel Photography',slug:'travel-photography',parentId:'cat-15',sortOrder:1,active:true,description:'Iconic destinations captured beautifully'},
      {id:'sc-1502',name:'Cities & Architecture',slug:'cities',parentId:'cat-15',sortOrder:2,active:true,description:'Urban landscapes and architectural art'},
      {id:'sc-1503',name:'Vintage',slug:'vintage',parentId:'cat-15',sortOrder:3,active:true,description:'Nostalgic vintage photography and art'},
      {id:'sc-1504',name:'Black & White',slug:'black-white',parentId:'cat-15',sortOrder:4,active:true,description:'Timeless monochrome photography'},
      {id:'sc-1505',name:'Retro',slug:'retro',parentId:'cat-15',sortOrder:5,active:true,description:'Mid-century and retro aesthetic art'},
      {id:'sc-1506',name:'Cinematic',slug:'cinematic',parentId:'cat-15',sortOrder:6,active:true,description:'Film-inspired cinematic photography'},
      {id:'sc-1507',name:'Photo Collage',slug:'photo-collage',parentId:'cat-15',sortOrder:7,active:true,description:'Multi-photo composition prints'},
      {id:'sc-1508',name:'Memory Wall',slug:'memory-wall',parentId:'cat-15',sortOrder:8,active:true,description:'Curated sets for gallery wall displays'},
      {id:'sc-1509',name:'Panoramic',slug:'panoramic',parentId:'cat-15',sortOrder:9,active:true,description:'Expansive wide-format landscape art'},
    ]
  },
];

export const CATALOG_MAP = Object.fromEntries(CATALOG.map(c => [c.slug, c]));

export const ALL_SUBCATS = CATALOG.flatMap(c => c.subcategories);

export const SUBCAT_MAP = Object.fromEntries(ALL_SUBCATS.map(sc => [sc.slug, sc]));

export function getCategoryBySlug(slug) { return CATALOG_MAP[slug] || null; }
export function getSubcatBySlug(slug) { return SUBCAT_MAP[slug] || null; }
export function getCatForSubcat(subcatSlug) {
  return CATALOG.find(c => c.subcategories.some(sc => sc.slug === subcatSlug)) || null;
}
