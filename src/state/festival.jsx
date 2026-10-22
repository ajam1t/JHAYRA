import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { activeFestival, FESTIVAL_MAP, loadFestivals } from '../lib/festivals';

const FestivalCtx = createContext(null);
const KEY = 'jhayra_festival_preview';

export function FestivalProvider({ children }) {
  const { search } = useLocation();
  const [festival, setFestival] = useState(() => pick(search));

  useEffect(() => {
    setFestival(pick(search));
  }, [search]);

  // Pick up festivals edited in the admin panel.
  useEffect(() => {
    loadFestivals().then(() => setFestival(pick(window.location.search)));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (!festival) {
      root.removeAttribute('data-festival');
      return;
    }
    root.setAttribute('data-festival', festival.id);
    const t = festival.theme;
    root.style.setProperty('--fx-bg', t.bg);
    root.style.setProperty('--fx-bg2', t.bg2);
    root.style.setProperty('--fx-ink', t.ink);
    root.style.setProperty('--fx-accent', t.accent);
    root.style.setProperty('--fx-glow', t.glow);
  }, [festival]);

  return <FestivalCtx.Provider value={festival}>{children}</FestivalCtx.Provider>;
}

function pick(search) {
  const q = new URLSearchParams(search).get('festival');
  try {
    if (q === 'off') sessionStorage.removeItem(KEY);
    else if (q && FESTIVAL_MAP[q]) sessionStorage.setItem(KEY, q);
    const saved = sessionStorage.getItem(KEY);
    if (saved && FESTIVAL_MAP[saved]) return FESTIVAL_MAP[saved];
  } catch {}
  if (q === 'off') return null;
  return activeFestival();
}

export const useFestival = () => useContext(FestivalCtx);
