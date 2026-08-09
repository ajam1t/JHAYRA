import { Link } from 'react-router-dom';
import { GROUP_MAP } from '../data/templates';

function buildPreviewSVG(template) {
  const { layout, photoSlots, previewColors = ['#E8E0C8','#B68D40'], textFields = [] } = template;
  const bg   = previewColors[0] || '#E8E0C8';
  const acc  = previewColors[1] || '#B68D40';
  const slot = 'rgba(0,0,0,0.18)';
  const W = 320, H = 240, P = 14;
  const uw = W - P*2, uh = H - P*2 - 22;

  const rr = (x,y,w,h,fill=slot,rx=4) =>
    `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${fill}" rx="${rx}"/>`;

  const bar = `<rect x="0" y="${H-22}" width="${W}" height="22" fill="${acc}" opacity=".9"/>
    <text x="${W/2}" y="${H-8}" text-anchor="middle" font-size="8" fill="white" font-family="Georgia,serif" letter-spacing="1.5">${(GROUP_MAP[template.group]?.label || template.group).toUpperCase()}</text>`;

  let inner = '';

  if (!photoSlots || layout === 'text-only') {
    const qv = textFields[0]?.defaultValue || 'Your Quote';
    const disp = qv.length > 28 ? qv.slice(0,28)+'…' : qv;
    inner = rr(P,P,uw,uh,'rgba(0,0,0,0.06)',6)
      + `<text x="${W/2}" y="${P+uh/2-4}" text-anchor="middle" font-size="9.5" fill="${acc}" font-family="Georgia,serif" font-style="italic">"${disp}"</text>`;
  } else if (layout === 'single' || photoSlots === 1) {
    inner = rr(P,P,uw,uh,slot,6);
  } else if (layout === 'pair' || (photoSlots === 2 && !layout?.includes('calendar'))) {
    const hw = (uw-8)/2;
    inner = rr(P,P,hw,uh)+rr(P+hw+8,P,hw,uh);
  } else if (layout === 'three-col' || photoSlots === 3) {
    const sw = (uw-16)/3;
    inner = [0,1,2].map(i=>rr(P+i*(sw+8),P,sw,uh)).join('');
  } else if (layout === 'four-grid' || photoSlots === 4) {
    const hw=(uw-8)/2, hh=(uh-8)/2;
    inner = [0,1].flatMap(r=>[0,1].map(c=>rr(P+c*(hw+8),P+r*(hh+8),hw,hh))).join('');
  } else if (layout==='five-1main'||layout==='five-main-row') {
    const mw=uw*0.58, sw=uw-mw-8, qh=(uh-8)/2;
    inner = rr(P,P,mw,uh,slot,6)+rr(P+mw+8,P,sw,qh)+rr(P+mw+8,P+qh+8,sw,qh);
  } else if (layout==='six-grid'||photoSlots===6) {
    const sw=(uw-16)/3, hh=(uh-8)/2;
    inner = [0,1,2].flatMap(c=>[0,1].map(r=>rr(P+c*(sw+8),P+r*(hh+8),sw,hh))).join('');
  } else if (layout==='nine-grid'||photoSlots>=9) {
    const sw=(uw-16)/3, sh=(uh-16)/3;
    inner = [0,1,2].flatMap(c=>[0,1,2].map(r=>rr(P+c*(sw+8),P+r*(sh+8),sw,sh))).join('');
  } else if (layout==='calendar-1') {
    const pw=uw*0.56, cw=uw-pw-8;
    inner = rr(P,P,pw,uh,slot,6)
      +rr(P+pw+8,P,cw,uh,'rgba(255,255,255,0.35)',6)
      +`<text x="${(P+pw+8+cw/2).toFixed(1)}" y="${(P+uh/2+4).toFixed(1)}" text-anchor="middle" font-size="20" fill="${acc}" opacity=".8">📅</text>`;
  } else if (layout==='calendar-multi') {
    const hw=(uw-8)/2, qh=(uh-8)/2;
    inner = rr(P,P,hw,qh)+rr(P+hw+8,P,hw,qh)
      +rr(P,P+qh+8,hw,qh,'rgba(255,255,255,0.3)',4)
      +rr(P+hw+8,P+qh+8,hw,qh,'rgba(255,255,255,0.3)',4)
      +`<text x="${W/2}" y="${(P+qh+8+qh/2+5).toFixed(1)}" text-anchor="middle" font-size="12" fill="${acc}">📅</text>`;
  } else {
    inner = rr(P,P,uw,uh,slot,6);
  }

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${H}" fill="${bg}"/>${inner}${bar}</svg>`;
}

export default function TemplateCard({ template }) {
  const group = GROUP_MAP[template.group] || {};
  const svg   = buildPreviewSVG(template);

  let badge = null;
  if (template.bestSeller)   badge = {cls:'best',label:'Best Seller'};
  else if (template.popular) badge = {cls:'popular',label:'Popular'};
  else if (template.newArrival) badge = {cls:'new',label:'New'};

  return (
    <Link to={`/customize/${template.id}`} className="tmpl-card" style={{textDecoration:'none'}}>
      <div className="tmpl-card-preview" dangerouslySetInnerHTML={{__html:svg}} />
      <div className="tmpl-card-body">
        <div className="tmpl-card-title">{template.title}</div>
        <div className="tmpl-card-subtitle">{template.subtitle}</div>
        <div className="tmpl-card-meta">
          <span className="tmpl-card-group">{group.label || template.group}</span>
          <span className="tmpl-card-price">from ₹{template.startingPrice?.toLocaleString('en-IN')}</span>
        </div>
        {badge && <div style={{marginTop:'.35rem'}}><span className={`tmpl-card-badge ${badge.cls}`}>{badge.label}</span></div>}
      </div>
    </Link>
  );
}
