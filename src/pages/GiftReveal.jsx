import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import Icon, { WhatsAppGlyph } from '../components/Icon';
import RevealExperience from '../components/RevealExperience';
import { Seo } from '../lib/seo';
import { useProducts } from '../lib/catalog';
import { optimized } from '../lib/img';
import { useCart } from '../state/cart';
import { useToast, localOrders } from '../state/store';
import { OCCASIONS, THEMES, EXPIRY, LIMITS, preparePhoto, prepareClip, createReveal, revealUrl, qrDataUrl, myReveals, manageReveal, forgetMine, revealAvailable } from '../lib/reveal';
import '../styles/reveal.css';

/* The sender's side of Gift Reveal: write it, preview it exactly as it will be
   seen, then get a private link and QR code. Nothing is uploaded until
   "Create my reveal link" — and everything personal is encrypted first. */

const DRAFT = 'jh_gift_reveal_draft';
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function ThemeSwatch({ id }) {
  return (
    <div className={`gr-swatch sw-${id}`} aria-hidden="true">
      {id === 'envelope' && (
        <div className="grv-env" style={{ width: 300 }}>
          <div className="grv-env-back" />
          <div className="grv-env-front" />
          <div className="grv-env-flap" />
          <span className="grv-seal">
            <img src="/logo-mark-lg.webp" alt="" />
          </span>
        </div>
      )}
      {id === 'box' && (
        <div className="grv-box" style={{ width: 240 }}>
          <div className="grv-box-lid">
            <span className="grv-ribbon-h" />
          </div>
          <div className="grv-box-body">
            <span className="grv-ribbon-v" />
          </div>
        </div>
      )}
      {id === 'night' && (
        <div className="grv-case" style={{ width: 270 }}>
          <div className="grv-case-lid">
            <img src="/logo-mark-lg.webp" alt="" />
          </div>
          <div className="grv-case-base">
            <span className="grv-case-clasp" />
          </div>
        </div>
      )}
    </div>
  );
}

function VoiceRecorder({ onDone, disabled }) {
  const [rec, setRec] = useState(null);
  const [secs, setSecs] = useState(0);
  const toast = useToast();
  const tick = useRef(null);
  const supported = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
  const stop = () => rec?.state === 'recording' && rec.stop();
  useEffect(() => () => clearInterval(tick.current), []);
  useEffect(() => {
    if (secs >= LIMITS.voiceSeconds) stop();
  }, [secs]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!supported) return null;
  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      const chunks = [];
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      r.onstop = () => {
        clearInterval(tick.current);
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: r.mimeType || 'audio/webm' });
        setRec(null);
        setSecs(0);
        if (blob.size) onDone({ kind: 'voice', blob, url: URL.createObjectURL(blob), mime: blob.type });
      };
      r.start();
      setRec(r);
      setSecs(0);
      tick.current = setInterval(() => setSecs((s) => s + 1), 1000);
    } catch {
      toast('We couldn’t use the microphone. You can upload an audio file instead.', 'warn');
    }
  };
  return rec ? (
    <button type="button" className="btn btn-sm" onClick={stop}>
      <span className="gr-rec">● {String(Math.floor(secs / 60)).padStart(2, '0')}:{String(secs % 60).padStart(2, '0')}</span> Stop recording
    </button>
  ) : (
    <button type="button" className="btn btn-ghost btn-sm" onClick={start} disabled={disabled}>
      <Icon name="sparkle" size={15} /> Record a voice note
    </button>
  );
}

function MyReveals({ bump }) {
  const [list, setList] = useState(myReveals());
  const [status, setStatus] = useState({});
  const toast = useToast();
  useEffect(() => {
    const mine = myReveals();
    setList(mine);
    mine.forEach((r) =>
      manageReveal(r, 'status')
        .then((s) => setStatus((m) => ({ ...m, [r.id]: s })))
        .catch(() => {}),
    );
  }, [bump]);
  if (!list.length) return null;
  const act = async (r, action, days) => {
    if (action === 'delete' && !window.confirm(`Delete the reveal for ${r.to || 'this person'}? The link will stop working and the message will be erased. This cannot be undone.`)) return;
    try {
      const s = await manageReveal(r, action, days);
      if (action === 'delete') {
        forgetMine(r.id);
        setList(myReveals());
        toast('Reveal deleted. The link no longer works.', 'ok');
      } else {
        setStatus((m) => ({ ...m, [r.id]: s }));
        toast(action === 'off' ? 'Link switched off.' : action === 'on' ? 'Link switched back on.' : 'Link extended.', 'ok');
      }
    } catch {
      toast('That didn’t go through. Please try again.', 'warn');
    }
  };
  const copy = async (r) => {
    try {
      await navigator.clipboard.writeText(revealUrl(r));
      toast('Link copied.', 'ok');
    } catch {
      toast('Couldn’t copy — press and hold the link to copy it.', 'warn');
    }
  };
  return (
    <div className="gr-card">
      <h2>Your gift reveals</h2>
      <p className="gr-hint">Kept on this device. You stay in control of each link.</p>
      <ul className="gr-mine" style={{ margin: 0, padding: 0 }}>
        {list.map((r) => {
          const s = status[r.id];
          const gone = s?.status === 'not_found';
          const off = s?.revoked;
          return (
            <li key={r.id}>
              <div className="gr-mine-top">
                <b>
                  For {r.to || 'someone special'}
                  {r.occasion ? ` · ${r.occasion}` : ''}
                </b>
                <span className={`gr-badge ${off || gone || s?.expired ? 'off' : ''}`}>{!s ? '…' : gone ? 'Removed' : off ? 'Switched off' : s.expired ? 'Expired' : s.views ? `Opened ${s.views}×` : 'Not opened yet'}</span>
              </div>
              {s && !gone && (
                <small className="muted">
                  Created {fmtDate(r.created)} · open until {fmtDate(s.expires_at)}
                </small>
              )}
              <div className="gr-mine-acts">
                {!gone && (
                  <>
                    <button className="btn btn-sm" onClick={() => copy(r)}>
                      Copy link
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => act(r, off ? 'on' : 'off')}>
                      {off ? 'Switch on' : 'Switch off'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => act(r, 'extend', 30)}>
                      Keep open 30 more days
                    </button>
                  </>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => (gone ? (forgetMine(r.id), setList(myReveals())) : act(r, 'delete'))}>
                  {gone ? 'Remove from list' : 'Delete'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function GiftReveal() {
  const cart = useCart();
  const toast = useToast();
  const { data: products } = useProducts();
  const saved = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem(DRAFT) || '{}');
    } catch {
      return {};
    }
  }, []);
  const [to, setTo] = useState(saved.to || '');
  const [from, setFrom] = useState(saved.from || '');
  const [occasion, setOccasion] = useState(saved.occasion || OCCASIONS[0]);
  const [message, setMessage] = useState(saved.message || '');
  const [theme, setTheme] = useState(saved.theme || 'envelope');
  const [days, setDays] = useState(saved.days || 30);
  const [photos, setPhotos] = useState([]);
  const [clip, setClip] = useState(null);
  const [product, setProduct] = useState(null);
  const [q, setQ] = useState('');
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(0); // 0 idle, else progress 0–1 (min 0.02)
  const [done, setDone] = useState(null);
  const [qr, setQr] = useState('');
  const [bump, setBump] = useState(0);
  const fileRef = useRef(null);
  const clipRef = useRef(null);
  const [live, setLive] = useState(true);
  useEffect(() => {
    revealAvailable().then(setLive);
  }, []);

  // Words survive a reload in this tab; photos and recordings are never stored.
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT, JSON.stringify({ to, from, occasion, message, theme, days }));
    } catch {}
  }, [to, from, occasion, message, theme, days]);

  // What could the gift be? The bag first, then recent orders, then the catalogue.
  const gifts = useMemo(() => {
    const out = [];
    const seen = new Set();
    const add = (name, image, tag) => {
      if (!name || seen.has(name)) return;
      seen.add(name);
      out.push({ name, image: image || '', tag });
    };
    cart.items.forEach((i) => add(i.name, i.image ? optimized(i.image, 640) : i.preview, 'In your bag'));
    localOrders().forEach((o) => (o.items || []).forEach((i) => add(i.name, i.image ? optimized(i.image, 640) : i.preview, 'Ordered')));
    (products || []).forEach((p) => add(p.name, p.thumbnail ? optimized(p.thumbnail, 640) : '', ''));
    return out;
  }, [cart.items, products]);
  useEffect(() => {
    if (!product && gifts.length && gifts[0].tag) setProduct(gifts[0]);
  }, [gifts]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = gifts.filter((g) => !q.trim() || g.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, q.trim() ? 60 : 18);

  const addPhotos = async (files) => {
    const room = LIMITS.photos - photos.length;
    const next = [];
    for (const f of [...files].slice(0, room)) {
      try {
        next.push(await preparePhoto(f));
      } catch (e) {
        toast(e.message, 'warn');
      }
    }
    if (files.length > room) toast(`Up to ${LIMITS.photos} photos — the first ${room} were added.`, 'warn');
    setPhotos((p) => [...p, ...next]);
  };
  const addClip = (file) => {
    try {
      setClip(prepareClip(file));
    } catch (e) {
      toast(e.message, 'warn');
    }
  };

  const data = { to: to.trim(), from: from.trim(), occasion, message: message.trim(), theme, product, photos, clip };
  const problem = !to.trim() ? 'Add the recipient’s name.' : !from.trim() ? 'Add your name.' : !message.trim() && !photos.length ? 'Add a message or at least one photo.' : '';

  const create = async () => {
    if (problem) return toast(problem, 'warn');
    setBusy(0.02);
    try {
      const rec = await createReveal({ ...data, days }, (p) => setBusy(Math.max(0.02, p)));
      setDone(rec);
      setQr(await qrDataUrl(revealUrl(rec)));
      setBump((b) => b + 1);
      try {
        sessionStorage.removeItem(DRAFT);
      } catch {}
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.error(e);
      toast('We couldn’t create your reveal just now. Please check your connection and try again.', 'warn');
    } finally {
      setBusy(0);
    }
  };

  const url = done ? revealUrl(done) : '';
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied.', 'ok');
    } catch {
      toast('Couldn’t copy — press and hold the link to copy it.', 'warn');
    }
  };
  const startAnother = () => {
    setDone(null);
    setQr('');
    setTo('');
    setMessage('');
    setPhotos([]);
    setClip(null);
  };

  return (
    <>
      <Seo title="Gift Reveal — A Digital Unboxing for Your Gift" description="Send a private digital surprise before your JHAYRA gift arrives: your photos, your words, a beautiful reveal — opened with a link or QR code." path="/gift-reveal" />
      <div className="wrap gr">
        <header className="gr-hero">
          <span className="eyebrow">Gift Reveal</span>
          <h1 className="h1" style={{ marginTop: 12 }}>
            Let them open it <em>twice.</em>
          </h1>
          <p className="lead" style={{ marginTop: 10, maxWidth: 620 }}>
            Before the frame arrives, send a private digital surprise — your photos, your words, a beautiful reveal. They open it with a link or QR code. No app, no account.
          </p>
        </header>

        {done ? (
          <div className="gr-grid" style={{ marginTop: 22 }}>
            <div className="gr-card gr-done">
              <span className="eyebrow">Ready to send</span>
              <h2 style={{ fontSize: 34, marginTop: 8 }}>Your reveal for {done.to} is ready</h2>
              {qr && <img className="gr-qr" src={qr} alt="QR code that opens the gift reveal" width="240" height="240" />}
              <div className="gr-link">
                <input className="input" readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Private reveal link" />
                <button className="btn" onClick={copy}>
                  Copy
                </button>
              </div>
              <div className="grv-actions" style={{ marginTop: 14 }}>
                <a className="btn btn-wa" href={`https://wa.me/?text=${encodeURIComponent(`I have a little surprise for you 🎁 Open it here:\n${url}`)}`} target="_blank" rel="noopener noreferrer">
                  <WhatsAppGlyph size={18} /> Send on WhatsApp
                </a>
                {qr && (
                  <a className="btn btn-ghost" href={qr} download={`JHAYRA-gift-reveal-${(done.to || 'qr').replace(/[^a-z0-9]+/gi, '-')}.png`}>
                    <Icon name="download" size={16} /> Save QR code
                  </a>
                )}
                <a className="btn btn-ghost" href={url} target="_blank" rel="noopener noreferrer">
                  <Icon name="eye" size={16} /> Open it
                </a>
              </div>
              <p className="gr-private" style={{ marginTop: 18, textAlign: 'left' }}>
                <Icon name="lock" size={16} />
                <span>
                  Only someone with this exact link or QR code can open it. Keep the whole link — the part after “#” is the key, and we never see it. Open until {fmtDate(Date.now() + done.days * 864e5)}; you can switch it off or delete it below at any time.
                </span>
              </p>
              <button className="link" style={{ marginTop: 14 }} onClick={startAnother}>
                Create another reveal
              </button>
            </div>
            <div className="gr-side">
              <MyReveals bump={bump} />
            </div>
          </div>
        ) : (
          <div className="gr-grid" style={{ marginTop: 22 }}>
            <div>
              <section className="gr-card">
                <h2>
                  <small>1</small>Who is it for?
                </h2>
                <div className="gr-row two" style={{ marginTop: 12 }}>
                  <label className="gr-field">
                    Their name
                    <input className="input" value={to} maxLength={LIMITS.name} onChange={(e) => setTo(e.target.value)} placeholder="e.g. Meera" autoComplete="off" />
                  </label>
                  <label className="gr-field">
                    Your name
                    <input className="input" value={from} maxLength={LIMITS.name} onChange={(e) => setFrom(e.target.value)} placeholder="e.g. Aarav" autoComplete="given-name" />
                  </label>
                </div>
                <div className="gr-field" style={{ marginTop: 14 }}>
                  Occasion
                  <div className="gr-chips" role="group" aria-label="Occasion">
                    {OCCASIONS.map((o) => (
                      <button key={o} type="button" aria-pressed={occasion === o} onClick={() => setOccasion(o)}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="gr-card">
                <h2>
                  <small>2</small>Your message
                </h2>
                <label className="gr-field" style={{ marginTop: 10 }}>
                  <textarea className="input" rows={5} value={message} maxLength={LIMITS.message} onChange={(e) => setMessage(e.target.value)} placeholder="Write what this memory means to you…" />
                  <small>
                    {message.length}/{LIMITS.message}
                  </small>
                </label>
              </section>

              <section className="gr-card">
                <h2>
                  <small>3</small>Photos, and a voice or video
                </h2>
                <p className="gr-hint">Up to {LIMITS.photos} photos. Optional: one video (up to {LIMITS.videoMB} MB) or a voice note (up to {LIMITS.voiceSeconds} seconds).</p>
                <div className="gr-photos">
                  {photos.map((p, i) => (
                    <div key={p.url} className="gr-photo">
                      <img src={p.url} alt={`Photo ${i + 1}`} />
                      <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => setPhotos((l) => l.filter((x) => x !== p))}>
                        <Icon name="close" size={14} />
                      </button>
                    </div>
                  ))}
                  {photos.length < LIMITS.photos && (
                    <button type="button" className="gr-add" onClick={() => fileRef.current?.click()}>
                      <Icon name="plus" size={20} />
                      Add photo
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => (addPhotos(e.target.files), (e.target.value = ''))} />
                <div className="gr-clip">
                  {clip ? (
                    <>
                      {clip.kind === 'video' ? <video src={clip.url} controls playsInline preload="metadata" /> : <audio src={clip.url} controls />}
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setClip(null)}>
                        <Icon name="trash" size={14} /> Remove {clip.kind === 'video' ? 'video' : 'voice note'}
                      </button>
                    </>
                  ) : (
                    <>
                      <VoiceRecorder onDone={setClip} />
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => clipRef.current?.click()}>
                        <Icon name="upload" size={15} /> Add a video or audio file
                      </button>
                    </>
                  )}
                </div>
                <input ref={clipRef} type="file" accept="video/*,audio/*" hidden onChange={(e) => (e.target.files[0] && addClip(e.target.files[0]), (e.target.value = ''))} />
              </section>

              <section className="gr-card">
                <h2>
                  <small>4</small>Which gift are you sending?
                </h2>
                <p className="gr-hint">
                  Shown at the end as “your gift is on its way”.{' '}
                  {!cart.items.length && (
                    <>
                      Not chosen one yet? <Link to="/shop">Browse wall art</Link> or <Link to="/customize">personalise a frame</Link>.
                    </>
                  )}
                </p>
                <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search our designs…" aria-label="Search designs" style={{ marginBottom: 12 }} />
                <div className="gr-gifts">
                  {shown.map((g) => (
                    <button key={g.name} type="button" className="gr-gift" aria-pressed={product?.name === g.name} onClick={() => setProduct(product?.name === g.name ? null : g)}>
                      {g.image ? <img src={g.image} alt="" loading="lazy" /> : <span style={{ aspectRatio: '3 / 4', display: 'grid', placeItems: 'center', background: '#fbf8f2', border: '4px solid #141210', color: '#8a7149' }}><Icon name="gift" size={22} /></span>}
                      <span>
                        {g.name}
                        {g.tag && (
                          <>
                            <br />
                            <small className="muted">{g.tag}</small>
                          </>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
                {!shown.length && <p className="muted">No designs match “{q}”.</p>}
              </section>
            </div>

            <aside className="gr-side">
              <section className="gr-card">
                <h2>
                  <small>5</small>Choose the reveal
                </h2>
                <div className="gr-themes" role="group" aria-label="Reveal theme" style={{ marginTop: 12 }}>
                  {THEMES.map((t) => (
                    <button key={t.id} type="button" className="gr-theme" aria-pressed={theme === t.id} onClick={() => setTheme(t.id)}>
                      <ThemeSwatch id={t.id} />
                      <b>{t.name}</b>
                      <small>{t.line}</small>
                    </button>
                  ))}
                </div>
                <div className="gr-field" style={{ marginTop: 18 }}>
                  Keep the link open for
                  <div className="gr-chips" role="group" aria-label="Link expiry">
                    {EXPIRY.map(([d, l]) => (
                      <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="gr-card gr-cta">
                <button type="button" className="btn btn-ghost btn-lg btn-block" onClick={() => (problem ? toast(problem, 'warn') : setPreview(true))}>
                  <Icon name="eye" size={18} /> Preview the reveal
                </button>
                {!live && (
                  <p className="gr-private" role="status">
                    <Icon name="clock" size={16} />
                    <span>Gift Reveal is opening soon. You can design and preview yours now — creating the private link will be available shortly.</span>
                  </p>
                )}
                <button type="button" className="btn btn-gold btn-lg btn-block" onClick={create} disabled={!!busy || !live}>
                  {busy ? 'Encrypting and saving…' : 'Create my reveal link'} {!busy && <Icon name="arrow" size={17} />}
                </button>
                {!!busy && (
                  <div className="gr-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(busy * 100)}>
                    <i style={{ width: `${Math.round(busy * 100)}%` }} />
                  </div>
                )}
                <p className="gr-private">
                  <Icon name="lock" size={16} />
                  <span>Private by design: your photos and words are encrypted on this device before they are saved. Only the link you share can open them — not even JHAYRA can.</span>
                </p>
              </section>

              <MyReveals bump={bump} />
            </aside>
          </div>
        )}
      </div>
      {preview && createPortal(<RevealExperience data={data} preview onClose={() => setPreview(false)} />, document.body)}
    </>
  );
}
