import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { JHAYRA_PRODUCTS } from '../data/products';
import { supabase } from '../lib/supabase';

const SUGGESTIONS = ['Couple', 'Anniversary', 'Birthday', 'Krishna', 'Wedding', 'Family'];

function getThumb(imgs = []) {
  const sorted = [...imgs].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  return sorted.find(i => i.is_primary)?.url || sorted[0]?.url || '';
}

/* ── Fuzzy search helpers ─────────────────────────────────────────────── */
function editDistance(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  if (m > 20 || n > 20) return 99;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function scoreProduct(product, qFull, qWords) {
  const name = product.name.toLowerCase();
  const cat  = product.category.toLowerCase();
  const tags = (product.tags || []).join(' ').toLowerCase();
  const desc = product.description.toLowerCase();

  let score = 0;

  // Full-phrase exact match (highest priority)
  if (name.includes(qFull)) score += 100;
  if (cat.includes(qFull))  score += 55;
  if (tags.includes(qFull)) score += 50;
  if (desc.includes(qFull)) score += 20;

  // Per-word exact match
  for (const w of qWords) {
    if (w.length < 2) continue;
    if (name.includes(w)) score += 30;
    if (cat.includes(w))  score += 18;
    if (tags.includes(w)) score += 15;
    if (desc.includes(w)) score += 8;
  }

  // Fuzzy match for typos — only when no exact match found
  if (score === 0) {
    const targetWords = `${name} ${cat} ${tags}`.split(/[\s\-_]+/).filter(w => w.length >= 3);
    for (const qw of qWords) {
      if (qw.length < 4) continue;
      const threshold = Math.max(1, Math.floor(qw.length / 4));
      for (const tw of targetWords) {
        if (tw.length < 3) continue;
        if (tw.includes(qw) || qw.includes(tw) || editDistance(qw, tw) <= threshold) {
          score += 8;
          break;
        }
      }
    }
  }

  // Popularity boost (only when already a match)
  if (score > 0) {
    if (product.bestSeller) score += 4;
    if (product.featured)   score += 2;
  }

  return score;
}

const POPULAR = JHAYRA_PRODUCTS.filter(p => p.bestSeller || p.featured).slice(0, 6);

function ResultItem({ p, onClose }) {
  return (
    <Link to={`/product/${p.id}`} className="srch-item" onClick={onClose}>
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
  );
}

export default function SearchOverlay({ open, onClose }) {
  const [query,    setQuery]    = useState('');
  const [debounced,setDebounced]= useState('');
  const [results,  setResults]  = useState([]);
  const [searching,setSearching]= useState(false);
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

    const qFull  = debounced.toLowerCase();
    const qWords = qFull.split(/\s+/).filter(w => w.length >= 2);

    const scored = JHAYRA_PRODUCTS
      .map(p => ({ p, s: scoreProduct(p, qFull, qWords) }))
      .filter(({ s }) => s > 0)
      .sort((a, b) => b.s - a.s)
      .map(({ p }) => p)
      .slice(0, 20);

    setResults(scored);
    setSearching(false);

    if (!supabase || !scored.length) return;

    let live = true;
    supabase
      .from('products')
      .select('legacy_id, product_images(url, is_primary, display_order)')
      .eq('active', true)
      .in('legacy_id', scored.map(p => p.id))
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
  const showEmpty  = debounced && !searching && !hasResults;

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
              {results.map(p => <ResultItem key={p.id} p={p} onClose={onClose} />)}
            </div>
          )}

          {showEmpty && (
            <div className="srch-empty">
              <div className="srch-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <p className="srch-empty-title">No exact matches for "<b>{debounced}</b>"</p>
              <p className="srch-empty-sub">You may also like</p>
              <div className="srch-results" style={{marginTop:'.5rem'}}>
                {POPULAR.map(p => <ResultItem key={p.id} p={p} onClose={onClose} />)}
              </div>
              <div className="srch-chips" style={{marginTop:'1rem'}}>
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
