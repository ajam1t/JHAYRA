// Starter collection: public-domain (CC0) artworks from The Cleveland Museum
// of Art's Open Access programme, prepared as print-ready files in
// public/starter/. Admin → Worlds imports them as normal products once
// (images uploaded to storage, standard sizes and frame options copied from
// an existing product). Safe to run twice: existing slugs are skipped.
const CMA = (acc) => `Image: The Cleveland Museum of Art, Open Access (CC0), accession ${acc}.`;

export const STARTER = [
  // ── Mithila (Madhubani) — 20th-century paintings from Bihar ──────────────
  { file: 'cma-164466.jpg', category: 'mithila', name: 'Mithila Goddess with Lotus', tags: ['mithila', 'madhubani', 'goddess'], text: 'A four-armed goddess holding a lotus and a discus, framed by a border of hearts — a 20th-century Mithila (Madhubani) painting from Bihar, in the region’s signature pinks, yellows and blacks.', acc: '2005.86' },
  { file: 'cma-164467.jpg', category: 'mithila', name: 'Mithila Shiva and Nandi', tags: ['mithila', 'madhubani', 'shiva'], text: 'Shiva with his bull Nandi, painted in the bold double-line style of Mithila (Madhubani), Bihar, 20th century.', acc: '2005.87' },
  { file: 'cma-164457.jpg', category: 'mithila', name: 'Mithila Woman in Profile', tags: ['mithila', 'madhubani'], text: 'A woman in profile in a patterned sari, by a woman painter of the Mithila (Madhubani) school, Bihar, 20th century.', acc: '2005.78' },
  { file: 'cma-164464.jpg', category: 'mithila', name: 'Mithila Many-Armed Deity', tags: ['mithila', 'madhubani'], text: 'A many-armed deity seated among blossoms — a vivid 20th-century Mithila (Madhubani) painting from Bihar.', acc: '2005.84' },
  { file: 'cma-164458.jpg', category: 'mithila', name: 'Mithila Devotional Figure', tags: ['mithila', 'madhubani'], text: 'A devotional painting in deep blues and magentas from the Mithila (Madhubani) tradition of Bihar, 20th century.', acc: '2005.79' },
  { file: 'cma-164456.jpg', category: 'mithila', name: 'Mithila Mother and Children', tags: ['mithila', 'madhubani', 'family'], text: 'A mother watching two children play ball — everyday joy in the Mithila (Madhubani) style of Bihar, 20th century.', acc: '2005.77' },
  // ── Hindu deities — Kalighat paintings, Kolkata, c. 1880–1890 ───────────
  { file: 'cma-162499.jpg', category: 'religious', name: 'Gajalakshmi — Lakshmi with Elephants', tags: ['lakshmi', 'kalighat', 'diwali'], text: 'Goddess Lakshmi seated on a lotus as two elephants bathe her in blessings — a Kalighat painting from Kolkata, c. 1890. A classic for the pooja room and for Diwali.', acc: '2003.149' },
  { file: 'cma-162461.jpg', category: 'religious', name: 'Lakshmi and Saraswati', tags: ['lakshmi', 'saraswati', 'kalighat'], text: 'The goddesses of prosperity and learning side by side on lotuses — a Kalighat painting from Kolkata, c. 1890.', acc: '2003.121' },
  { file: 'cma-162475.jpg', category: 'religious', name: 'Vishnu and Lakshmi', tags: ['lakshmi', 'vishnu', 'kalighat'], text: 'Four-armed Vishnu seated with his consort Lakshmi while Garuda kneels before them — a Kalighat painting from Kolkata, c. 1890.', acc: '2003.132' },
  { file: 'cma-162427.jpg', category: 'religious', name: 'Maa Durga — Mahishasura Mardini', tags: ['durga', 'navratri', 'kalighat'], text: 'Ten-armed Durga triumphant over the buffalo demon Mahisha — a Kalighat painting from Kolkata, c. 1890. Perfect for Navratri and Durga Puja.', acc: '2003.103' },
  { file: 'cma-162460.jpg', category: 'religious', name: 'Hanuman with Ram and Lakshman', tags: ['hanuman', 'ram', 'kalighat'], text: 'Hanuman carrying Ram and Lakshman on his shoulders in search of Sita — a bold Kalighat painting from Kolkata, c. 1890.', acc: '2003.120' },
  { file: 'cma-149997.jpg', category: 'religious', name: 'Bajrang Bali Hanuman', tags: ['hanuman', 'kalighat'], text: 'Hanuman in full stride — a Kalighat painting from Kolkata, c. 1880, in rich reds and yellows.', acc: '1980.217' },
  { file: 'cma-162480.jpg', category: 'religious', name: 'Shri Ram and Sita Enthroned', tags: ['ram', 'sita', 'kalighat'], text: 'Ram crowned king in Ayodhya with Sita beside him after fourteen years of exile — a Kalighat painting from Kolkata, c. 1890.', acc: '2003.134.a' },
  { file: 'cma-162510.jpg', category: 'religious', name: 'Ram Darbar', tags: ['ram', 'sita', 'hanuman', 'kalighat'], text: 'Ram and Sita enthroned under a royal parasol held by Lakshman, with Hanuman kneeling in devotion — a Kalighat painting from Kolkata, c. 1890.', acc: '2003.152' },
  // ── Buddhist ─────────────────────────────────────────────────────────────
  { file: 'cma-154338.jpg', category: 'buddhist', name: 'Golden Buddha Vairochana', tags: ['buddha', 'tibet', 'thangka'], text: 'The golden Buddha Vairochana in the gesture of supreme enlightenment, surrounded by deities — a painting from Central Tibet, c. 1150–1200.', acc: '1989.104' },
  { file: 'cma-161703.jpg', category: 'buddhist', name: 'Preaching Buddha Shakyamuni', tags: ['buddha', 'tibet'], text: 'Buddha Shakyamuni teaching beneath a flowering tree — a small votive painting (tsakali) from Tholing Monastery, Western Tibet, 11th century.', acc: '2000.67' },
  { file: 'cma-157563.jpg', category: 'buddhist', name: 'Amitabha — Buddha of Infinite Light', tags: ['buddha', 'meditation'], text: 'Amitābha, the Buddha of Infinite Light, seated in deep meditation on a lotus throne — Ming dynasty China, late 1500s–early 1600s.', acc: '1994.94' },
  { file: 'cma-98868.jpg', category: 'buddhist', name: 'Tathagata Buddha', tags: ['buddha', 'korea'], text: 'A standing Buddha in bright mineral colours — a Joseon dynasty painting from Korea, late 1800s.', acc: '1918.542' },
  // ── Jain — Kalpa-sutra paintings, Gujarat, c. 1450–75 ────────────────────
  { file: 'cma-107362.jpg', category: 'jain', name: 'Queen Trishala — Kalpa Sutra', tags: ['jain', 'mahavira', 'kalpa sutra'], text: 'Queen Trishala, mother of Lord Mahavira, reclining — a gold-rich painting from a Jain Kalpa-sutra manuscript, Gujarat, c. 1450–75.', acc: '1925.1340' },
  { file: 'cma-107360.jpg', category: 'jain', name: 'Indra Honours Mahavira — Kalpa Sutra', tags: ['jain', 'mahavira', 'kalpa sutra'], text: 'Indra praises the coming of Lord Mahavira — a painting from a Jain Kalpa-sutra manuscript, Gujarat, c. 1450–75.', acc: '1925.1339' },
  // ── Christian — Italian panel paintings ──────────────────────────────────
  { file: 'cma-139727.jpg', category: 'christian', name: 'Madonna of Humility', tags: ['madonna', 'mary', 'jesus'], text: 'Mary seated on the ground nursing the infant Jesus — the “Madonna of Humility” by Caterino Veneziano, Italy, late 1370s.', acc: '1963.500' },
  { file: 'cma-142473.jpg', category: 'christian', name: 'Virgin and Child — Gold Icon', tags: ['madonna', 'mary', 'jesus'], text: 'The Virgin and Child in deep blue against gold — the centre of a small altarpiece by Berlinghiero, Italy, c. 1230s.', acc: '1966.237.a' },
  { file: 'cma-149803.jpg', category: 'christian', name: 'Virgin and Child with a Goldfinch', tags: ['madonna', 'mary', 'jesus'], text: 'Mary in prayer over the Christ Child, who holds a goldfinch — by Neroccio de’ Landi, Siena, c. 1490.', acc: '1980.101' },
].map((p) => ({ ...p, description: `${p.text} Printed to order on archival paper in a black frame. ${CMA(p.acc)}` }));

export const STARTER_CATEGORIES = { mithila: 'Mithila Heritage', buddhist: 'Buddhist', jain: 'Jain', christian: 'Christian' };
