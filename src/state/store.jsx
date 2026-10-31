import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

/* ── Persistent list helper (wishlist, recently viewed) ───────────────────── */
function usePersistentList(key, max = 50) {
  const [list, setList] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(list.slice(0, max)));
    } catch {}
  }, [key, list, max]);
  return [list, setList];
}

/* ── Wishlist + recently viewed ───────────────────────────────────────────── */
const ShopCtx = createContext(null);
export function ShopProvider({ children }) {
  const [wish, setWish] = usePersistentList('jhayra_wishlist');
  const [recent, setRecent] = usePersistentList('jhayra_recent', 12);
  const [searchOpen, setSearchOpen] = useState(false);
  const toggleWish = useCallback((id) => setWish((l) => (l.includes(id) ? l.filter((x) => x !== id) : [id, ...l])), [setWish]);
  const pushRecent = useCallback((id) => setRecent((l) => [id, ...l.filter((x) => x !== id)].slice(0, 12)), [setRecent]);
  return <ShopCtx.Provider value={{ wish, toggleWish, recent, pushRecent, searchOpen, setSearchOpen }}>{children}</ShopCtx.Provider>;
}
export const useShop = () => useContext(ShopCtx);

/* ── Toasts ───────────────────────────────────────────────────────────────── */
const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const id = useRef(0);
  const toast = useCallback((text, tone = 'info') => {
    const t = { id: ++id.current, text, tone };
    setToasts((l) => [...l.slice(-2), t]);
    setTimeout(() => setToasts((l) => l.filter((x) => x.id !== t.id)), 3600);
  }, []);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/* ── Admin auth ───────────────────────────────────────────────────────────── */
const AuthCtx = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function checkRole(uid) {
    if (!uid) return setIsAdmin(false);
    const { data, error } = await supabase.from('profiles').select('role').eq('id', uid).single();
    if (!error) setIsAdmin(data?.role === 'admin');
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      await checkRole(session?.user?.id);
      setLoading(false);
    });
    // Never await Supabase calls inside this callback: it runs while the auth
    // lock is held, so a query here deadlocks every request after a token
    // refresh (admin pages stuck on "Loading…"). Defer it instead.
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setTimeout(() => checkRole(session?.user?.id), 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };
  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };
  return <AuthCtx.Provider value={{ user, isAdmin, loading, signIn, signOut }}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);

/* ── Local order history (shown on /orders) ───────────────────────────────── */
const ORDERS_KEY = 'jhayra_orders';
export function saveLocalOrder(order) {
  try {
    const list = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...list].slice(0, 30)));
  } catch {}
}
export function localOrders() {
  try {
    const v = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
