import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { JHAYRA_PRODUCTS } from '../data/products';
import { supabase } from '../lib/supabase';

const SUGGESTIONS = ['Couple', 'Anniversary', 'Birthday', 'Krishna', 'Wedding', 'Family'];

function getThumb(imgs = []) {
  const sorted = [...imgs].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  return sorted.find(i => i.is_primary)?.url || sorted[0]?.url || '';
}

export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setDebounced('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!debounced) { setResults([]); setSearching(false); return; }

    const q = debounced.toLowerCase();
    const staticMatches = JHAYRA_PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags?.some(t => t.toLowerCase().includes(q)) ||
      p.description.toLowerCase().includes(q)
    ).slice(0, 20);

    setResults(staticMatches);
    setSearching(false);

    if (!supabase || !staticMatches.length) return;

    let live = true;
    supabase
      .from('products')
      .select('legacy_id, product_images(url, is_primary, display_order)')
      .eq('active', true)
      .in('legacy_id', staticMatches.map(p => p.id))
      .then(({ data }) => {
        if (!live) return;
        const thumbMap = {};
        (data || []).forEach(row => { thumbMap[row.legacy_id] = getThumb(row.product_images); });
        setResults(prev => prev.map(p => ({ ...p, thumbnail: thumbMap[p.id] || p.thumbnail || '' })));
      });

    return () => { live = false; };
  }, [debounced]);

  if (!open) return null;

  const hasResults = results.length > 0;
  const showEmpty = debounced && !searching && !hasResults;

  return (
    <div className="srch-overlay" role="dialog" aria-modal="true" aria-label="Search products">
      <div className="srch-backdrop" onClick={onClose} />
      <div className="srch-panel">
        <div className="srch-bar">
          <svg className="srch-bar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            className="srch-input"
            type="search"
            placeholder="Search JHAYRA products…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
          />
          {query && (
            <button className="srch-clear" onClick={() => { setQuery(''); inputRef.current?.focus(); }} aria-label="Clear">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
          <button className="srch-cancel" onClick={onClose}>Cancel</button>
        </div>

        <div className="srch-body">
          {searching && <p className="srch-status">Searching…</p>}

          {!searching && debounced && hasResults && (
            <div className="srch-results">
              <p className="srch-count">{results.length} result{results.length !== 1 ? 's' : ''} for "<b>{debounced}</b>"</p>
              {results.map(p => (
                <Link key={p.id} to={`/product/${p.id}`} className="srch-item" onClick={onClose}>
                  <div className="srch-item-img">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt="" loading="lazy" />
                    ) : (
                      <div className="srch-item-img-ph">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <circle cx="9" cy="9" r="2"/>
                          <path d="m21 15-5-5L5 21"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="srch-item-info">
                    <div className="srch-item-name">{p.name}</div>
                    <div className="srch-item-price">From ₹{(p.price ?? 499).toLocaleString('en-IN')}</div>
                    {p.rating ? (
                      <div className="srch-item-rating">
                        {'★'.repeat(Math.min(5, Math.round(p.rating)))}
                        {p.reviewCount ? <span>({p.reviewCount})</span> : null}
                      </div>
                    ) : null}
                  </div>
                  <svg className="srch-item-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9,18 15,12 9,6"/>
                  </svg>
                </Link>
              ))}
            </div>
          )}

          {showEmpty && (
            <div className="srch-empty">
              <div className="srch-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <p className="srch-empty-title">No memories found for "<b>{debounced}</b>"</p>
              <p className="srch-empty-sub">Try searching for</p>
              <div className="srch-chips">
                {SUGGESTIONS.map(s => (
                  <button key={s} className="srch-chip" onClick={() => setQuery(s)}>{s}</button>
                ))}
              </div>
              <Link to="/shop" className="btn btn-outline srch-browse-btn" onClick={onClose}>Browse All Products</Link>
            </div>
          )}

          {!debounced && (
            <div className="srch-initial">
              <p className="srch-hint">Try searching for</p>
              <div className="srch-chips">
                {SUGGESTIONS.map(s => (
                  <button key={s} className="srch-chip" onClick={() => setQuery(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
