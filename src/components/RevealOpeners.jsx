/* The nine ways a Gift Reveal opens. Each has a gentle idle loop (so it feels
   alive before the tap) and an opening sequence that plays when `open` is set.
   Pure HTML/SVG + CSS (transform/opacity), so it stays smooth on phones.
   Styles: src/styles/reveal.css (grv-o …). */

const LOGO = '/logo-mark-lg.webp';

function Burst({ colors, n = 18, delay = 0.45 }) {
  return (
    <span className="grv-burst" aria-hidden="true" style={{ '--delay': `${delay}s` }}>
      {Array.from({ length: n }, (_, i) => (
        <i key={i} style={{ '--a': `${(i / n) * 360 + (i % 2 ? 9 : 0)}deg`, '--r': `${95 + (i % 4) * 26}px`, '--c': colors[i % colors.length], '--w': `${i % 3 ? 6 : 9}px`, '--s': `${(i % 5) * 0.04}s` }} />
      ))}
    </span>
  );
}

function Hearts({ n = 7, color = '#e07a6f' }) {
  return (
    <span className="grv-hearts" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <i key={i} style={{ '--x': `${(i - (n - 1) / 2) * 26}px`, '--d': `${0.5 + (i % 4) * 0.14}s`, '--z': `${14 + (i % 3) * 6}px`, color }}>
          ♥
        </i>
      ))}
    </span>
  );
}

/* 1 · wax-sealed letter */
function Envelope({ open }) {
  return (
    <div className={`grv-o grv-env ${open ? 'open' : ''}`}>
      <div className="grv-env-letter">
        <i />
        <i />
        <i />
      </div>
      <div className="grv-env-back" />
      <div className="grv-env-front" />
      <div className="grv-env-flap" />
      <span className="grv-seal">
        <img src={LOGO} alt="" />
      </span>
    </div>
  );
}

/* 2 · champagne gift box */
function Box({ open }) {
  return (
    <div className={`grv-o grv-box ${open ? 'open' : ''}`}>
      <div className="grv-box-glow" />
      <div className="grv-box-lid">
        <span className="grv-ribbon-h" />
        <svg className="grv-bow" viewBox="-150 -110 300 170">
          <path d="M-4 0 C-40 -70 -140 -80 -130 -20 C-120 30 -50 20 -4 4 Z" />
          <path d="M4 0 C40 -70 140 -80 130 -20 C120 30 50 20 4 4 Z" />
          <path d="M-6 4 C-30 30 -44 46 -62 60 L-40 64 C-28 46 -14 30 4 10 Z" />
          <path d="M6 4 C30 30 44 46 62 60 L40 64 C28 46 14 30 -4 10 Z" />
          <ellipse cx="0" cy="2" rx="17" ry="14" />
        </svg>
      </div>
      <div className="grv-box-body">
        <span className="grv-ribbon-v" />
        <img className="grv-box-mark" src={LOGO} alt="" />
      </div>
    </div>
  );
}

/* 3 · midnight keepsake case */
function Case({ open }) {
  return (
    <div className={`grv-o grv-case ${open ? 'open' : ''}`}>
      <div className="grv-case-glow" />
      <div className="grv-case-lid">
        <img src={LOGO} alt="" />
      </div>
      <div className="grv-case-base">
        <span className="grv-case-clasp" />
      </div>
    </div>
  );
}

/* 4 · lotus bloom */
const BACK = [-74, -50, -25, 0, 25, 50, 74];
const FRONT = [-44, -15, 15, 44];
function Lotus({ open }) {
  return (
    <div className={`grv-o grv-lotus ${open ? 'open' : ''}`}>
      <span className="grv-lotus-halo" />
      <span className="grv-lotus-water" />
      <div className="grv-lotus-flower">
        {BACK.map((a, i) => (
          <i key={a} className="p pb" style={{ '--a': `${a}deg`, '--dl': `${0.12 + Math.abs(i - 3) * 0.07}s` }} />
        ))}
        <span className="grv-lotus-light">
          <img src={LOGO} alt="" />
        </span>
        {FRONT.map((a, i) => (
          <i key={a} className="p pf" style={{ '--a': `${a}deg`, '--dl': `${0.05 + (i === 0 || i === 3 ? 0.08 : 0)}s` }} />
        ))}
      </div>
      <Burst colors={['#f3c98b', '#f6b7a9', '#fff3d6']} n={14} delay={0.9} />
    </div>
  );
}

/* 5 · balloon surprise */
const BALLOONS = [
  { x: 24, y: 8, w: 30, c: '#f2b5aa', d: 0 },
  { x: 50, y: 0, w: 34, c: '#ecd08f', d: 0.6 },
  { x: 76, y: 10, w: 29, c: '#bfd5c4', d: 1.1 },
];
function Balloons({ open }) {
  return (
    <div className={`grv-o grv-balloons ${open ? 'open' : ''}`}>
      <span className="grv-bl-glow" />
      <div className="grv-bl-box">
        <span className="grv-bl-rib" />
      </div>
      <div className="grv-bl-up">
        <svg className="grv-bl-strings" viewBox="0 0 100 130" preserveAspectRatio="none" aria-hidden="true">
          {BALLOONS.map((b) => (
            <path key={b.x} d={`M${b.x} ${b.y + b.w * 1.05} Q ${(b.x + 50) / 2 + (b.x < 50 ? -6 : b.x > 50 ? 6 : 3)} ${(b.y + b.w + 94) / 2} 50 94`} />
          ))}
        </svg>
        {BALLOONS.map((b) => (
          <span key={b.x} className="grv-bl-b" style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, '--c': b.c, '--d': `${b.d}s` }} />
        ))}
        <span className="grv-bl-heart" />
        <div className="grv-bl-lid">
          <span className="grv-bl-rib" />
          <span className="grv-bl-bow" />
        </div>
      </div>
      <Burst colors={['#f2b5aa', '#ecd08f', '#bfd5c4', '#ffffff', '#b08a45']} n={20} delay={0.75} />
    </div>
  );
}

/* 6 · teddy hug */
function Teddy({ open }) {
  return (
    <div className={`grv-o grv-teddy ${open ? 'open' : ''}`}>
      <span className="grv-teddy-glow" />
      <span className="grv-zzz" aria-hidden="true">
        <i>z</i>
        <i>z</i>
        <i>Z</i>
      </span>
      <svg viewBox="0 0 200 230" aria-hidden="true">
        <g className="td-body">
          <ellipse cx="66" cy="216" rx="20" ry="12" fill="#c58a55" />
          <ellipse cx="134" cy="216" rx="20" ry="12" fill="#c58a55" />
          <ellipse cx="66" cy="217" rx="11" ry="6" fill="#f1d2ad" />
          <ellipse cx="134" cy="217" rx="11" ry="6" fill="#f1d2ad" />
          <ellipse cx="100" cy="172" rx="58" ry="50" fill="#d39b63" />
          <ellipse cx="100" cy="182" rx="35" ry="31" fill="#f1d2ad" />
        </g>
        <g className="td-head">
          <circle cx="60" cy="44" r="21" fill="#c58a55" />
          <circle cx="140" cy="44" r="21" fill="#c58a55" />
          <circle cx="60" cy="44" r="11" fill="#eab98f" />
          <circle cx="140" cy="44" r="11" fill="#eab98f" />
          <circle cx="100" cy="80" r="52" fill="#d39b63" />
          <ellipse cx="100" cy="98" rx="23" ry="18" fill="#f1d2ad" />
          <circle cx="70" cy="96" r="8" fill="#f09d90" opacity="0.55" />
          <circle cx="130" cy="96" r="8" fill="#f09d90" opacity="0.55" />
          <ellipse cx="100" cy="89" rx="7.5" ry="5.5" fill="#4a2f1e" />
          <path d="M100 94 q0 8 -7 9 M100 94 q0 8 7 9" stroke="#4a2f1e" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <g className="td-sleep" stroke="#4a2f1e" strokeWidth="3" fill="none" strokeLinecap="round">
            <path d="M74 76 q7 6 14 0" />
            <path d="M112 76 q7 6 14 0" />
          </g>
          <g className="td-awake">
            <circle cx="81" cy="75" r="6" fill="#2d1c12" />
            <circle cx="119" cy="75" r="6" fill="#2d1c12" />
            <circle cx="83" cy="73" r="2" fill="#fff" />
            <circle cx="121" cy="73" r="2" fill="#fff" />
          </g>
        </g>
        <g className="td-heart">
          <path d="M100 196 C74 178 64 166 64 152 C64 141 72 133 82 133 C89 133 95 137 100 143 C105 137 111 133 118 133 C128 133 136 141 136 152 C136 166 126 178 100 196 Z" fill="#e0776d" />
          <path d="M78 143 C80 139 84 138 87 139" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
          <path d="M100 143 V196" stroke="#f3d08c" strokeWidth="5" />
          <path d="M66 156 H134" stroke="#f3d08c" strokeWidth="5" />
        </g>
        <g className="td-arm l">
          <ellipse cx="58" cy="162" rx="15" ry="30" transform="rotate(38 58 162)" fill="#c58a55" />
        </g>
        <g className="td-arm r">
          <ellipse cx="142" cy="162" rx="15" ry="30" transform="rotate(-38 142 162)" fill="#c58a55" />
        </g>
      </svg>
      <Hearts n={7} color="#e0776d" />
    </div>
  );
}

/* 7 · heart locket */
function Locket({ open }) {
  return (
    <div className={`grv-o grv-locket ${open ? 'open' : ''}`}>
      <svg className="grv-lk-chain" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
        <path d="M6 0 Q 30 30 50 34 Q 70 30 94 0" />
      </svg>
      <div className="grv-lk-swing">
        <span className="grv-lk-bail" />
        <div className="grv-lk-heart">
          <div className="grv-lk-back">
            <span className="grv-lk-glow" />
            <span className="grv-lk-in">
              <img src={LOGO} alt="" />
            </span>
          </div>
          <div className="grv-lk-cover">
            <span className="grv-lk-engrave" />
            <img src={LOGO} alt="" />
          </div>
        </div>
      </div>
      <Hearts n={6} color="#f0b4a4" />
    </div>
  );
}

/* 8 · butterfly garden */
const FLIES = [
  { x: -120, y: -150, r: -18, c1: '#f4b6a8', c2: '#f9d9cf', d: 0.35 },
  { x: 110, y: -170, r: 16, c1: '#ead08e', c2: '#f6e7c1', d: 0.45 },
  { x: -70, y: -230, r: -8, c1: '#c9b6e4', c2: '#e6dcf3', d: 0.55 },
  { x: 60, y: -250, r: 10, c1: '#bfd8c6', c2: '#e1eee4', d: 0.62 },
  { x: 150, y: -60, r: 24, c1: '#f6c49a', c2: '#fbe3cd', d: 0.5 },
  { x: -150, y: -70, r: -24, c1: '#f2a7b8', c2: '#f9d6de', d: 0.42 },
];
function Fly({ c1, c2 }) {
  return (
    <svg viewBox="0 0 60 50" style={{ '--c1': c1, '--c2': c2 }}>
      <g className="w l">
        <path d="M30 25 C18 2 2 4 4 18 C6 28 20 28 30 25Z" />
        <path className="lo" d="M30 26 C20 30 8 40 14 46 C20 50 28 38 30 27Z" />
      </g>
      <g className="w r">
        <path d="M30 25 C42 2 58 4 56 18 C54 28 40 28 30 25Z" />
        <path className="lo" d="M30 26 C40 30 52 40 46 46 C40 50 32 38 30 27Z" />
      </g>
      <ellipse cx="30" cy="27" rx="1.8" ry="10" fill="#4a3a2a" />
      <path d="M29 18 q-3 -8 -7 -10 M31 18 q3 -8 7 -10" stroke="#4a3a2a" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  );
}
function Butterflies({ open }) {
  return (
    <div className={`grv-o grv-fly ${open ? 'open' : ''}`}>
      <span className="grv-fl-glow" />
      {FLIES.map((f, i) => (
        <span key={i} className="grv-bf out" style={{ '--x': `${f.x}px`, '--y': `${f.y}px`, '--r': `${f.r}deg`, '--d': `${f.d}s` }}>
          <Fly c1={f.c1} c2={f.c2} />
        </span>
      ))}
      <div className="grv-fl-body">
        <span className="grv-fl-rib" />
      </div>
      <div className="grv-fl-lid">
        <span className="grv-fl-rib" />
        <span className="grv-bf perch">
          <Fly c1="#f4b6a8" c2="#f9d9cf" />
        </span>
      </div>
    </div>
  );
}

/* 9 · festival diya and rangoli */
const R1 = Array.from({ length: 12 }, (_, i) => i * 30);
const R2 = Array.from({ length: 8 }, (_, i) => i * 45 + 22.5);
const DOTS = Array.from({ length: 16 }, (_, i) => i * 22.5);
function Diya({ open }) {
  return (
    <div className={`grv-o grv-diya ${open ? 'open' : ''}`}>
      <span className="grv-dy-glow" />
      <div className="grv-rg" aria-hidden="true">
        {DOTS.map((a) => (
          <i key={`d${a}`} className="dot" style={{ '--a': `${a}deg` }} />
        ))}
        {R1.map((a, i) => (
          <i key={`a${a}`} className="pt r1" style={{ '--a': `${a}deg`, '--c': i % 2 ? '#d6457a' : '#f2a33a' }} />
        ))}
        {R2.map((a, i) => (
          <i key={`b${a}`} className="pt r2" style={{ '--a': `${a}deg`, '--c': i % 2 ? '#f6c344' : '#f7efe0' }} />
        ))}
        <i className="core" />
      </div>
      <div className="grv-dy-lamp">
        <span className="grv-dy-flame" />
        <svg viewBox="0 0 120 60" aria-hidden="true">
          <path d="M4 18 C14 52 106 52 116 18 C96 26 24 26 4 18 Z" fill="#c9893a" />
          <path d="M4 18 C24 26 96 26 116 18 C100 12 20 12 4 18 Z" fill="#7a4a1c" />
          <path d="M14 30 C40 40 80 40 106 30" stroke="#f3d08c" strokeWidth="2.5" fill="none" opacity="0.9" />
          <circle cx="36" cy="38" r="2.4" fill="#f3d08c" />
          <circle cx="60" cy="41" r="2.4" fill="#f3d08c" />
          <circle cx="84" cy="38" r="2.4" fill="#f3d08c" />
        </svg>
      </div>
      <span className="grv-sparks" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} style={{ '--x': `${(i - 4.5) * 14}px`, '--d': `${0.6 + (i % 5) * 0.22}s` }} />
        ))}
      </span>
    </div>
  );
}

const MAP = { envelope: Envelope, box: Box, night: Case, bloom: Lotus, balloons: Balloons, teddy: Teddy, locket: Locket, butterfly: Butterflies, diya: Diya };

export default function Opener({ theme, open }) {
  const C = MAP[theme] || Envelope;
  return <C open={open} />;
}
