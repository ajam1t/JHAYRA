/* FramedArt — the ONE canonical JHAYRA frame renderer.
   ------------------------------------------------------------------------
   THE FRAME IS OWNED BY THE WEBSITE, NOT BY THE ARTWORK.

   Every product surface (shop cards, product detail, customize previews,
   cart, checkout) renders its frame through this component. The input is
   always CLEAN artwork — a photo, an SVG drawing, or custom SVG children —
   and this component draws the physical JHAYRA frame around it dynamically
   from the selected size + orientation + colour.

   It NEVER assumes the incoming image already contains a frame, so there is
   no way to produce a frame-inside-frame. The artwork is fitted into the
   inner opening with object-fit (cover/contain) which preserves aspect ratio
   and never distorts the image.

   Props
   -----
   size          'A4' | 'A3+' | '18 × 24' | '24 × 36'
   orientation   'Vertical' (portrait) | 'Horizontal' (landscape)
   colour        'Black' | 'Gold' | 'Brown'
   src           clean image URL / data-URL (customer photo or product photo)
   svg           clean SVG markup string (JHAYRA studio artwork)
   children      custom inner content (e.g. <TemplateRenderer/>); wins over src/svg
   fit           'cover' (fill opening, controlled crop) | 'contain' (whole image)
   transform     { zoom, panX, panY } — reposition an image inside the opening
   baseH         override portrait height in px (small cards/thumbnails)
   fitContainer  size to the parent via aspect-ratio instead of fixed px
   gloss         subtle glass reflection overlay (default true)
   background    opening backdrop shown behind a 'contain' image / placeholder
   placeholder   node rendered when no src/svg/children is provided
*/

import { frameGeometry, FRAME_COLOUR_HEX, FRAME_SHADOW } from '../data/frameOptions';

export default function FramedArt({
  size = 'A4',
  orientation = 'Vertical',
  colour = 'Black',
  hex: hexProp,
  ratioW,
  ratioH,
  src,
  svg,
  children,
  fit = 'cover',
  transform = null,
  baseH,
  fitContainer = false,
  gloss = true,
  background = '#F3ECDD',
  placeholder = null,
  alt = '',
  className = '',
  style = {},
}) {
  const geo    = frameGeometry(size, orientation, baseH, ratioW && ratioH ? { w: ratioW, h: ratioH } : undefined);
  const hex    = hexProp || FRAME_COLOUR_HEX[colour] || FRAME_COLOUR_HEX.Black;
  const shadow = FRAME_SHADOW[colour] || FRAME_SHADOW.Black;

  /* Outer physical frame sizing.
     In fitContainer mode the frame scales to fit its parent box while keeping
     the exact per-size aspect ratio. minWidth/minHeight:0 + flexShrink:1 are
     required so the frame's own content (opening/placeholder) can't force a
     min-content width that would override the aspect-ratio (a flexbox default
     that otherwise makes every size render at the same proportion). */
  const frameSizing = fitContainer
    ? {
        aspectRatio: `${geo.frameW} / ${geo.frameH}`,
        width:  geo.isPortrait ? 'auto' : '100%',
        height: geo.isPortrait ? '100%' : 'auto',
        maxWidth:  '100%',
        maxHeight: '100%',
        minWidth: 0,
        minHeight: 0,
        flexShrink: 1,
      }
    : {
        width:    `${geo.frameW}px`,
        height:   `${geo.frameH}px`,
        maxWidth: 'calc(100% - 1rem)',
      };

  /* Proportional moulding.
     A fixed-px CSS border can't scale with the frame in fitContainer mode, so
     when the frame renders small (mobile sticky preview, shop cards) the border
     looks disproportionately thick and the artwork tiny. Here the moulding is
     expressed as a PERCENTAGE of the rendered frame, so it stays thin, premium
     and identical in proportion at any container size. Left/right use the % of
     width; top/bottom are scaled by the aspect ratio so the physical moulding
     is a uniform thickness on all four sides (never distorting the opening).
     Non-fitContainer surfaces (fixed-px thumbnails) keep the classic css border. */
  const mouldFrac = (geo.borderWidth / geo.frameW) * 0.6;      // ~5% → ~3% : thinner, premium
  const bLR = +(mouldFrac * 100).toFixed(3);                   // % of width  (left / right)
  const bTB = +(mouldFrac * 100 * (geo.frameW / geo.frameH)).toFixed(3); // % of height → equal px

  /* Inner artwork */
  let inner;
  if (children) {
    inner = children;
  } else if (svg) {
    // Normalise a raw SVG string so it fills the opening with the chosen fit.
    const aspect = fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet';
    const cleaned = svg
      .replace(/preserveAspectRatio="[^"]*" */g, '')
      .replace('<svg ', `<svg preserveAspectRatio="${aspect}" style="width:100%;height:100%;display:block;" `);
    inner = <div style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: cleaned }} />;
  } else if (src) {
    const imgStyle = {
      width: '100%',
      height: '100%',
      objectFit: fit,
      objectPosition: 'center',
      display: 'block',
      ...(transform
        ? {
            transform: `scale(${transform.zoom || 1}) translate(${(transform.panX || 0) * 100}%, ${(transform.panY || 0) * 100}%)`,
            transformOrigin: 'center',
          }
        : {}),
    };
    inner = <img src={src} alt={alt} loading="lazy" style={imgStyle} />;
  } else {
    inner = placeholder || <div style={{ width: '100%', height: '100%' }} />;
  }

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        boxSizing: 'border-box',
        flexShrink: 0,
        // Proportional moulding uses the outer background as the frame face + an
        // inset opening; fixed-px surfaces keep the classic css border.
        ...(fitContainer ? {} : { border: `${geo.borderWidth}px solid ${hex}` }),
        background: hex,
        boxShadow: shadow,
        borderRadius: '2px',
        overflow: 'hidden',
        // Only colour/shadow animate. Geometry (width/height/aspect-ratio) snaps
        // instantly on selection: transitioning aspect-ratio leaves Chrome's
        // resolved value stuck at the previous ratio, so the frame would render
        // at the wrong proportion after a size/orientation change.
        transition: 'border-color .4s ease, background .4s ease, box-shadow .4s ease',
        ...frameSizing,
        ...style,
      }}
    >
      {/* Inner opening */}
      <div
        style={{
          overflow: 'hidden',
          background,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...(fitContainer
            ? {
                position: 'absolute',
                top: `${bTB}%`,
                bottom: `${bTB}%`,
                left: `${bLR}%`,
                right: `${bLR}%`,
                // subtle rabbet edge so the moulding reads as a physical frame
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.16)',
              }
            : { position: 'relative', width: '100%', height: '100%' }),
        }}
      >
        {inner}
      </div>

      {/* Glass reflection */}
      {gloss && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(148deg,rgba(255,255,255,.12) 0%,rgba(255,255,255,.03) 35%,transparent 60%)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
