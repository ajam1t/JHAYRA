/* Shared admin UI theme — warm ivory / gold, clean cards.
   Single source of truth for the admin look so every page matches. */
export const T = {
  ivory:   '#F7F3EC',
  surface: '#FFFFFF',
  surface2:'#FBF8F2',
  border:  '#EAE4D8',
  border2: '#E6DFD2',
  gold:    '#B68D40',
  goldDeep:'#8A6A24',
  goldSoft:'#FBF3E4',
  text:    '#2A2118',
  text2:   '#4A4034',
  muted:   '#7A6E60',
  muted2:  '#9A8A6A',
  ok:      '#22873A',
  okBg:    '#EAF6EC',
  danger:  '#C0492E',
  dangerBg:'#FBECE7',
  shadow:  '0 1px 3px rgba(60,44,20,0.06), 0 4px 16px rgba(60,44,20,0.05)',
};

/* Reusable style objects shared across admin pages */
export const ui = {
  heading:  { fontFamily: 'var(--fd, serif)', fontSize: '1.6rem', color: T.text, margin: 0, letterSpacing: '.01em' },
  sub:      { color: T.muted, fontSize: '.85rem', marginTop: '.35rem', lineHeight: 1.6 },
  topbar:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.75rem', marginBottom: '1.25rem' },
  card:     { background: T.surface, border: `1px solid ${T.border}`, borderRadius: '14px', boxShadow: T.shadow },
  panel:    { background: T.surface, border: `1px solid ${T.border}`, borderRadius: '14px', padding: '1.25rem 1.4rem', marginBottom: '1.25rem', boxShadow: T.shadow },
  wrap:     { background: T.surface, border: `1px solid ${T.border}`, borderRadius: '14px', overflowX: 'auto', boxShadow: T.shadow },
  table:    { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: '520px' },
  th:       { textAlign: 'left', padding: '0.7rem 1rem', fontSize: '0.68rem', letterSpacing: '0.1em', color: T.muted, textTransform: 'uppercase', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', background: T.surface2 },
  td:       { padding: '0.8rem 1rem', borderBottom: `1px solid ${T.border}`, color: T.text2, verticalAlign: 'middle' },
  field:    { display: 'flex', flexDirection: 'column', gap: '.35rem', marginBottom: '.9rem' },
  label:    { fontSize: '.72rem', letterSpacing: '.06em', textTransform: 'uppercase', color: T.muted, fontWeight: 700 },
  input:    { padding: '0.6rem 0.8rem', background: T.surface, border: `1.5px solid ${T.border2}`, borderRadius: '8px', color: T.text, fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' },
  err:      { color: T.danger, fontSize: '.8rem', marginBottom: '.75rem', background: T.dangerBg, border: `1px solid #F0C9BC`, borderRadius: '8px', padding: '.5rem .75rem' },
  addBtn:   { border: 'none', borderRadius: '9px', padding: '0.6rem 1.15rem', minHeight: '40px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, background: T.gold, color: '#fff', boxShadow: '0 2px 8px rgba(182,141,64,.28)' },
  badge:    (active) => ({ display: 'inline-block', padding: '2px 9px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 600, background: active ? T.okBg : '#F2ECE0', color: active ? T.ok : T.muted2, border: `1px solid ${active ? '#BFE3C6' : T.border2}` }),
  btn:      (variant = 'default') => ({ border: `1.5px solid ${variant === 'danger' ? '#EBC3B7' : T.border2}`, borderRadius: '8px', padding: '0.45rem 0.75rem', minHeight: '34px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, marginLeft: '0.4rem', background: variant === 'danger' ? T.dangerBg : T.surface, color: variant === 'danger' ? T.danger : T.text2 }),
};
