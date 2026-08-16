import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { PRODUCTS } from '../data/products';
import { FRAME_OPTIONS } from '../data/frameOptions';
import { useCart } from '../context/CartContext';

/* ─────────────────────────────────────────────────────────────────────────────
   HERO SVG — cinematic wide-format living room (1400 × 560)
   ───────────────────────────────────────────────────────────────────────────── */
const HERO_SVG = `<svg viewBox="0 0 1400 560" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
  <defs>
    <linearGradient id="hr-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#EAE0CC"/><stop offset="100%" stop-color="#D6C9AE"/></linearGradient>
    <linearGradient id="hr-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#C8A87C"/><stop offset="100%" stop-color="#A8885A"/></linearGradient>
    <linearGradient id="hr-sofa" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7A5C3C"/><stop offset="100%" stop-color="#5A4028"/></linearGradient>
    <radialGradient id="hr-sun" cx="85%" cy="5%" r="65%"><stop offset="0%" stop-color="#FFF5E0" stop-opacity=".55"/><stop offset="100%" stop-color="#FFF5E0" stop-opacity="0"/></radialGradient>
    <radialGradient id="hr-lamp" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#FFE8A0" stop-opacity=".5"/><stop offset="100%" stop-color="#FFE8A0" stop-opacity="0"/></radialGradient>
    <linearGradient id="hr-fade-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(26,18,8,0)"/><stop offset="100%" stop-color="rgba(26,18,8,0.55)"/></linearGradient>
    <linearGradient id="hr-art1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1A2E48"/><stop offset="100%" stop-color="#0D1A2A"/></linearGradient>
    <linearGradient id="hr-art2" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="#4A1A0A"/><stop offset="50%" stop-color="#B68D40"/><stop offset="100%" stop-color="#E8D090"/></linearGradient>
    <linearGradient id="hr-art3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0A1E10"/><stop offset="100%" stop-color="#1E5C30"/></linearGradient>
    <linearGradient id="hr-art4" x1="1" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2E1A0A"/><stop offset="100%" stop-color="#8B5A28"/></linearGradient>
    <linearGradient id="hr-art5" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2A0A2E"/><stop offset="100%" stop-color="#6B1A6B"/></linearGradient>
    <filter id="hr-shadow"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="rgba(0,0,0,0.22)"/></filter>
    <filter id="hr-frameshadow"><feDropShadow dx="4" dy="8" stdDeviation="6" flood-color="rgba(0,0,0,0.4)"/></filter>
  </defs>
  <!-- Wall -->
  <rect width="1400" height="430" fill="url(#hr-wall)"/>
  <!-- Sunlight wash -->
  <rect width="1400" height="430" fill="url(#hr-sun)"/>
  <!-- Crown moulding -->
  <rect x="0" y="0" width="1400" height="18" fill="#CFC0A0" opacity=".55"/>
  <rect x="20" y="17" width="1360" height="5" rx="2" fill="#C0B090" opacity=".38"/>
  <!-- Wainscoting panel -->
  <rect x="0" y="340" width="1400" height="10" fill="#C8B898" opacity=".5"/>
  <rect x="50" y="60" width="1300" height="268" rx="2" fill="none" stroke="#C0B090" stroke-width="1.5" opacity=".3"/>
  <!-- Floor -->
  <rect y="430" width="1400" height="130" fill="url(#hr-floor)"/>
  <!-- Floor planks perspective -->
  <line x1="0" y1="448" x2="1400" y2="448" stroke="#B09060" stroke-width=".9" opacity=".4"/>
  <line x1="0" y1="470" x2="1400" y2="470" stroke="#B09060" stroke-width=".9" opacity=".35"/>
  <line x1="0" y1="495" x2="1400" y2="495" stroke="#B09060" stroke-width=".9" opacity=".3"/>
  <line x1="0" y1="520" x2="1400" y2="520" stroke="#B09060" stroke-width=".7" opacity=".25"/>
  <!-- Area rug -->
  <ellipse cx="650" cy="452" rx="360" ry="34" fill="#8B6A3A" opacity=".3"/>
  <ellipse cx="650" cy="452" rx="330" ry="26" fill="none" stroke="#B69060" stroke-width="1.5" opacity=".2"/>

  <!-- ─── FURNITURE ─── -->
  <!-- Large sofa -->
  <rect x="200" y="385" width="620" height="48" rx="7" fill="url(#hr-sofa)"/>
  <rect x="194" y="352" width="632" height="42" rx="9" fill="#8B6848"/>
  <rect x="200" y="302" width="620" height="58" rx="9" fill="url(#hr-sofa)"/>
  <!-- Sofa cushions -->
  <rect x="218" y="313" width="180" height="42" rx="6" fill="#9A7850" opacity=".9"/>
  <rect x="410" y="313" width="180" height="42" rx="6" fill="#9A7850" opacity=".9"/>
  <rect x="602" y="313" width="180" height="42" rx="6" fill="#9A7850" opacity=".9"/>
  <!-- Sofa arms -->
  <rect x="186" y="318" width="26" height="72" rx="6" fill="#6A4C2E"/>
  <rect x="808" y="318" width="26" height="72" rx="6" fill="#6A4C2E"/>
  <!-- Ottoman / coffee table -->
  <rect x="340" y="432" width="290" height="18" rx="4" fill="#7A5C3A" opacity=".8"/>
  <rect x="360" y="448" width="16" height="24" rx="2" fill="#5A3C22" opacity=".7"/>
  <rect x="594" y="448" width="16" height="24" rx="2" fill="#5A3C22" opacity=".7"/>
  <!-- Coffee table top items -->
  <rect x="390" y="424" width="48" height="9" rx="2" fill="#E8D0A0" opacity=".7"/>
  <rect x="453" y="424" width="34" height="9" rx="2" fill="#D4B880" opacity=".7"/>
  <ellipse cx="546" cy="428" rx="22" ry="6" fill="#D0C0A0" opacity=".5"/>
  <!-- Candle -->
  <rect x="498" y="414" width="9" height="14" rx="1" fill="#F5ECE0" opacity=".9"/>
  <ellipse cx="503" cy="413" rx="5" ry="3" fill="#FFD080" opacity=".85"/>

  <!-- Side table left -->
  <rect x="88" y="380" width="82" height="60" rx="5" fill="#8B6A3A" opacity=".7"/>
  <ellipse cx="129" cy="382" rx="44" ry="8" fill="#A08048" opacity=".8"/>
  <!-- Lamp left -->
  <rect x="125" y="330" width="9" height="52" fill="#5A4030" opacity=".75"/>
  <ellipse cx="130" cy="330" rx="30" ry="9" fill="#EDD090" opacity=".88"/>
  <ellipse cx="130" cy="328" rx="24" ry="15" fill="url(#hr-lamp)"/>

  <!-- Large indoor plant (right) -->
  <rect x="1090" y="375" width="40" height="58" rx="6" fill="#6A5030" opacity=".8"/>
  <ellipse cx="1110" cy="378" rx="24" ry="10" fill="#7A6040" opacity=".7"/>
  <ellipse cx="1110" cy="310" rx="68" ry="80" fill="#3A6A20" opacity=".75"/>
  <ellipse cx="1080" cy="295" rx="40" ry="55" fill="#2E5818" opacity=".7"/>
  <ellipse cx="1140" cy="300" rx="38" ry="50" fill="#4A7A28" opacity=".7"/>
  <ellipse cx="1110" cy="265" rx="22" ry="34" fill="#3A6A20" opacity=".8"/>

  <!-- Side table right -->
  <rect x="980" y="375" width="80" height="60" rx="5" fill="#8B6A3A" opacity=".7"/>
  <ellipse cx="1020" cy="377" rx="42" ry="8" fill="#A08048" opacity=".8"/>
  <!-- Lamp right -->
  <rect x="1016" y="325" width="9" height="52" fill="#5A4030" opacity=".75"/>
  <ellipse cx="1021" cy="325" rx="30" ry="9" fill="#EDD090" opacity=".88"/>
  <ellipse cx="1021" cy="323" rx="24" ry="15" fill="url(#hr-lamp)"/>

  <!-- ─── JHAYRA GALLERY WALL (right cluster) ─── -->
  <!-- Large portrait frame (center-right) -->
  <g filter="url(#hr-frameshadow)">
    <rect x="820" y="68" width="148" height="210" rx="3" fill="#1E1408"/>
    <rect x="826" y="74" width="136" height="198" fill="url(#hr-art1)"/>
    <circle cx="894" cy="173" r="38" fill="none" stroke="#B68D40" stroke-width="1.5" opacity=".5"/>
    <path d="M872 158 Q894 142 916 158 Q894 174 872 158Z" fill="#B68D40" opacity=".5"/>
    <line x1="826" y1="173" x2="962" y2="173" stroke="#B68D40" stroke-width=".8" opacity=".25"/>
    <text x="894" y="268" text-anchor="middle" font-family="serif" font-size="9" fill="#B68D40" opacity=".7" letter-spacing="2">JHAYRA</text>
  </g>
  <!-- Medium landscape frame (top-left of cluster) -->
  <g filter="url(#hr-frameshadow)">
    <rect x="628" y="72" width="170" height="115" rx="3" fill="#1E1408"/>
    <rect x="634" y="78" width="158" height="103" fill="url(#hr-art2)"/>
    <path d="M680 108 Q713 92 746 108 Q713 124 680 108Z" fill="#B68D40" opacity=".45"/>
    <line x1="634" y1="130" x2="792" y2="130" stroke="#fff" stroke-width=".6" opacity=".15"/>
    <text x="713" y="176" text-anchor="middle" font-family="serif" font-size="7.5" fill="#B68D40" opacity=".7" letter-spacing="2">JHAYRA</text>
  </g>
  <!-- Square frame (below landscape) -->
  <g filter="url(#hr-frameshadow)">
    <rect x="628" y="205" width="115" height="115" rx="3" fill="#1E1408"/>
    <rect x="634" y="211" width="103" height="103" fill="url(#hr-art3)"/>
    <path d="M660 248 L685 228 L710 248 L710 298 L660 298Z" fill="#B68D40" opacity=".25"/>
    <text x="685" y="316" text-anchor="middle" font-family="serif" font-size="7" fill="#B68D40" opacity=".7" letter-spacing="2">JHAYRA</text>
  </g>
  <!-- Small square frame (top-right of cluster) -->
  <g filter="url(#hr-frameshadow)">
    <rect x="985" y="78" width="90" height="90" rx="3" fill="#1E1408"/>
    <rect x="990" y="83" width="80" height="80" fill="url(#hr-art4)"/>
    <circle cx="1030" cy="123" r="20" fill="none" stroke="#D4A85A" stroke-width="1" opacity=".5"/>
    <text x="1030" y="165" text-anchor="middle" font-family="serif" font-size="7" fill="#B68D40" opacity=".7" letter-spacing="2">JHAYRA</text>
  </g>
  <!-- Small portrait frame (bottom-right) -->
  <g filter="url(#hr-frameshadow)">
    <rect x="985" y="185" width="90" height="120" rx="3" fill="#1E1408"/>
    <rect x="990" y="190" width="80" height="110" fill="url(#hr-art5)"/>
    <path d="M1010 220 Q1030 208 1050 220 Q1030 232 1010 220Z" fill="#D4A85A" opacity=".5"/>
    <text x="1030" y="302" text-anchor="middle" font-family="serif" font-size="7" fill="#B68D40" opacity=".7" letter-spacing="2">JHAYRA</text>
  </g>
  <!-- Hangers / wires -->
  <line x1="860" y1="68" x2="894" y2="58" stroke="#AAA" stroke-width=".8" opacity=".4"/>
  <line x1="928" y1="68" x2="894" y2="58" stroke="#AAA" stroke-width=".8" opacity=".4"/>
  <line x1="685" y1="72" x2="713" y2="62" stroke="#AAA" stroke-width=".8" opacity=".4"/>
  <line x1="741" y1="72" x2="713" y2="62" stroke="#AAA" stroke-width=".8" opacity=".4"/>

  <!-- ─── ACCENT WALL / BOOKSHELF (far left) ─── -->
  <rect x="0" y="80" width="100" height="310" rx="3" fill="#8B7050" opacity=".65"/>
  <rect x="8" y="88" width="84" height="8" rx="1" fill="#A08060" opacity=".7"/>
  <rect x="8" y="200" width="84" height="7" rx="1" fill="#A08060" opacity=".7"/>
  <rect x="8" y="300" width="84" height="7" rx="1" fill="#A08060" opacity=".7"/>
  <rect x="14" y="97" width="9" height="100" rx="1" fill="#8B2020" opacity=".8"/>
  <rect x="26" y="100" width="8" height="97" rx="1" fill="#20508B" opacity=".8"/>
  <rect x="37" y="98" width="10" height="99" rx="1" fill="#1E5A28" opacity=".8"/>
  <rect x="50" y="102" width="9" height="95" rx="1" fill="#B68D40" opacity=".85"/>
  <rect x="62" y="97" width="8" height="100" rx="1" fill="#8B3A8B" opacity=".75"/>
  <rect x="73" y="100" width="9" height="97" rx="1" fill="#5A3A1E" opacity=".8"/>

  <!-- ─── BOTTOM CINEMATIC FADE ─── -->
  <rect y="370" width="1400" height="190" fill="url(#hr-fade-b)"/>
</svg>`;

/* ── ROOM BASE SCENES (existing 6 SVGs — used for look cards) ──────────────── */
const SCENE_SVGS = {
  living: `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><defs><linearGradient id="lv-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#EDE0C8"/><stop offset="100%" stop-color="#D6C8B0"/></linearGradient><linearGradient id="lv-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#C4A882"/><stop offset="100%" stop-color="#A8875A"/></linearGradient><linearGradient id="lv-sofa" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7A5C3A"/><stop offset="100%" stop-color="#5C4028"/></linearGradient><linearGradient id="lv-art1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2D4A6B"/><stop offset="60%" stop-color="#1A2F47"/><stop offset="100%" stop-color="#B68D40"/></linearGradient><linearGradient id="lv-art2" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="#5C3A1E"/><stop offset="50%" stop-color="#B68D40"/><stop offset="100%" stop-color="#E8D5A0"/></linearGradient><linearGradient id="lv-art3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1A3A2A"/><stop offset="100%" stop-color="#2E6B4A"/></linearGradient></defs><rect width="800" height="360" fill="url(#lv-wall)"/><rect x="0" y="290" width="800" height="8" fill="#C4B090" opacity=".6"/><rect x="40" y="40" width="720" height="240" rx="2" fill="none" stroke="#C4B090" stroke-width="1.5" opacity=".4"/><rect y="360" width="800" height="120" fill="url(#lv-floor)"/><line x1="0" y1="380" x2="800" y2="380" stroke="#B09060" stroke-width=".8" opacity=".5"/><line x1="0" y1="400" x2="800" y2="400" stroke="#B09060" stroke-width=".8" opacity=".5"/><ellipse cx="400" cy="385" rx="240" ry="28" fill="#8B6A40" opacity=".35"/><rect x="160" y="330" width="480" height="35" rx="6" fill="url(#lv-sofa)"/><rect x="155" y="305" width="490" height="35" rx="8" fill="#8B6844"/><rect x="160" y="258" width="480" height="55" rx="8" fill="url(#lv-sofa)"/><rect x="175" y="268" width="140" height="40" rx="5" fill="#A07848" opacity=".9"/><rect x="330" y="268" width="140" height="40" rx="5" fill="#A07848" opacity=".9"/><rect x="485" y="268" width="140" height="40" rx="5" fill="#A07848" opacity=".9"/><rect x="148" y="275" width="22" height="65" rx="5" fill="#6A4C2E"/><rect x="630" y="275" width="22" height="65" rx="5" fill="#6A4C2E"/><rect x="80" y="318" width="65" height="52" rx="4" fill="#8B6A40" opacity=".7"/><ellipse cx="112" cy="320" rx="36" ry="6" fill="#A07848" opacity=".8"/><rect x="108" y="278" width="8" height="42" fill="#6A4C2E" opacity=".7"/><ellipse cx="112" cy="278" rx="24" ry="7" fill="#E8D5A0" opacity=".9"/><rect x="655" y="318" width="65" height="52" rx="4" fill="#8B6A40" opacity=".7"/><ellipse cx="687" cy="320" rx="36" ry="6" fill="#A07848" opacity=".8"/><rect x="683" y="290" width="8" height="30" fill="#5A7A3A" opacity=".8"/><ellipse cx="687" cy="285" rx="18" ry="14" fill="#4A6A2A" opacity=".8"/><rect x="295" y="60" width="210" height="155" rx="3" fill="#2A2010"/><rect x="300" y="65" width="200" height="145" fill="url(#lv-art1)"/><circle cx="400" cy="138" r="28" fill="none" stroke="#B68D40" stroke-width="1.2" opacity=".6"/><circle cx="400" cy="138" r="18" fill="#B68D40" opacity=".2"/><text x="400" y="212" text-anchor="middle" font-family="serif" font-size="9" fill="#B68D40" opacity=".7">JHAYRA</text><rect x="108" y="78" width="145" height="105" rx="3" fill="#2A2010"/><rect x="113" y="83" width="135" height="95" fill="url(#lv-art2)"/><text x="180" y="175" text-anchor="middle" font-family="serif" font-size="7" fill="#B68D40" opacity=".7">JHAYRA</text><rect x="547" y="78" width="145" height="105" rx="3" fill="#2A2010"/><rect x="552" y="83" width="135" height="95" fill="url(#lv-art3)"/><text x="620" y="175" text-anchor="middle" font-family="serif" font-size="7" fill="#B68D40" opacity=".7">JHAYRA</text></svg>`,

  bedroom: `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><defs><linearGradient id="bd-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E8DDD0"/><stop offset="100%" stop-color="#D4C8B8"/></linearGradient><linearGradient id="bd-bed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8B7260"/><stop offset="100%" stop-color="#6A5444"/></linearGradient><linearGradient id="bd-art1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#3A1A2E"/><stop offset="50%" stop-color="#6B2D5A"/><stop offset="100%" stop-color="#B68D40"/></linearGradient><linearGradient id="bd-art2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1A2A3A"/><stop offset="100%" stop-color="#B68D40"/></linearGradient></defs><rect width="800" height="360" fill="url(#bd-wall)"/><rect x="220" y="30" width="360" height="290" rx="4" fill="#DDD0C0" opacity=".5"/><rect x="230" y="40" width="340" height="270" rx="3" fill="none" stroke="#C4B8A4" stroke-width="1.5"/><rect y="360" width="800" height="120" fill="#B09070"/><line x1="0" y1="378" x2="800" y2="378" stroke="#A08060" stroke-width=".8" opacity=".5"/><rect x="60" y="295" width="80" height="75" rx="4" fill="#8B7260" opacity=".7"/><rect x="660" y="295" width="80" height="75" rx="4" fill="#8B7260" opacity=".7"/><rect x="95" y="258" width="10" height="37" fill="#6A5444" opacity=".8"/><ellipse cx="100" cy="258" rx="28" ry="8" fill="#E8D090" opacity=".9"/><rect x="695" y="258" width="10" height="37" fill="#6A5444" opacity=".8"/><ellipse cx="700" cy="258" rx="28" ry="8" fill="#E8D090" opacity=".9"/><rect x="150" y="290" width="500" height="80" rx="5" fill="url(#bd-bed)"/><rect x="148" y="215" width="504" height="80" rx="10" fill="#7A6250"/><rect x="160" y="225" width="480" height="62" rx="8" fill="#8B7260" opacity=".6"/><rect x="170" y="282" width="150" height="30" rx="8" fill="#F0E8DC" opacity=".95"/><rect x="480" y="282" width="150" height="30" rx="8" fill="#F0E8DC" opacity=".95"/><rect x="148" y="305" width="504" height="65" rx="5" fill="#C4A88A" opacity=".8"/><rect x="312" y="60" width="176" height="128" rx="3" fill="#2A1E10"/><rect x="317" y="65" width="166" height="118" fill="url(#bd-art1)"/><circle cx="400" cy="124" r="30" fill="none" stroke="#B68D40" stroke-width="1" opacity=".5"/><path d="M380 110 Q400 95 420 110 Q400 125 380 110Z" fill="#B68D40" opacity=".5"/><text x="400" y="185" text-anchor="middle" font-family="serif" font-size="8" fill="#B68D40" opacity=".7">JHAYRA</text><rect x="134" y="85" width="72" height="52" rx="3" fill="#2A1E10"/><rect x="138" y="89" width="64" height="44" fill="url(#bd-art2)"/><text x="170" y="134" text-anchor="middle" font-family="serif" font-size="6" fill="#B68D40" opacity=".7">JHAYRA</text><rect x="594" y="85" width="72" height="52" rx="3" fill="#2A1E10"/><rect x="598" y="89" width="64" height="44" fill="url(#bd-art2)"/><text x="630" y="134" text-anchor="middle" font-family="serif" font-size="6" fill="#B68D40" opacity=".7">JHAYRA</text></svg>`,

  dining: `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><defs><linearGradient id="dn-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#F0E8D8"/><stop offset="100%" stop-color="#E0D0BC"/></linearGradient><linearGradient id="dn-art" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0F2A1A"/><stop offset="40%" stop-color="#1E5C36"/><stop offset="100%" stop-color="#B68D40"/></linearGradient><linearGradient id="dn-table" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6A4C2E"/><stop offset="100%" stop-color="#4A3018"/></linearGradient></defs><rect width="800" height="360" fill="url(#dn-wall)"/><rect x="0" y="200" width="800" height="6" fill="#C8B89A" opacity=".6"/><rect x="0" y="200" width="800" height="160" fill="#E4D8C4" opacity=".3"/><rect y="360" width="800" height="120" fill="#8B6A40"/><ellipse cx="400" cy="370" rx="230" ry="24" fill="url(#dn-table)"/><rect x="170" y="342" width="460" height="30" rx="4" fill="#7A5C3A"/><rect x="80" y="318" width="68" height="52" rx="6" fill="#5A4030" opacity=".7"/><rect x="72" y="296" width="84" height="26" rx="8" fill="#6A5040" opacity=".7"/><rect x="652" y="318" width="68" height="52" rx="6" fill="#5A4030" opacity=".7"/><rect x="644" y="296" width="84" height="26" rx="8" fill="#6A5040" opacity=".7"/><line x1="400" y1="0" x2="400" y2="55" stroke="#888" stroke-width="1.5" opacity=".5"/><ellipse cx="400" cy="62" rx="40" ry="12" fill="#3A2810" opacity=".9"/><rect x="282" y="40" width="236" height="140" rx="3" fill="#1E1408"/><rect x="287" y="45" width="226" height="130" fill="url(#dn-art)"/><circle cx="400" cy="110" r="35" fill="none" stroke="#B68D40" stroke-width="1.2" opacity=".5"/><path d="M375 95 Q400 78 425 95 Q400 112 375 95Z" fill="#B68D40" opacity=".45"/><text x="400" y="177" text-anchor="middle" font-family="serif" font-size="9" fill="#B68D40" opacity=".7">JHAYRA</text><rect x="100" y="55" width="100" height="72" rx="3" fill="#1E1408"/><rect x="105" y="60" width="90" height="62" fill="#2A4A1A"/><text x="150" y="124" text-anchor="middle" font-family="serif" font-size="6.5" fill="#B68D40" opacity=".7">JHAYRA</text><rect x="600" y="55" width="100" height="72" rx="3" fill="#1E1408"/><rect x="605" y="60" width="90" height="62" fill="#1A3A4A"/><text x="650" y="124" text-anchor="middle" font-family="serif" font-size="6.5" fill="#B68D40" opacity=".7">JHAYRA</text></svg>`,

  office: `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><defs><linearGradient id="of-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E8EDF2"/><stop offset="100%" stop-color="#D8E0E8"/></linearGradient><linearGradient id="of-desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5A4A3A"/><stop offset="100%" stop-color="#3A2E22"/></linearGradient><linearGradient id="of-art1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#0D1A2E"/><stop offset="100%" stop-color="#1A3050"/></linearGradient><linearGradient id="of-art2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2A1A0A"/><stop offset="100%" stop-color="#B68D40"/></linearGradient></defs><rect width="800" height="360" fill="url(#of-wall)"/><rect y="360" width="800" height="120" fill="#8E8078"/><rect x="30" y="80" width="120" height="240" rx="3" fill="#4A3A2A" opacity=".85"/><rect x="36" y="86" width="108" height="10" rx="1" fill="#6A5A44"/><rect x="40" y="97" width="12" height="80" rx="1" fill="#C04A2A" opacity=".8"/><rect x="55" y="100" width="10" height="77" rx="1" fill="#2A5A8A" opacity=".8"/><rect x="68" y="98" width="9" height="79" rx="1" fill="#3A7A3A" opacity=".8"/><rect x="80" y="102" width="11" height="75" rx="1" fill="#B68D40" opacity=".8"/><rect x="160" y="308" width="560" height="16" rx="3" fill="url(#of-desk)"/><rect x="330" y="250" width="200" height="130" rx="4" fill="#1A1A1E"/><rect x="337" y="257" width="186" height="108" rx="2" fill="#2A3A4A"/><rect x="490" y="65" width="185" height="130" rx="3" fill="#1A1408"/><rect x="495" y="70" width="175" height="120" fill="url(#of-art1)"/><text x="582" y="108" text-anchor="middle" font-family="serif" font-size="16" fill="#B68D40" opacity=".8" font-style="italic">Dream</text><text x="582" y="122" text-anchor="middle" font-family="serif" font-size="8" fill="#8899AA" opacity=".6">Create · Achieve</text><text x="582" y="182" text-anchor="middle" font-family="serif" font-size="7" fill="#B68D40" opacity=".6">JHAYRA</text><rect x="498" y="215" width="80" height="56" rx="3" fill="#1A1408"/><rect x="502" y="219" width="72" height="48" fill="url(#of-art2)"/><text x="538" y="264" text-anchor="middle" font-family="serif" font-size="5.5" fill="#B68D40" opacity=".7">JHAYRA</text><rect x="590" y="215" width="80" height="56" rx="3" fill="#1A1408"/><rect x="594" y="219" width="72" height="48" fill="url(#of-art1)"/><text x="634" y="264" text-anchor="middle" font-family="serif" font-size="5.5" fill="#B68D40" opacity=".7">JHAYRA</text></svg>`,

  mandir: `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><defs><linearGradient id="md-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#F5EDD8"/><stop offset="100%" stop-color="#E8D8BE"/></linearGradient><linearGradient id="md-arch" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#B68D40"/><stop offset="100%" stop-color="#8B6A2E"/></linearGradient><linearGradient id="md-art1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2A0A0A"/><stop offset="50%" stop-color="#6B1A1A"/><stop offset="100%" stop-color="#B68D40"/></linearGradient><radialGradient id="md-glow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#FFD080" stop-opacity=".4"/><stop offset="100%" stop-color="#FFD080" stop-opacity="0"/></radialGradient></defs><rect width="800" height="360" fill="url(#md-wall)"/><rect x="0" y="0" width="800" height="12" fill="#B68D40" opacity=".6"/><path d="M290 340 L290 140 Q290 60 400 60 Q510 60 510 140 L510 340Z" fill="#F5EDD8" stroke="url(#md-arch)" stroke-width="8"/><circle cx="400" cy="68" r="14" fill="#B68D40" opacity=".8"/><rect x="280" y="330" width="240" height="14" rx="3" fill="#B68D40"/><ellipse cx="400" cy="230" rx="80" ry="90" fill="url(#md-glow)"/><ellipse cx="400" cy="318" rx="16" ry="6" fill="#B68D40" opacity=".8"/><ellipse cx="400" cy="310" rx="5" ry="7" fill="#FFD080" opacity=".9"/><rect x="343" y="125" width="114" height="150" rx="3" fill="#2A1808"/><rect x="347" y="129" width="106" height="142" fill="url(#md-art1)"/><text x="400" y="208" text-anchor="middle" font-size="36" fill="#B68D40" opacity=".7" font-family="serif">ॐ</text><text x="400" y="264" text-anchor="middle" font-family="serif" font-size="7" fill="#D4A85A" opacity=".7">JHAYRA</text><rect x="343" y="125" width="114" height="150" rx="3" fill="none" stroke="#B68D40" stroke-width="1.5"/><rect x="90" y="80" width="145" height="190" rx="3" fill="#2A1808"/><rect x="95" y="85" width="135" height="180" fill="url(#md-art1)"/><text x="163" y="178" text-anchor="middle" font-size="28" fill="#B68D40" opacity=".6" font-family="serif">ॐ</text><text x="163" y="262" text-anchor="middle" font-family="serif" font-size="7" fill="#B68D40" opacity=".7">JHAYRA</text><rect x="565" y="80" width="145" height="190" rx="3" fill="#2A1808"/><rect x="570" y="85" width="135" height="180" fill="url(#md-art1)"/><text x="637" y="178" text-anchor="middle" font-size="28" fill="#D4A85A" opacity=".6" font-family="serif">ॐ</text><text x="637" y="262" text-anchor="middle" font-family="serif" font-size="7" fill="#B68D40" opacity=".7">JHAYRA</text><rect y="360" width="800" height="120" fill="#C4A870"/><rect x="0" y="358" width="800" height="4" fill="#B68D40" opacity=".5"/></svg>`,

  gallery: `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><defs><linearGradient id="gw-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#F0EAE0"/><stop offset="100%" stop-color="#E4DCD0"/></linearGradient><linearGradient id="gw-a1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1A0A2E"/><stop offset="100%" stop-color="#B68D40"/></linearGradient><linearGradient id="gw-a2" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="#0A1E2E"/><stop offset="100%" stop-color="#2A6B8B"/></linearGradient><linearGradient id="gw-a3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1E2E0A"/><stop offset="100%" stop-color="#4A7A2A"/></linearGradient><linearGradient id="gw-a4" x1="1" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2E0A0A"/><stop offset="100%" stop-color="#8B2E1A"/></linearGradient></defs><rect width="800" height="360" fill="url(#gw-wall)"/><rect y="360" width="800" height="120" fill="#A89070"/><rect x="0" y="342" width="800" height="18" fill="#D8CEC0"/><rect x="0" y="40" width="800" height="6" fill="#C8BEB0" opacity=".6"/><rect x="44" y="55" width="155" height="118" rx="3" fill="#1E1408"/><rect x="49" y="60" width="145" height="108" fill="url(#gw-a1)"/><text x="122" y="165" text-anchor="middle" font-family="serif" font-size="7" fill="#B68D40" opacity=".6">JHAYRA</text><rect x="225" y="52" width="198" height="138" rx="3" fill="#1E1408"/><rect x="230" y="57" width="188" height="128" fill="url(#gw-a2)"/><text x="324" y="183" text-anchor="middle" font-family="serif" font-size="7" fill="#B68D40" opacity=".6">JHAYRA</text><rect x="450" y="55" width="108" height="148" rx="3" fill="#1E1408"/><rect x="455" y="60" width="98" height="138" fill="url(#gw-a3)"/><text x="504" y="200" text-anchor="middle" font-family="serif" font-size="7" fill="#B68D40" opacity=".6">JHAYRA</text><rect x="580" y="55" width="178" height="118" rx="3" fill="#1E1408"/><rect x="585" y="60" width="168" height="108" fill="url(#gw-a4)"/><text x="669" y="165" text-anchor="middle" font-family="serif" font-size="7" fill="#B68D40" opacity=".6">JHAYRA</text><rect x="55" y="196" width="85" height="60" rx="3" fill="#1E1408"/><rect x="59" y="200" width="77" height="52" fill="url(#gw-a1)"/><text x="97" y="252" text-anchor="middle" font-family="serif" font-size="6" fill="#B68D40" opacity=".6">JHAYRA</text><rect x="236" y="212" width="150" height="100" rx="3" fill="#1E1408"/><rect x="241" y="217" width="140" height="90" fill="url(#gw-a2)"/><text x="311" y="308" text-anchor="middle" font-family="serif" font-size="6.5" fill="#B68D40" opacity=".6">JHAYRA</text><rect x="598" y="193" width="80" height="58" rx="3" fill="#1E1408"/><rect x="602" y="197" width="72" height="50" fill="url(#gw-a3)"/><text x="638" y="246" text-anchor="middle" font-family="serif" font-size="6" fill="#B68D40" opacity=".6">JHAYRA</text></svg>`,
};

/* ─────────────────────────────────────────────────────────────────────────────
   DATA — LOOKS (data-driven, references real product IDs)
   ───────────────────────────────────────────────────────────────────────────── */
const LOOKS = [
  // ── Living Room ──────────────────────────────────────────────────────────────
  { id:'lv-warm',  room:'living',  name:'Warm Minimal',        tagline:'Soft neutral tones with elegant statement frames.', style:['minimal','warm'],               products:['p002','p004','p010'], personalized:false, filter:'sepia(0.12) brightness(1.04)' },
  { id:'lv-modern',room:'living',  name:'Modern Statement',    tagline:'Bold contemporary art meets a confident interior.',  style:['modern'],                       products:['p004','p005','p007'], personalized:false, filter:'hue-rotate(195deg) saturate(0.35) brightness(1.06)' },
  { id:'lv-family',room:'living',  name:'Family Memories',     tagline:'A living room that tells your family\'s story.',      style:['warm','personalized'],          products:['p035','p036','p001'], personalized:true,  filter:'sepia(0.22) saturate(0.9) brightness(0.97)' },
  { id:'lv-luxury',room:'living',  name:'Luxury Gallery',      tagline:'An opulent devotional gallery in warm ivory.',       style:['luxury'],                       products:['p003','p021','p008'], personalized:false, filter:'sepia(0.38) contrast(1.06) brightness(0.95)' },
  // ── Bedroom ──────────────────────────────────────────────────────────────────
  { id:'bd-calm',  room:'bedroom', name:'Calm & Minimal',      tagline:'A serene retreat with thoughtfully curated art.',     style:['minimal','warm'],               products:['p002','p047','p010'], personalized:false, filter:'sepia(0.08) brightness(1.05)' },
  { id:'bd-couple',room:'bedroom', name:'Couple Memories',     tagline:'Your love story, beautifully framed above the bed.', style:['warm','personalized'],          products:['p001','p029','p030'], personalized:true,  filter:'sepia(0.28) saturate(1.08) brightness(0.96)' },
  { id:'bd-gold',  room:'bedroom', name:'Elegant Gold',        tagline:'Rich golden accents for a luxurious retreat.',        style:['luxury'],                       products:['p008','p021','p031'], personalized:false, filter:'sepia(0.48) contrast(1.08) saturate(0.88)' },
  // ── Dining Room ──────────────────────────────────────────────────────────────
  { id:'dn-nature',room:'dining',  name:'Fresh & Natural',     tagline:'Botanical and nature art for a refreshing dining experience.', style:['minimal','warm'],   products:['p002','p011','p046'], personalized:false, filter:'hue-rotate(28deg) saturate(0.72) brightness(1.06)' },
  { id:'dn-modern',room:'dining',  name:'Modern Dining',       tagline:'Contemporary art that transforms every meal into an event.', style:['modern'],              products:['p004','p007','p048'], personalized:false, filter:'contrast(1.08) saturate(0.72) brightness(1.03)' },
  // ── Office ───────────────────────────────────────────────────────────────────
  { id:'of-minimal',    room:'office', name:'Minimal Professional', tagline:'Clean workspace, focused energy, curated art.',  style:['minimal','modern'],          products:['p012','p048','p047'], personalized:false, filter:'brightness(1.06) saturate(0.68)' },
  { id:'of-motivational',room:'office',name:'Motivational',         tagline:'Art that fuels ambition and daily excellence.', style:['modern'],                     products:['p012','p048','p005'], personalized:false, filter:'hue-rotate(205deg) saturate(0.4) brightness(1.02)' },
  { id:'of-personal',   room:'office', name:'Personal Touch',       tagline:'Your goals, your memories — your workspace.',   style:['personalized','warm'],        products:['p001','p043','p012'], personalized:true,  filter:'sepia(0.18) brightness(1.03)' },
  // ── Mandir / Pooja ───────────────────────────────────────────────────────────
  { id:'md-minimal',    room:'mandir', name:'Spiritual Minimal',    tagline:'Sacred calm with restrained devotional art.',   style:['minimal','traditional'],      products:['p028','p024','p003'], personalized:false, filter:'brightness(1.05) sepia(0.1)' },
  { id:'md-traditional',room:'mandir', name:'Traditional',          tagline:'Rich heritage, time-honoured devotional arrangements.', style:['traditional'],        products:['p003','p006','p017'], personalized:false, filter:'sepia(0.18) saturate(1.14) brightness(0.97)' },
  { id:'md-gold',       room:'mandir', name:'Elegant Gold Mandir',  tagline:'Ornate gold accents with luminous devotional prints.', style:['luxury','traditional'],products:['p021','p008','p003'], personalized:false, filter:'sepia(0.42) contrast(1.1) brightness(0.94)' },
  // ── Gallery Wall ─────────────────────────────────────────────────────────────
  { id:'gw-editorial',  room:'gallery', name:'Editorial Gallery',   tagline:'A perfectly curated collection for the modern art lover.', style:['minimal','modern'],products:['p004','p010','p047'], personalized:false, filter:'brightness(1.04) saturate(0.78)' },
  { id:'gw-family',     room:'gallery', name:'Family Memory Gallery', tagline:'A deeply personal gallery of life\'s most cherished moments.', style:['warm','personalized'], products:['p035','p036','p001'], personalized:true, filter:'sepia(0.18) saturate(0.94) brightness(0.98)' },
];

const ROOM_CATS = [
  { id:'all',     label:'All Rooms' },
  { id:'living',  label:'Living Room' },
  { id:'bedroom', label:'Bedroom' },
  { id:'dining',  label:'Dining Room' },
  { id:'office',  label:'Office' },
  { id:'mandir',  label:'Mandir / Pooja' },
  { id:'gallery', label:'Gallery Wall' },
];

const STYLE_OPTIONS = [
  { id:'all',          label:'All Styles' },
  { id:'minimal',      label:'Minimal' },
  { id:'modern',       label:'Modern' },
  { id:'luxury',       label:'Luxury' },
  { id:'warm',         label:'Warm' },
  { id:'traditional',  label:'Traditional' },
  { id:'personalized', label:'Personalized' },
];

const DEFAULT_FRAME = FRAME_OPTIONS[0];

/* ─────────────────────────────────────────────────────────────────────────────
   LOOK DETAIL MODAL
   ───────────────────────────────────────────────────────────────────────────── */
function LookDetailModal({ look, onClose }) {
  const { addToCartWithFrame } = useCart();
  const [added, setAdded] = useState(false);
  const products = look.products.map(id => PRODUCTS[id]).filter(Boolean);
  const available = products.filter(p => p.stockStatus !== 'out-of-stock');
  const total = available.reduce((s, p) => s + (p.price || 499), 0);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  function handleAddAll() {
    available.forEach(p => {
      addToCartWithFrame(p.id, DEFAULT_FRAME, p.name, 1, 'Vertical', p.price || 499);
    });
    setAdded(true);
  }

  const svgScene = SCENE_SVGS[look.room];

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position:'fixed',inset:0,background:'rgba(26,18,8,0.72)',zIndex:4000,
        display:'flex',alignItems:'flex-end',justifyContent:'center',
        padding:'0',
      }}
    >
      <div style={{
        background:'#FAF7F0',width:'100%',maxWidth:'560px',maxHeight:'90vh',
        borderRadius:'20px 20px 0 0',overflow:'hidden',display:'flex',flexDirection:'column',
        boxShadow:'0 -12px 48px rgba(0,0,0,0.2)',
      }}>
        {/* Handle bar */}
        <div style={{display:'flex',justifyContent:'center',padding:'12px 0 4px'}}>
          <div style={{width:40,height:4,borderRadius:4,background:'#DDD5C8'}}/>
        </div>

        {/* Scrollable content */}
        <div style={{overflowY:'auto',flex:1,WebkitOverflowScrolling:'touch'}}>
          {/* Room scene */}
          <div style={{
            position:'relative',overflow:'hidden',
            background:'#E8DEC8',lineHeight:0,
          }}>
            <div style={{filter:look.filter}} dangerouslySetInnerHTML={{__html:svgScene}} />
            {/* Gradient overlay + look name */}
            <div style={{
              position:'absolute',inset:0,
              background:'linear-gradient(to top, rgba(26,18,8,0.75) 0%, transparent 55%)',
              display:'flex',flexDirection:'column',justifyContent:'flex-end',padding:'1.25rem 1.25rem',
            }}>
              <p style={{margin:0,fontSize:'.7rem',fontWeight:700,letterSpacing:'.12em',color:'#D4A85A',textTransform:'uppercase',marginBottom:'.25rem'}}>
                {ROOM_CATS.find(c=>c.id===look.room)?.label}
              </p>
              <h2 style={{margin:0,fontFamily:'var(--fd)',fontSize:'1.35rem',color:'#FAF7F0',lineHeight:1.2}}>{look.name}</h2>
              <p style={{margin:'.3rem 0 0',fontSize:'.82rem',color:'rgba(255,255,255,0.75)'}}>{look.tagline}</p>
            </div>
            {/* Close */}
            <button onClick={onClose} style={{
              position:'absolute',top:'.75rem',right:'.75rem',
              width:32,height:32,borderRadius:'50%',border:'none',
              background:'rgba(26,18,8,0.55)',color:'#FAF7F0',
              cursor:'pointer',fontSize:'1rem',display:'flex',alignItems:'center',justifyContent:'center',
            }}>✕</button>
          </div>

          {/* Products list */}
          <div style={{padding:'1.25rem 1.25rem 0'}}>
            <p style={{fontSize:'.7rem',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'#9A8A6A',margin:'0 0 .85rem'}}>
              Included in this look
            </p>
            {products.map(p => (
              <div key={p.id} style={{
                display:'flex',alignItems:'center',justifyContent:'space-between',
                padding:'.65rem 0',borderBottom:'1px solid #EDE5D4',
              }}>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{margin:0,fontWeight:600,fontSize:'.88rem',color:'var(--text)'}}>{p.name}</p>
                  <p style={{margin:'.1rem 0 0',fontSize:'.74rem',color:'var(--muted)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                    {p.description?.slice(0,60)}{p.description?.length > 60 ? '…' : ''}
                  </p>
                </div>
                <div style={{marginLeft:'1rem',textAlign:'right',flexShrink:0}}>
                  <p style={{margin:0,fontWeight:700,fontSize:'.9rem',color:'#B68D40'}}>from ₹{(p.price||499).toLocaleString('en-IN')}</p>
                  {p.stockStatus === 'out-of-stock' && (
                    <p style={{margin:'.1rem 0 0',fontSize:'.66rem',color:'#C04040'}}>Out of stock</p>
                  )}
                </div>
              </div>
            ))}

            {/* Total */}
            <div style={{
              display:'flex',justifyContent:'space-between',alignItems:'center',
              padding:'.9rem 0',borderTop:'2px solid #1A1208',marginTop:'.25rem',
            }}>
              <span style={{fontWeight:700,fontSize:'.9rem'}}>Starting total</span>
              <span style={{fontWeight:700,fontSize:'1.05rem',color:'#B68D40'}}>from ₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* CTAs */}
          <div style={{padding:'0 1.25rem 1.5rem',display:'flex',flexDirection:'column',gap:'.75rem'}}>
            {added ? (
              <div style={{
                display:'flex',alignItems:'center',justifyContent:'space-between',
                background:'#E8F5E8',borderRadius:'var(--pill)',padding:'.8rem 1.1rem',
              }}>
                <span style={{color:'#2A6A2A',fontWeight:600,fontSize:'.88rem'}}>✓ Added to cart!</span>
                <Link to="/cart" onClick={onClose} style={{color:'#2A6A2A',fontWeight:700,fontSize:'.82rem',textDecoration:'underline'}}>View Cart →</Link>
              </div>
            ) : (
              <button onClick={handleAddAll} className="btn btn-gold" style={{width:'100%',padding:'.85rem',fontSize:'.88rem',letterSpacing:'.06em'}}>
                ADD ALL TO CART — from ₹{total.toLocaleString('en-IN')}
              </button>
            )}

            <div style={{display:'flex',gap:'.6rem'}}>
              {products.map(p => (
                <Link key={p.id} to={`/product/${p.id}`} onClick={onClose}
                  style={{flex:1,textAlign:'center',padding:'.6rem .4rem',border:'1px solid #DDD5C8',borderRadius:8,fontSize:'.72rem',fontWeight:600,color:'#5A4A3A',textDecoration:'none',background:'#fff'}}>
                  View {p.name.split(' ').slice(0,2).join(' ')}
                </Link>
              ))}
            </div>

            {look.personalized && (
              <Link to="/customize" onClick={onClose} style={{
                display:'block',textAlign:'center',padding:'.75rem',
                background:'#1A1208',color:'#D4A85A',borderRadius:'var(--pill)',
                fontWeight:700,fontSize:'.82rem',letterSpacing:'.08em',textDecoration:'none',
                textTransform:'uppercase',
              }}>
                ✦ Create Your Personalized Version
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   INSPIRATION CARD
   ───────────────────────────────────────────────────────────────────────────── */
function InspirationCard({ look }) {
  const [showModal, setShowModal] = useState(false);
  const cardRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.05 });
    if (cardRef.current) obs.observe(cardRef.current);
    return () => obs.disconnect();
  }, []);

  const products = look.products.map(id => PRODUCTS[id]).filter(Boolean);
  const svgScene = SCENE_SVGS[look.room];
  const roomLabel = ROOM_CATS.find(c => c.id === look.room)?.label || '';

  return (
    <>
      <div ref={cardRef} style={{
        background:'#fff',borderRadius:'1.25rem',overflow:'hidden',
        boxShadow:'0 2px 16px rgba(26,18,8,0.08)',
        display:'flex',flexDirection:'column',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition:'opacity .45s ease, transform .45s ease',
      }}>
        {/* Room scene */}
        <div style={{position:'relative',lineHeight:0,overflow:'hidden',background:'#E8DEC8'}}>
          <div style={{filter: look.filter}} dangerouslySetInnerHTML={{__html: svgScene}} />
          {/* Gradient overlay with labels */}
          <div style={{
            position:'absolute',inset:0,
            background:'linear-gradient(to top, rgba(26,18,8,0.72) 0%, rgba(26,18,8,0.08) 50%, transparent 100%)',
            display:'flex',flexDirection:'column',justifyContent:'flex-end',
            padding:'1rem',pointerEvents:'none',
          }}>
            <p style={{margin:0,fontSize:'.62rem',fontWeight:700,letterSpacing:'.13em',color:'#D4A85A',textTransform:'uppercase'}}>
              {roomLabel}
            </p>
            <h3 style={{margin:'.2rem 0 0',fontFamily:'var(--fd)',fontSize:'1.1rem',color:'#FAF7F0',lineHeight:1.25}}>{look.name}</h3>
          </div>
          {/* Personalized badge */}
          {look.personalized && (
            <div style={{
              position:'absolute',top:'.6rem',left:'.6rem',
              background:'#1A1208',color:'#D4A85A',fontSize:'.6rem',
              fontWeight:700,letterSpacing:'.1em',padding:'.25rem .6rem',
              borderRadius:'var(--pill)',textTransform:'uppercase',
            }}>✦ Personalized</div>
          )}
        </div>

        {/* Body */}
        <div style={{padding:'1rem 1rem .75rem',flex:1,display:'flex',flexDirection:'column'}}>
          <p style={{margin:'0 0 .75rem',fontSize:'.82rem',color:'var(--muted)',lineHeight:1.6}}>{look.tagline}</p>

          {/* Products */}
          <div style={{marginBottom:'.85rem'}}>
            {products.map(p => (
              <div key={p.id} style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:'.3rem'}}>
                <span style={{fontSize:'.76rem',color:'#5A4A3A',fontWeight:500}}>· {p.name}</span>
                <span style={{fontSize:'.72rem',color:'#B68D40',fontWeight:600,marginLeft:'.5rem',flexShrink:0}}>from ₹{(p.price||499).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={{display:'flex',flexDirection:'column',gap:'.5rem',marginTop:'auto'}}>
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-gold"
              style={{width:'100%',padding:'.65rem',fontSize:'.8rem',letterSpacing:'.06em'}}
            >
              SHOP THIS LOOK
            </button>
            {look.personalized && (
              <Link to="/customize" style={{
                display:'block',textAlign:'center',padding:'.6rem',fontSize:'.76rem',
                fontWeight:600,color:'#5A4A3A',border:'1px solid #DDD5C8',
                borderRadius:'var(--pill)',textDecoration:'none',background:'#FAF7F0',
              }}>
                CREATE YOUR VERSION →
              </Link>
            )}
          </div>
        </div>
      </div>

      {showModal && <LookDetailModal look={look} onClose={() => setShowModal(false)} />}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────────────────────────────────────── */
export default function RoomInspiration() {
  const [activeRoom, setActiveRoom]   = useState('all');
  const [activeStyle, setActiveStyle] = useState('all');

  const filtered = LOOKS.filter(l => {
    const roomOk  = activeRoom  === 'all' || l.room === activeRoom;
    const styleOk = activeStyle === 'all' || l.style.includes(activeStyle);
    return roomOk && styleOk;
  });

  // Scroll to looks grid
  const looksRef = useRef(null);
  function scrollToLooks() {
    looksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const pillBase = {
    border:'none',cursor:'pointer',fontFamily:'inherit',fontWeight:600,
    fontSize:'.78rem',letterSpacing:'.05em',borderRadius:'var(--pill)',
    padding:'.48rem 1rem',whiteSpace:'nowrap',transition:'all .2s',flexShrink:0,
  };
  const pillActive   = { ...pillBase, background:'#B68D40', color:'#fff' };
  const pillInactive = { ...pillBase, background:'transparent', color:'#5A4A3A', border:'1.5px solid #DDD5C8' };

  return (
    <div data-page="room-inspiration" style={{background:'var(--bg)'}}>
      <SEO
        title="Room Inspiration | JHAYRA Premium Wall Art"
        description="Explore curated room inspiration — living rooms, bedrooms, mandirs and more — styled with JHAYRA premium frames. Shop the look or create your own personalized wall art."
        path="/room-inspiration"
      />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{position:'relative',overflow:'hidden',background:'#1A1208',lineHeight:0}}>
        {/* Hero SVG */}
        <div style={{lineHeight:0}} dangerouslySetInnerHTML={{__html:HERO_SVG}} />

        {/* Editorial overlay */}
        <div style={{
          position:'absolute',inset:0,
          background:'linear-gradient(135deg, rgba(26,18,8,0.52) 0%, rgba(26,18,8,0.18) 55%, transparent 100%)',
          display:'flex',alignItems:'center',
          padding:'2.5rem max(1.25rem, 5vw)',
          pointerEvents:'none',
        }}>
          <div style={{maxWidth:'480px'}}>
            <p style={{
              margin:'0 0 .6rem',fontSize:'.68rem',fontWeight:700,
              letterSpacing:'.18em',color:'#D4A85A',textTransform:'uppercase',
            }}>Room Inspiration</p>
            <h1 style={{
              margin:'0 0 .9rem',fontFamily:'var(--fd)',
              fontSize:'clamp(1.9rem, 5vw, 3rem)',
              color:'#FAF7F0',lineHeight:1.1,letterSpacing:'-.01em',
            }}>
              See JHAYRA{' '}<br/>in your space.
            </h1>
            <p style={{
              margin:'0 0 1.5rem',fontSize:'clamp(.82rem, 2vw, .95rem)',
              color:'rgba(255,255,255,0.82)',lineHeight:1.65,maxWidth:'340px',
            }}>
              Explore curated room looks, discover beautiful frame combinations and find inspiration for every corner of your home.
            </p>
            <div style={{display:'flex',gap:'.75rem',flexWrap:'wrap',pointerEvents:'all'}}>
              <button onClick={scrollToLooks} className="btn btn-gold" style={{fontSize:'.82rem',padding:'.65rem 1.4rem',letterSpacing:'.06em'}}>
                Explore Looks
              </button>
              <Link to="/customize" className="btn btn-outline" style={{fontSize:'.82rem',padding:'.65rem 1.4rem',letterSpacing:'.06em',color:'#FAF7F0',borderColor:'rgba(255,255,255,0.5)'}}>
                Create Yours
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── ROOM CATEGORY PILLS ───────────────────────────────────────────── */}
      <div ref={looksRef} style={{
        background:'#FAF7F0',
        borderBottom:'1px solid #EDE5D4',
        position:'sticky',top:'calc(var(--nav) + var(--bar))',zIndex:100,
      }}>
        <div style={{
          overflowX:'auto',
          WebkitOverflowScrolling:'touch',
          scrollbarWidth:'none',
          padding:'.85rem max(1rem, 3vw)',
          display:'flex',gap:'.5rem',
        }}>
          {ROOM_CATS.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveRoom(c.id)}
              style={activeRoom === c.id ? pillActive : pillInactive}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── FIND YOUR STYLE ───────────────────────────────────────────────── */}
      <div style={{
        background:'#fff',
        borderBottom:'1px solid #EDE5D4',
        padding:'.6rem max(1rem, 3vw)',
        overflowX:'auto',WebkitOverflowScrolling:'touch',scrollbarWidth:'none',
        display:'flex',gap:'.45rem',alignItems:'center',
      }}>
        <span style={{fontSize:'.7rem',fontWeight:700,letterSpacing:'.1em',color:'#9A8A6A',textTransform:'uppercase',whiteSpace:'nowrap',flexShrink:0,marginRight:'.3rem'}}>Style</span>
        {STYLE_OPTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveStyle(s.id)}
            style={activeStyle === s.id
              ? {...pillBase,padding:'.35rem .85rem',background:'#1A1208',color:'#D4A85A',fontSize:'.72rem'}
              : {...pillBase,padding:'.35rem .85rem',background:'transparent',color:'#6A5A4A',border:'1px solid #DDD5C8',fontSize:'.72rem'}}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── LOOKS GRID ────────────────────────────────────────────────────── */}
      <div style={{maxWidth:'1200px',margin:'0 auto',padding:'2rem max(1rem, 3vw)'}}>
        {/* Results count */}
        <div style={{marginBottom:'1.5rem',display:'flex',alignItems:'baseline',gap:'.75rem'}}>
          <p style={{margin:0,fontSize:'.82rem',color:'#9A8A6A'}}>
            <strong style={{color:'#1A1208'}}>{filtered.length}</strong> {filtered.length === 1 ? 'look' : 'looks'}
            {activeRoom !== 'all' && ` · ${ROOM_CATS.find(c=>c.id===activeRoom)?.label}`}
            {activeStyle !== 'all' && ` · ${STYLE_OPTIONS.find(s=>s.id===activeStyle)?.label}`}
          </p>
          {(activeRoom !== 'all' || activeStyle !== 'all') && (
            <button
              onClick={() => { setActiveRoom('all'); setActiveStyle('all'); }}
              style={{background:'none',border:'none',color:'#B68D40',cursor:'pointer',fontSize:'.78rem',fontWeight:600,padding:0,fontFamily:'inherit'}}
            >
              Clear filters
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div style={{textAlign:'center',padding:'4rem 1rem',color:'var(--muted)'}}>
            <p style={{fontSize:'1.1rem',fontWeight:600,color:'var(--text)'}}>No looks found</p>
            <p style={{fontSize:'.88rem'}}>Try a different room category or style.</p>
            <button onClick={()=>{setActiveRoom('all');setActiveStyle('all');}} className="btn btn-gold" style={{marginTop:'1rem'}}>Show all looks</button>
          </div>
        ) : (
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
            gap:'1.5rem',
          }}>
            {filtered.map(look => <InspirationCard key={look.id} look={look} />)}
          </div>
        )}
      </div>

      {/* ── CREATE YOUR WALL ──────────────────────────────────────────────── */}
      <section style={{
        background:'#1A1208',
        padding:'4rem max(1.25rem, 5vw)',
        textAlign:'center',
        margin:'2rem 0 0',
      }}>
        <p style={{margin:'0 0 .5rem',fontSize:'.7rem',fontWeight:700,letterSpacing:'.18em',color:'#8B7040',textTransform:'uppercase'}}>
          Make it personal
        </p>
        <h2 style={{
          margin:'0 0 1rem',fontFamily:'var(--fd)',
          fontSize:'clamp(2rem, 5.5vw, 3.2rem)',
          color:'#FAF7F0',lineHeight:1.1,letterSpacing:'-.015em',
        }}>
          Your Wall.<br/>
          <span style={{
            background:'linear-gradient(90deg,#B68D40,#E8C870,#B68D40)',
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',
          }}>Your Memories.</span>
        </h2>
        <p style={{
          margin:'0 auto 2rem',maxWidth:'400px',fontSize:'clamp(.85rem, 2.2vw, 1rem)',
          color:'rgba(255,255,255,0.65)',lineHeight:1.7,
        }}>
          Create a wall that feels deeply personal to you. Upload your photos, choose your frames, and we'll craft it by hand.
        </p>
        <div style={{display:'flex',gap:'1rem',justifyContent:'center',flexWrap:'wrap'}}>
          <Link to="/customize" className="btn btn-gold" style={{fontSize:'.88rem',padding:'.8rem 2rem',letterSpacing:'.07em'}}>
            CREATE YOUR WALL
          </Link>
          <a
            href="https://wa.me/917070728989?text=Hi%20JHAYRA!%20I'd%20like%20your%20team%20to%20design%20a%20custom%20wall%20for%20me."
            target="_blank" rel="noopener noreferrer"
            style={{
              display:'inline-flex',alignItems:'center',gap:'.5rem',
              padding:'.8rem 1.6rem',borderRadius:'var(--pill)',
              border:'1.5px solid rgba(255,255,255,0.25)',color:'rgba(255,255,255,0.82)',
              textDecoration:'none',fontSize:'.88rem',fontWeight:600,fontFamily:'inherit',
              letterSpacing:'.04em',transition:'border-color .2s',
            }}
          >
            Chat with a Designer
          </a>
        </div>
      </section>
    </div>
  );
}
