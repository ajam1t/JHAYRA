import { useState } from 'react';
import { useScrollReveal } from '../components/ScrollReveal';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

/* ── SVG Room Scenes ── */
const LIVING_SVG = `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
  <defs>
    <linearGradient id="lv-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#EDE0C8"/><stop offset="100%" stop-color="#D6C8B0"/></linearGradient>
    <linearGradient id="lv-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#C4A882"/><stop offset="100%" stop-color="#A8875A"/></linearGradient>
    <linearGradient id="lv-sofa" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7A5C3A"/><stop offset="100%" stop-color="#5C4028"/></linearGradient>
    <linearGradient id="lv-art1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2D4A6B"/><stop offset="60%" stop-color="#1A2F47"/><stop offset="100%" stop-color="#B68D40"/></linearGradient>
    <linearGradient id="lv-art2" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="#5C3A1E"/><stop offset="50%" stop-color="#B68D40"/><stop offset="100%" stop-color="#E8D5A0"/></linearGradient>
    <linearGradient id="lv-art3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1A3A2A"/><stop offset="100%" stop-color="#2E6B4A"/></linearGradient>
  </defs>
  <!-- Wall -->
  <rect width="800" height="360" fill="url(#lv-wall)"/>
  <!-- Wainscoting -->
  <rect x="0" y="290" width="800" height="8" fill="#C4B090" opacity=".6"/>
  <rect x="40" y="40" width="720" height="240" rx="2" fill="none" stroke="#C4B090" stroke-width="1.5" opacity=".4"/>
  <!-- Floor -->
  <rect y="360" width="800" height="120" fill="url(#lv-floor)"/>
  <!-- Floor lines -->
  <line x1="0" y1="380" x2="800" y2="380" stroke="#B09060" stroke-width=".8" opacity=".5"/>
  <line x1="0" y1="400" x2="800" y2="400" stroke="#B09060" stroke-width=".8" opacity=".5"/>
  <line x1="0" y1="420" x2="800" y2="420" stroke="#B09060" stroke-width=".8" opacity=".5"/>
  <!-- Rug -->
  <ellipse cx="400" cy="385" rx="240" ry="28" fill="#8B6A40" opacity=".35"/>
  <!-- Sofa base -->
  <rect x="160" y="330" width="480" height="35" rx="6" fill="url(#lv-sofa)"/>
  <!-- Sofa seat -->
  <rect x="155" y="305" width="490" height="35" rx="8" fill="#8B6844"/>
  <!-- Sofa back -->
  <rect x="160" y="258" width="480" height="55" rx="8" fill="url(#lv-sofa)"/>
  <!-- Sofa cushions -->
  <rect x="175" y="268" width="140" height="40" rx="5" fill="#A07848" opacity=".9"/>
  <rect x="330" y="268" width="140" height="40" rx="5" fill="#A07848" opacity=".9"/>
  <rect x="485" y="268" width="140" height="40" rx="5" fill="#A07848" opacity=".9"/>
  <!-- Sofa arms -->
  <rect x="148" y="275" width="22" height="65" rx="5" fill="#6A4C2E"/>
  <rect x="630" y="275" width="22" height="65" rx="5" fill="#6A4C2E"/>
  <!-- Side table left -->
  <rect x="80" y="318" width="65" height="52" rx="4" fill="#8B6A40" opacity=".7"/>
  <ellipse cx="112" cy="320" rx="36" ry="6" fill="#A07848" opacity=".8"/>
  <!-- Lamp on table -->
  <rect x="108" y="278" width="8" height="42" fill="#6A4C2E" opacity=".7"/>
  <ellipse cx="112" cy="278" rx="24" ry="7" fill="#E8D5A0" opacity=".9"/>
  <!-- Side table right -->
  <rect x="655" y="318" width="65" height="52" rx="4" fill="#8B6A40" opacity=".7"/>
  <ellipse cx="687" cy="320" rx="36" ry="6" fill="#A07848" opacity=".8"/>
  <!-- Plant on right table -->
  <rect x="683" y="290" width="8" height="30" fill="#5A7A3A" opacity=".8"/>
  <ellipse cx="687" cy="285" rx="18" ry="14" fill="#4A6A2A" opacity=".8"/>
  <!-- JHAYRA Frame 1 (large center) -->
  <rect x="295" y="60" width="210" height="155" rx="3" fill="#2A2010"/>
  <rect x="300" y="65" width="200" height="145" fill="url(#lv-art1)"/>
  <!-- art detail lines -->
  <line x1="360" y1="80" x2="360" y2="195" stroke="#B68D40" stroke-width=".8" opacity=".4"/>
  <line x1="300" y1="125" x2="500" y2="125" stroke="#B68D40" stroke-width=".8" opacity=".4"/>
  <circle cx="400" cy="138" r="28" fill="none" stroke="#B68D40" stroke-width="1.2" opacity=".6"/>
  <circle cx="400" cy="138" r="18" fill="#B68D40" opacity=".2"/>
  <text x="400" y="212" text-anchor="middle" font-family="serif" font-size="9" fill="#B68D40" opacity=".7">JHAYRA</text>
  <!-- Frame 1 hanger wire -->
  <line x1="358" y1="60" x2="400" y2="50" stroke="#888" stroke-width=".8" opacity=".5"/>
  <line x1="442" y1="60" x2="400" y2="50" stroke="#888" stroke-width=".8" opacity=".5"/>
  <!-- JHAYRA Frame 2 (left) -->
  <rect x="108" y="78" width="145" height="105" rx="3" fill="#2A2010"/>
  <rect x="113" y="83" width="135" height="95" fill="url(#lv-art2)"/>
  <line x1="113" y1="130" x2="248" y2="130" stroke="#fff" stroke-width=".6" opacity=".2"/>
  <path d="M 150 100 Q 180 85 210 100 Q 180 115 150 100Z" fill="#B68D40" opacity=".5"/>
  <text x="180" y="175" text-anchor="middle" font-family="serif" font-size="7" fill="#B68D40" opacity=".7">JHAYRA</text>
  <!-- Frame 2 hanger -->
  <line x1="158" y1="78" x2="180" y2="68" stroke="#888" stroke-width=".8" opacity=".5"/>
  <line x1="202" y1="78" x2="180" y2="68" stroke="#888" stroke-width=".8" opacity=".5"/>
  <!-- JHAYRA Frame 3 (right) -->
  <rect x="547" y="78" width="145" height="105" rx="3" fill="#2A2010"/>
  <rect x="552" y="83" width="135" height="95" fill="url(#lv-art3)"/>
  <path d="M 590 110 L 620 95 L 650 110 L 650 160 L 590 160Z" fill="#B68D40" opacity=".3"/>
  <path d="M 600 120 Q 620 105 640 120" fill="none" stroke="#fff" stroke-width=".8" opacity=".3"/>
  <text x="620" y="175" text-anchor="middle" font-family="serif" font-size="7" fill="#B68D40" opacity=".7">JHAYRA</text>
  <!-- Frame 3 hanger -->
  <line x1="597" y1="78" x2="620" y2="68" stroke="#888" stroke-width=".8" opacity=".5"/>
  <line x1="643" y1="78" x2="620" y2="68" stroke="#888" stroke-width=".8" opacity=".5"/>
  <!-- Coffee table -->
  <rect x="260" y="368" width="280" height="14" rx="3" fill="#6A4C2E" opacity=".8"/>
  <rect x="280" y="380" width="16" height="20" rx="2" fill="#5A3C22" opacity=".7"/>
  <rect x="504" y="380" width="16" height="20" rx="2" fill="#5A3C22" opacity=".7"/>
  <!-- JHAYRA label overlay -->
  <rect x="0" y="440" width="800" height="40" fill="rgba(0,0,0,0.32)"/>
  <text x="400" y="466" text-anchor="middle" font-family="serif" font-size="14" fill="#D4A85A" letter-spacing="3">LIVING ROOM — JHAYRA WALL ART</text>
</svg>`;

const BEDROOM_SVG = `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
  <defs>
    <linearGradient id="bd-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E8DDD0"/><stop offset="100%" stop-color="#D4C8B8"/></linearGradient>
    <linearGradient id="bd-bed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8B7260"/><stop offset="100%" stop-color="#6A5444"/></linearGradient>
    <linearGradient id="bd-art1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#3A1A2E"/><stop offset="50%" stop-color="#6B2D5A"/><stop offset="100%" stop-color="#B68D40"/></linearGradient>
    <linearGradient id="bd-art2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1A2A3A"/><stop offset="100%" stop-color="#B68D40"/></linearGradient>
  </defs>
  <!-- Wall -->
  <rect width="800" height="360" fill="url(#bd-wall)"/>
  <!-- Accent wall panel -->
  <rect x="220" y="30" width="360" height="290" rx="4" fill="#DDD0C0" opacity=".5"/>
  <rect x="230" y="40" width="340" height="270" rx="3" fill="none" stroke="#C4B8A4" stroke-width="1.5"/>
  <!-- Floor -->
  <rect y="360" width="800" height="120" fill="#B09070"/>
  <line x1="0" y1="378" x2="800" y2="378" stroke="#A08060" stroke-width=".8" opacity=".5"/>
  <line x1="0" y1="396" x2="800" y2="396" stroke="#A08060" stroke-width=".8" opacity=".5"/>
  <!-- Bedside tables -->
  <rect x="60" y="295" width="80" height="75" rx="4" fill="#8B7260" opacity=".7"/>
  <rect x="660" y="295" width="80" height="75" rx="4" fill="#8B7260" opacity=".7"/>
  <!-- Lamp left -->
  <rect x="95" y="258" width="10" height="37" fill="#6A5444" opacity=".8"/>
  <ellipse cx="100" cy="258" rx="28" ry="8" fill="#E8D090" opacity=".9"/>
  <!-- Lamp right -->
  <rect x="695" y="258" width="10" height="37" fill="#6A5444" opacity=".8"/>
  <ellipse cx="700" cy="258" rx="28" ry="8" fill="#E8D090" opacity=".9"/>
  <!-- Bed frame -->
  <rect x="150" y="290" width="500" height="80" rx="5" fill="url(#bd-bed)"/>
  <!-- Headboard -->
  <rect x="148" y="215" width="504" height="80" rx="10" fill="#7A6250"/>
  <rect x="160" y="225" width="480" height="62" rx="8" fill="#8B7260" opacity=".6"/>
  <!-- Pillow left -->
  <rect x="170" y="282" width="150" height="30" rx="8" fill="#F0E8DC" opacity=".95"/>
  <rect x="175" y="286" width="140" height="22" rx="6" fill="#E8DED0" opacity=".5"/>
  <!-- Pillow right -->
  <rect x="480" y="282" width="150" height="30" rx="8" fill="#F0E8DC" opacity=".95"/>
  <rect x="485" y="286" width="140" height="22" rx="6" fill="#E8DED0" opacity=".5"/>
  <!-- Blanket -->
  <rect x="148" y="305" width="504" height="65" rx="5" fill="#C4A88A" opacity=".8"/>
  <line x1="148" y1="318" x2="652" y2="318" stroke="#D4B89A" stroke-width="1" opacity=".6"/>
  <!-- JHAYRA Frame (center above headboard) -->
  <rect x="312" y="60" width="176" height="128" rx="3" fill="#2A1E10"/>
  <rect x="317" y="65" width="166" height="118" fill="url(#bd-art1)"/>
  <circle cx="400" cy="124" r="30" fill="none" stroke="#B68D40" stroke-width="1" opacity=".5"/>
  <path d="M380 110 Q400 95 420 110 Q400 125 380 110Z" fill="#B68D40" opacity=".5"/>
  <path d="M370 124 Q400 106 430 124" fill="none" stroke="#E8D090" stroke-width=".8" opacity=".4"/>
  <text x="400" y="185" text-anchor="middle" font-family="serif" font-size="8" fill="#B68D40" opacity=".7">JHAYRA</text>
  <!-- Frame hanger -->
  <line x1="368" y1="60" x2="400" y2="52" stroke="#888" stroke-width=".7" opacity=".4"/>
  <line x1="432" y1="60" x2="400" y2="52" stroke="#888" stroke-width=".7" opacity=".4"/>
  <!-- Small frame left -->
  <rect x="134" y="85" width="72" height="52" rx="3" fill="#2A1E10"/>
  <rect x="138" y="89" width="64" height="44" fill="url(#bd-art2)"/>
  <path d="M155 100 L170 110 L185 100 L185 128 L155 128Z" fill="#B68D40" opacity=".35"/>
  <text x="170" y="134" text-anchor="middle" font-family="serif" font-size="6" fill="#B68D40" opacity=".7">JHAYRA</text>
  <!-- Small frame right -->
  <rect x="594" y="85" width="72" height="52" rx="3" fill="#2A1E10"/>
  <rect x="598" y="89" width="64" height="44" fill="url(#bd-art2)"/>
  <path d="M615 100 L630 110 L645 100 L645 128 L615 128Z" fill="#D4A85A" opacity=".35"/>
  <text x="630" y="134" text-anchor="middle" font-family="serif" font-size="6" fill="#B68D40" opacity=".7">JHAYRA</text>
  <!-- Label -->
  <rect x="0" y="440" width="800" height="40" fill="rgba(0,0,0,0.32)"/>
  <text x="400" y="466" text-anchor="middle" font-family="serif" font-size="14" fill="#D4A85A" letter-spacing="3">BEDROOM — JHAYRA WALL ART</text>
</svg>`;

const DINING_SVG = `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
  <defs>
    <linearGradient id="dn-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#F0E8D8"/><stop offset="100%" stop-color="#E0D0BC"/></linearGradient>
    <linearGradient id="dn-art" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0F2A1A"/><stop offset="40%" stop-color="#1E5C36"/><stop offset="100%" stop-color="#B68D40"/></linearGradient>
    <linearGradient id="dn-table" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6A4C2E"/><stop offset="100%" stop-color="#4A3018"/></linearGradient>
  </defs>
  <!-- Wall -->
  <rect width="800" height="360" fill="url(#dn-wall)"/>
  <!-- Chair rail -->
  <rect x="0" y="200" width="800" height="6" fill="#C8B89A" opacity=".6"/>
  <rect x="0" y="200" width="800" height="160" fill="#E4D8C4" opacity=".3"/>
  <!-- Floor -->
  <rect y="360" width="800" height="120" fill="#8B6A40"/>
  <line x1="0" y1="375" x2="800" y2="375" stroke="#7A5A30" stroke-width=".8" opacity=".5"/>
  <line x1="0" y1="390" x2="800" y2="390" stroke="#7A5A30" stroke-width=".8" opacity=".5"/>
  <!-- Dining table -->
  <ellipse cx="400" cy="370" rx="230" ry="24" fill="url(#dn-table)"/>
  <rect x="170" y="342" width="460" height="30" rx="4" fill="#7A5C3A"/>
  <!-- Table legs -->
  <rect x="220" y="370" width="14" height="30" rx="2" fill="#5A3C1E"/>
  <rect x="566" y="370" width="14" height="30" rx="2" fill="#5A3C1E"/>
  <!-- Chairs silhouettes -->
  <rect x="80" y="318" width="68" height="52" rx="6" fill="#5A4030" opacity=".7"/>
  <rect x="72" y="296" width="84" height="26" rx="8" fill="#6A5040" opacity=".7"/>
  <rect x="652" y="318" width="68" height="52" rx="6" fill="#5A4030" opacity=".7"/>
  <rect x="644" y="296" width="84" height="26" rx="8" fill="#6A5040" opacity=".7"/>
  <rect x="270" y="300" width="56" height="42" rx="5" fill="#4A3020" opacity=".6"/>
  <rect x="474" y="300" width="56" height="42" rx="5" fill="#4A3020" opacity=".6"/>
  <!-- Place settings -->
  <ellipse cx="280" cy="356" rx="22" ry="7" fill="#F0E8DC" opacity=".6"/>
  <ellipse cx="400" cy="348" rx="30" ry="8" fill="#F0E8DC" opacity=".6"/>
  <ellipse cx="520" cy="356" rx="22" ry="7" fill="#F0E8DC" opacity=".6"/>
  <!-- Centerpiece candle -->
  <rect x="392" y="324" width="16" height="24" rx="2" fill="#F5ECD8" opacity=".9"/>
  <ellipse cx="400" cy="323" rx="8" ry="3" fill="#FFD080" opacity=".8"/>
  <!-- Pendant light -->
  <line x1="400" y1="0" x2="400" y2="55" stroke="#888" stroke-width="1.5" opacity=".5"/>
  <ellipse cx="400" cy="62" rx="40" ry="12" fill="#3A2810" opacity=".9"/>
  <ellipse cx="400" cy="62" rx="32" ry="9" fill="#B68D40" opacity=".4"/>
  <!-- Large JHAYRA Frame -->
  <rect x="282" y="40" width="236" height="140" rx="3" fill="#1E1408"/>
  <rect x="287" y="45" width="226" height="130" fill="url(#dn-art)"/>
  <circle cx="400" cy="110" r="35" fill="none" stroke="#B68D40" stroke-width="1.2" opacity=".5"/>
  <path d="M375 95 Q400 78 425 95 Q400 112 375 95Z" fill="#B68D40" opacity=".45"/>
  <path d="M365 110 Q400 90 435 110" fill="none" stroke="#E8D090" stroke-width=".8" opacity=".4"/>
  <path d="M370 125 Q400 110 430 125" fill="none" stroke="#E8D090" stroke-width=".5" opacity=".3"/>
  <text x="400" y="177" text-anchor="middle" font-family="serif" font-size="9" fill="#B68D40" opacity=".7">JHAYRA</text>
  <!-- Hanger -->
  <line x1="358" y1="40" x2="400" y2="30" stroke="#888" stroke-width=".8" opacity=".4"/>
  <line x1="442" y1="40" x2="400" y2="30" stroke="#888" stroke-width=".8" opacity=".4"/>
  <!-- Small frames on sides -->
  <rect x="100" y="55" width="100" height="72" rx="3" fill="#1E1408"/>
  <rect x="105" y="60" width="90" height="62" fill="#2A4A1A"/>
  <path d="M125 90 Q150 75 175 90 Q150 105 125 90Z" fill="#B68D40" opacity=".4"/>
  <text x="150" y="124" text-anchor="middle" font-family="serif" font-size="6.5" fill="#B68D40" opacity=".7">JHAYRA</text>
  <rect x="600" y="55" width="100" height="72" rx="3" fill="#1E1408"/>
  <rect x="605" y="60" width="90" height="62" fill="#1A3A4A"/>
  <path d="M625 90 Q650 75 675 90 Q650 105 625 90Z" fill="#B68D40" opacity=".4"/>
  <text x="650" y="124" text-anchor="middle" font-family="serif" font-size="6.5" fill="#B68D40" opacity=".7">JHAYRA</text>
  <!-- Label -->
  <rect x="0" y="440" width="800" height="40" fill="rgba(0,0,0,0.32)"/>
  <text x="400" y="466" text-anchor="middle" font-family="serif" font-size="14" fill="#D4A85A" letter-spacing="3">DINING ROOM — JHAYRA WALL ART</text>
</svg>`;

const OFFICE_SVG = `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
  <defs>
    <linearGradient id="of-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E8EDF2"/><stop offset="100%" stop-color="#D8E0E8"/></linearGradient>
    <linearGradient id="of-desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5A4A3A"/><stop offset="100%" stop-color="#3A2E22"/></linearGradient>
    <linearGradient id="of-art1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#0D1A2E"/><stop offset="100%" stop-color="#1A3050"/></linearGradient>
    <linearGradient id="of-art2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2A1A0A"/><stop offset="100%" stop-color="#B68D40"/></linearGradient>
  </defs>
  <!-- Wall -->
  <rect width="800" height="360" fill="url(#of-wall)"/>
  <!-- Wall panels -->
  <rect x="0" y="0" width="800" height="360" fill="none"/>
  <line x1="400" y1="0" x2="400" y2="360" stroke="#C8D4DE" stroke-width="1" opacity=".4"/>
  <!-- Floor -->
  <rect y="360" width="800" height="120" fill="#8E8078"/>
  <!-- Bookshelf left -->
  <rect x="30" y="80" width="120" height="240" rx="3" fill="#4A3A2A" opacity=".85"/>
  <rect x="36" y="86" width="108" height="10" rx="1" fill="#6A5A44"/>
  <rect x="36" y="180" width="108" height="8" rx="1" fill="#6A5A44"/>
  <rect x="36" y="270" width="108" height="8" rx="1" fill="#6A5A44"/>
  <!-- Books -->
  <rect x="40" y="97" width="12" height="80" rx="1" fill="#C04A2A" opacity=".8"/>
  <rect x="55" y="100" width="10" height="77" rx="1" fill="#2A5A8A" opacity=".8"/>
  <rect x="68" y="98" width="9" height="79" rx="1" fill="#3A7A3A" opacity=".8"/>
  <rect x="80" y="102" width="11" height="75" rx="1" fill="#B68D40" opacity=".8"/>
  <rect x="94" y="96" width="10" height="81" rx="1" fill="#6A2A6A" opacity=".8"/>
  <rect x="107" y="99" width="12" height="78" rx="1" fill="#8A6A3A" opacity=".8"/>
  <rect x="40" y="190" width="8" height="76" rx="1" fill="#3A6A5A" opacity=".8"/>
  <rect x="51" y="192" width="12" height="74" rx="1" fill="#8A3A2A" opacity=".8"/>
  <rect x="66" y="190" width="10" height="76" rx="1" fill="#5A5A8A" opacity=".8"/>
  <rect x="79" y="193" width="9" height="73" rx="1" fill="#B68D40" opacity=".8"/>
  <rect x="91" y="190" width="11" height="76" rx="1" fill="#2A4A6A" opacity=".8"/>
  <rect x="105" y="192" width="12" height="74" rx="1" fill="#6A4A2A" opacity=".8"/>
  <!-- Desk -->
  <rect x="160" y="308" width="560" height="16" rx="3" fill="url(#of-desk)"/>
  <rect x="185" y="323" width="16" height="50" rx="2" fill="#4A3A2A"/>
  <rect x="599" y="323" width="16" height="50" rx="2" fill="#4A3A2A"/>
  <!-- Monitor -->
  <rect x="330" y="250" width="200" height="130" rx="4" fill="#1A1A1E"/>
  <rect x="337" y="257" width="186" height="108" rx="2" fill="#2A3A4A"/>
  <rect x="415" y="380" width="30" height="12" rx="1" fill="#1A1A1E"/>
  <rect x="395" y="390" width="70" height="6" rx="2" fill="#111"/>
  <!-- Screen content -->
  <rect x="345" y="265" width="170" height="4" rx="1" fill="#B68D40" opacity=".6"/>
  <rect x="345" y="275" width="130" height="3" rx="1" fill="#8899AA" opacity=".5"/>
  <rect x="345" y="283" width="150" height="3" rx="1" fill="#8899AA" opacity=".4"/>
  <rect x="345" y="291" width="120" height="3" rx="1" fill="#8899AA" opacity=".4"/>
  <!-- Keyboard -->
  <rect x="340" y="300" width="175" height="8" rx="2" fill="#2A2A2E" opacity=".7"/>
  <!-- Desk lamp -->
  <rect x="237" y="260" width="8" height="48" rx="2" fill="#3A3A4A"/>
  <rect x="220" y="253" width="40" height="10" rx="4" fill="#E8D880" opacity=".85" transform="rotate(-20,241,258)"/>
  <!-- JHAYRA Frame 1 (motivational, large) -->
  <rect x="490" y="65" width="185" height="130" rx="3" fill="#1A1408"/>
  <rect x="495" y="70" width="175" height="120" fill="url(#of-art1)"/>
  <!-- Motivational art content -->
  <line x1="495" y1="130" x2="670" y2="130" stroke="#B68D40" stroke-width=".8" opacity=".3"/>
  <text x="582" y="108" text-anchor="middle" font-family="serif" font-size="16" fill="#B68D40" opacity=".8" font-style="italic">Dream</text>
  <text x="582" y="122" text-anchor="middle" font-family="serif" font-size="8" fill="#8899AA" opacity=".6">Create · Achieve</text>
  <text x="582" y="182" text-anchor="middle" font-family="serif" font-size="7" fill="#B68D40" opacity=".6">JHAYRA</text>
  <!-- Frame 1 hanger -->
  <line x1="548" y1="65" x2="582" y2="57" stroke="#888" stroke-width=".7" opacity=".4"/>
  <line x1="616" y1="65" x2="582" y2="57" stroke="#888" stroke-width=".7" opacity=".4"/>
  <!-- JHAYRA Frame 2 (small) -->
  <rect x="498" y="215" width="80" height="56" rx="3" fill="#1A1408"/>
  <rect x="502" y="219" width="72" height="48" fill="url(#of-art2)"/>
  <text x="538" y="264" text-anchor="middle" font-family="serif" font-size="5.5" fill="#B68D40" opacity=".7">JHAYRA</text>
  <!-- JHAYRA Frame 3 (small) -->
  <rect x="590" y="215" width="80" height="56" rx="3" fill="#1A1408"/>
  <rect x="594" y="219" width="72" height="48" fill="url(#of-art1)"/>
  <text x="634" y="264" text-anchor="middle" font-family="serif" font-size="5.5" fill="#B68D40" opacity=".7">JHAYRA</text>
  <!-- Label -->
  <rect x="0" y="440" width="800" height="40" fill="rgba(0,0,0,0.32)"/>
  <text x="400" y="466" text-anchor="middle" font-family="serif" font-size="14" fill="#D4A85A" letter-spacing="3">OFFICE — JHAYRA WALL ART</text>
</svg>`;

const MANDIR_SVG = `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
  <defs>
    <linearGradient id="md-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#F5EDD8"/><stop offset="100%" stop-color="#E8D8BE"/></linearGradient>
    <linearGradient id="md-arch" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#B68D40"/><stop offset="100%" stop-color="#8B6A2E"/></linearGradient>
    <linearGradient id="md-art1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2A0A0A"/><stop offset="50%" stop-color="#6B1A1A"/><stop offset="100%" stop-color="#B68D40"/></linearGradient>
    <linearGradient id="md-glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%"><stop offset="0%" stop-color="#FFD080" stop-opacity=".5"/><stop offset="100%" stop-color="#FFD080" stop-opacity="0"/></linearGradient>
    <radialGradient id="md-glow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#FFD080" stop-opacity=".4"/><stop offset="100%" stop-color="#FFD080" stop-opacity="0"/></radialGradient>
  </defs>
  <!-- Wall -->
  <rect width="800" height="360" fill="url(#md-wall)"/>
  <!-- Decorative border top -->
  <rect x="0" y="0" width="800" height="12" fill="#B68D40" opacity=".6"/>
  <rect x="0" y="10" width="800" height="4" fill="#D4A85A" opacity=".4"/>
  <!-- Ornate arch frame -->
  <path d="M290 340 L290 140 Q290 60 400 60 Q510 60 510 140 L510 340Z" fill="#F5EDD8" stroke="url(#md-arch)" stroke-width="8"/>
  <path d="M298 338 L298 143 Q298 72 400 72 Q502 72 502 143 L502 338Z" fill="none" stroke="#D4A85A" stroke-width="2" opacity=".5"/>
  <!-- Arch decorations -->
  <circle cx="400" cy="68" r="14" fill="#B68D40" opacity=".8"/>
  <circle cx="400" cy="68" r="9" fill="#D4A85A" opacity=".6"/>
  <!-- Mandir shelf/platform -->
  <rect x="280" y="330" width="240" height="14" rx="3" fill="#B68D40"/>
  <rect x="276" y="340" width="248" height="8" rx="2" fill="#8B6A2E"/>
  <!-- Deity area glow -->
  <ellipse cx="400" cy="230" rx="80" ry="90" fill="url(#md-glow)"/>
  <!-- Lamp / diya -->
  <ellipse cx="400" cy="318" rx="16" ry="6" fill="#B68D40" opacity=".8"/>
  <ellipse cx="400" cy="314" rx="10" ry="4" fill="#D4A85A" opacity=".6"/>
  <ellipse cx="400" cy="310" rx="5" ry="7" fill="#FFD080" opacity=".9"/>
  <!-- Incense sticks -->
  <line x1="360" y1="290" x2="364" y2="330" stroke="#5A3A1A" stroke-width="2" opacity=".7"/>
  <line x1="370" y1="288" x2="373" y2="330" stroke="#5A3A1A" stroke-width="2" opacity=".7"/>
  <!-- Flower petals / offering -->
  <circle cx="400" cy="334" r="5" fill="#FF6030" opacity=".7"/>
  <circle cx="388" cy="335" r="4" fill="#FF9040" opacity=".7"/>
  <circle cx="412" cy="335" r="4" fill="#FF9040" opacity=".7"/>
  <!-- JHAYRA Frame 1 (religious, inside arch, center) -->
  <rect x="343" y="125" width="114" height="150" rx="3" fill="#2A1808"/>
  <rect x="347" y="129" width="106" height="142" fill="url(#md-art1)"/>
  <!-- Om symbol -->
  <text x="400" y="208" text-anchor="middle" font-size="36" fill="#B68D40" opacity=".7" font-family="serif">ॐ</text>
  <text x="400" y="264" text-anchor="middle" font-family="serif" font-size="7" fill="#D4A85A" opacity=".7">JHAYRA</text>
  <!-- Gold border on center frame -->
  <rect x="343" y="125" width="114" height="150" rx="3" fill="none" stroke="#B68D40" stroke-width="1.5"/>
  <!-- Frame hanger wire -->
  <line x1="370" y1="125" x2="400" y2="116" stroke="#888" stroke-width=".7" opacity=".4"/>
  <line x1="430" y1="125" x2="400" y2="116" stroke="#888" stroke-width=".7" opacity=".4"/>
  <!-- JHAYRA Frame 2 (left of arch) -->
  <rect x="90" y="80" width="145" height="190" rx="3" fill="#2A1808"/>
  <rect x="95" y="85" width="135" height="180" fill="url(#md-art1)"/>
  <text x="163" y="178" text-anchor="middle" font-size="28" fill="#B68D40" opacity=".6" font-family="serif">ॐ</text>
  <path d="M115 115 Q163 100 210 115" fill="none" stroke="#D4A85A" stroke-width=".8" opacity=".4"/>
  <path d="M115 230 Q163 215 210 230" fill="none" stroke="#D4A85A" stroke-width=".8" opacity=".4"/>
  <text x="163" y="262" text-anchor="middle" font-family="serif" font-size="7" fill="#B68D40" opacity=".7">JHAYRA</text>
  <line x1="130" y1="80" x2="163" y2="72" stroke="#888" stroke-width=".7" opacity=".4"/>
  <line x1="196" y1="80" x2="163" y2="72" stroke="#888" stroke-width=".7" opacity=".4"/>
  <!-- JHAYRA Frame 3 (right of arch) -->
  <rect x="565" y="80" width="145" height="190" rx="3" fill="#2A1808"/>
  <rect x="570" y="85" width="135" height="180" fill="url(#md-art1)"/>
  <text x="637" y="178" text-anchor="middle" font-size="28" fill="#D4A85A" opacity=".6" font-family="serif">ॐ</text>
  <path d="M590 115 Q637 100 685 115" fill="none" stroke="#D4A85A" stroke-width=".8" opacity=".4"/>
  <path d="M590 230 Q637 215 685 230" fill="none" stroke="#D4A85A" stroke-width=".8" opacity=".4"/>
  <text x="637" y="262" text-anchor="middle" font-family="serif" font-size="7" fill="#B68D40" opacity=".7">JHAYRA</text>
  <line x1="604" y1="80" x2="637" y2="72" stroke="#888" stroke-width=".7" opacity=".4"/>
  <line x1="670" y1="80" x2="637" y2="72" stroke="#888" stroke-width=".7" opacity=".4"/>
  <!-- Floor -->
  <rect y="360" width="800" height="120" fill="#C4A870"/>
  <!-- Gold trim at floor -->
  <rect x="0" y="358" width="800" height="4" fill="#B68D40" opacity=".5"/>
  <!-- Label -->
  <rect x="0" y="440" width="800" height="40" fill="rgba(0,0,0,0.35)"/>
  <text x="400" y="466" text-anchor="middle" font-family="serif" font-size="14" fill="#D4A85A" letter-spacing="3">MANDIR / POOJA — JHAYRA WALL ART</text>
</svg>`;

const GALLERY_SVG = `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
  <defs>
    <linearGradient id="gw-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#F0EAE0"/><stop offset="100%" stop-color="#E4DCD0"/></linearGradient>
    <linearGradient id="gw-a1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1A0A2E"/><stop offset="100%" stop-color="#B68D40"/></linearGradient>
    <linearGradient id="gw-a2" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="#0A1E2E"/><stop offset="100%" stop-color="#2A6B8B"/></linearGradient>
    <linearGradient id="gw-a3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1E2E0A"/><stop offset="100%" stop-color="#4A7A2A"/></linearGradient>
    <linearGradient id="gw-a4" x1="1" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2E0A0A"/><stop offset="100%" stop-color="#8B2E1A"/></linearGradient>
    <linearGradient id="gw-a5" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2E1A0A"/><stop offset="100%" stop-color="#B68D40"/></linearGradient>
    <linearGradient id="gw-a6" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="#0A2E2E"/><stop offset="100%" stop-color="#1A6B6B"/></linearGradient>
  </defs>
  <!-- Wall -->
  <rect width="800" height="360" fill="url(#gw-wall)"/>
  <!-- Floor -->
  <rect y="360" width="800" height="120" fill="#A89070"/>
  <!-- Baseboard -->
  <rect x="0" y="342" width="800" height="18" fill="#D8CEC0"/>
  <rect x="0" y="356" width="800" height="4" fill="#C8C0B4"/>
  <!-- Floor line wood -->
  <line x1="0" y1="378" x2="800" y2="378" stroke="#988060" stroke-width=".8" opacity=".5"/>
  <!-- Picture rail at top -->
  <rect x="0" y="40" width="800" height="6" fill="#C8BEB0" opacity=".6"/>
  <!-- Gallery wire system -->
  <line x1="50" y1="43" x2="50" y2="340" stroke="#AAA" stroke-width=".6" opacity=".3"/>
  <line x1="200" y1="43" x2="200" y2="340" stroke="#AAA" stroke-width=".6" opacity=".3"/>
  <line x1="380" y1="43" x2="380" y2="340" stroke="#AAA" stroke-width=".6" opacity=".3"/>
  <line x1="530" y1="43" x2="530" y2="340" stroke="#AAA" stroke-width=".6" opacity=".3"/>
  <line x1="680" y1="43" x2="680" y2="340" stroke="#AAA" stroke-width=".6" opacity=".3"/>
  <line x1="750" y1="43" x2="750" y2="340" stroke="#AAA" stroke-width=".6" opacity=".3"/>
  <!-- Row 1: large frames -->
  <!-- Frame A (large, top-left) -->
  <rect x="44" y="55" width="155" height="118" rx="3" fill="#1E1408"/>
  <rect x="49" y="60" width="145" height="108" fill="url(#gw-a1)"/>
  <circle cx="122" cy="114" r="28" fill="none" stroke="#B68D40" stroke-width="1" opacity=".5"/>
  <path d="M104 104 Q122 90 140 104 Q122 118 104 104Z" fill="#B68D40" opacity=".4"/>
  <text x="122" y="165" text-anchor="middle" font-family="serif" font-size="7" fill="#B68D40" opacity=".6">JHAYRA</text>
  <!-- Frame B (large, top-center) -->
  <rect x="225" y="52" width="198" height="138" rx="3" fill="#1E1408"/>
  <rect x="230" y="57" width="188" height="128" fill="url(#gw-a2)"/>
  <path d="M280 85 L324 121 L368 85 L368 175 L280 175Z" fill="#B68D40" opacity=".2"/>
  <path d="M260 121 Q324 100 388 121" fill="none" stroke="#E8D090" stroke-width=".8" opacity=".4"/>
  <text x="324" y="183" text-anchor="middle" font-family="serif" font-size="7" fill="#B68D40" opacity=".6">JHAYRA</text>
  <!-- Frame C (portrait, top-right area) -->
  <rect x="450" y="55" width="108" height="148" rx="3" fill="#1E1408"/>
  <rect x="455" y="60" width="98" height="138" fill="url(#gw-a3)"/>
  <path d="M478 100 L504 85 L530 100 L530 185 L478 185Z" fill="#B68D40" opacity=".2"/>
  <text x="504" y="200" text-anchor="middle" font-family="serif" font-size="7" fill="#B68D40" opacity=".6">JHAYRA</text>
  <!-- Frame D (large, top-far-right) -->
  <rect x="580" y="55" width="178" height="118" rx="3" fill="#1E1408"/>
  <rect x="585" y="60" width="168" height="108" fill="url(#gw-a4)"/>
  <circle cx="669" cy="114" r="28" fill="none" stroke="#D4A85A" stroke-width="1" opacity=".5"/>
  <path d="M649 104 Q669 90 689 104 Q669 118 649 104Z" fill="#D4A85A" opacity=".4"/>
  <text x="669" y="165" text-anchor="middle" font-family="serif" font-size="7" fill="#B68D40" opacity=".6">JHAYRA</text>
  <!-- Row 2 small frames -->
  <!-- Frame E (small, bottom-left) -->
  <rect x="55" y="196" width="85" height="60" rx="3" fill="#1E1408"/>
  <rect x="59" y="200" width="77" height="52" fill="url(#gw-a5)"/>
  <text x="97" y="252" text-anchor="middle" font-family="serif" font-size="6" fill="#B68D40" opacity=".6">JHAYRA</text>
  <!-- Frame F (small, bottom-left 2) -->
  <rect x="154" y="196" width="60" height="85" rx="3" fill="#1E1408"/>
  <rect x="158" y="200" width="52" height="77" fill="url(#gw-a6)"/>
  <text x="184" y="278" text-anchor="middle" font-family="serif" font-size="6" fill="#B68D40" opacity=".6">JHAYRA</text>
  <!-- Frame G (medium, bottom-center) -->
  <rect x="236" y="212" width="150" height="100" rx="3" fill="#1E1408"/>
  <rect x="241" y="217" width="140" height="90" fill="url(#gw-a1)"/>
  <text x="311" y="308" text-anchor="middle" font-family="serif" font-size="6.5" fill="#B68D40" opacity=".6">JHAYRA</text>
  <!-- Frame H (small, bottom-right) -->
  <rect x="598" y="193" width="80" height="58" rx="3" fill="#1E1408"/>
  <rect x="602" y="197" width="72" height="50" fill="url(#gw-a3)"/>
  <text x="638" y="246" text-anchor="middle" font-family="serif" font-size="6" fill="#B68D40" opacity=".6">JHAYRA</text>
  <!-- Frame I (portrait, bottom-far-right) -->
  <rect x="692" y="192" width="70" height="100" rx="3" fill="#1E1408"/>
  <rect x="697" y="197" width="60" height="90" fill="url(#gw-a4)"/>
  <text x="727" y="285" text-anchor="middle" font-family="serif" font-size="6" fill="#B68D40" opacity=".6">JHAYRA</text>
  <!-- Label -->
  <rect x="0" y="440" width="800" height="40" fill="rgba(0,0,0,0.32)"/>
  <text x="400" y="466" text-anchor="middle" font-family="serif" font-size="14" fill="#D4A85A" letter-spacing="3">GALLERY WALL — JHAYRA WALL ART</text>
</svg>`;

const ROOMS = [
  { id:'living',  label:'Living Room',    svg: LIVING_SVG,  desc:'A grand living room adorned with statement JHAYRA frames' },
  { id:'bedroom', label:'Bedroom',        svg: BEDROOM_SVG, desc:'Serene bedroom with curated JHAYRA art above the headboard' },
  { id:'dining',  label:'Dining Room',    svg: DINING_SVG,  desc:'Elegant dining space elevated with JHAYRA wall pieces' },
  { id:'office',  label:'Office',         svg: OFFICE_SVG,  desc:'A focused workspace inspired by JHAYRA motivational art' },
  { id:'mandir',  label:'Mandir / Pooja', svg: MANDIR_SVG,  desc:'Sacred pooja space graced with JHAYRA devotional frames' },
  { id:'gallery', label:'Gallery Wall',   svg: GALLERY_SVG, desc:'A curated gallery wall of JHAYRA art in perfect harmony' },
];

export default function RoomInspiration() {
  useScrollReveal();
  const [active, setActive] = useState('living');
  const room = ROOMS.find(r => r.id === active) || ROOMS[0];

  return (
    <div data-page="room-inspiration">
      <SEO
        title="Room Inspiration | Wall Décor Ideas | JHAYRA"
        description="Get inspired with beautiful room décor ideas featuring JHAYRA photo frames. Style your living room, bedroom & pooja room with premium wall art and personalized frames."
        path="/room-inspiration"
      />
      <div className="page-hero">
        <div className="container">
          <p className="eyebrow">Get Inspired</p>
          <h1>Room Inspiration</h1>
          <p>See how JHAYRA art transforms every space</p>
        </div>
      </div>
      <div className="container">
        {/* Room tabs */}
        <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap',marginBottom:'2rem',padding:'1rem 0'}}>
          {ROOMS.map(r => (
            <button key={r.id} onClick={()=>setActive(r.id)}
              className={active===r.id?'btn btn-gold':'btn btn-outline'}
              style={{fontSize:'.82rem',padding:'.5rem 1.1rem'}}>
              {r.label}
            </button>
          ))}
        </div>

        {/* Main room display */}
        <div style={{borderRadius:'1.25rem',overflow:'hidden',marginBottom:'3rem',position:'relative',background:'#EDE0C8'}}>
          <div style={{width:'100%',lineHeight:0}} dangerouslySetInnerHTML={{__html: room.svg}} />
        </div>

        {/* Room info strip */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem',marginBottom:'3rem',padding:'1.2rem 1.6rem',background:'var(--bg)',borderRadius:'var(--r)',border:'1px solid var(--cream)'}}>
          <div>
            <h2 style={{fontFamily:'var(--fd)',fontSize:'1.4rem',marginBottom:'.25rem'}}>{room.label}</h2>
            <p style={{fontSize:'.88rem',color:'var(--muted)',margin:0}}>{room.desc}</p>
          </div>
          <Link to="/shop" className="btn btn-gold" style={{whiteSpace:'nowrap'}}>Shop This Look</Link>
        </div>

        {/* Room grid */}
        <div className="section-header s-reveal">
          <p className="eyebrow">Explore Looks</p>
          <h2 className="display-3">Every Room, a Gallery</h2>
          <div className="divider"></div>
        </div>
        <div className="cat-grid" style={{marginTop:'2rem'}}>
          {ROOMS.map(r => (
            <div key={r.id} className="cat-card reveal" onClick={()=>setActive(r.id)} style={{cursor:'pointer',overflow:'hidden'}}>
              <div style={{width:'100%',lineHeight:0,transform:'scale(1.02)'}} dangerouslySetInnerHTML={{__html: r.svg}} />
              <div className="cat-card-overlay"></div>
              <div className="cat-card-body">
                <div className="cat-card-name">{r.label}</div>
                <div className="cat-card-count">View inspiration</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
