import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import Icon, { WhatsAppGlyph } from '../components/Icon';
import RevealExperience from '../components/RevealExperience';
import GiftPiece from '../components/GiftPiece';
import { Seo } from '../lib/seo';
import { waLink } from '../lib/site';
import { useToast } from '../state/store';
import { OCCASIONS, THEMES, LIMITS, preparePhoto, prepareClip, verifyOrder, saveReveal, revealUrl, qrDataUrl, takeHandOff } from '../lib/reveal';
import '../styles/reveal.css';

/* Gift Reveal for a real order. The customer confirms the order (order number +
   checkout mobile); we show the gifts they actually bought and they write the
   reveal around them. One reveal per order, editable until the order is
   delivered — the gift-reveal Edge Function enforces all of that. */

const STATUS = { confirmed: 'Confirmed', personalization: 'Being personalised', processing: 'Being crafted', shipped: 'Shipped' };
const fmt = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const pad = (n) => String(n).padStart(2, '0');
const toLocalInput = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
};

const CLOSED = {
  unpaid: ['This order isn’t paid yet', 'A Gift Reveal can be created once the payment for this order is confirmed. If you have just paid, please wait a minute and try again.'],
  delivered: ['This order has been delivered', 'A Gift Reveal is made to be opened before the gift arrives, so it closes when the order is delivered and can no longer be created or edited.'],
  cancelled: ['This order was cancelled', 'Gift Reveals are only available for active orders.'],
  refunded: ['This order was refunded', 'Gift Reveals are only available for active orders.'],
};

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

function VoiceRecorder({ onDone }) {
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
        const mime = (r.mimeType || 'audio/webm').split(';')[0];
        const blob = new Blob(chunks, { type: mime });
        setRec(null);
        setSecs(0);
        if (blob.size) onDone({ kind: 'voice', blob, url: URL.createObjectURL(blob), mime });
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
      <span className="gr-rec">
        ● {pad(Math.floor(secs / 60))}:{pad(secs % 60)}
      </span>{' '}
      Stop recording
    </button>
  ) : (
    <button type="button" className="btn btn-ghost btn-sm" onClick={start}>
      <Icon name="sparkle" size={15} /> Record a voice note
    </button>
  );
}

const blank = () => ({ to: '', from: '', occasion: OCCASIONS[0], message: '', theme: 'envelope', sound: true, photos: [], clip: null, when: 'now', at: '' });
function fromReveal(r) {
  const c = r.content || {};
  const later = new Date(r.publish_at).getTime() > Date.now();
  return {
    to: c.to || '',
    from: c.from || '',
    occasion: c.occasion || OCCASIONS[0],
    message: c.message || '',
    theme: c.theme || 'envelope',
    sound: c.sound !== false,
    photos: (c.photos || []).map((p) => ({ path: p.path, url: p.url })),
    clip: c.clip ? { path: c.clip.path, kind: c.clip.kind, mime: c.clip.mime, url: c.clip.url } : null,
    when: later ? 'later' : 'now',
    at: later ? toLocalInput(r.publish_at) : '',
  };
}

function ShareCard({ reveal, to }) {
  const toast = useToast();
  const [qr, setQr] = useState('');
  const url = revealUrl(reveal.token);
  useEffect(() => {
    qrDataUrl(url).then(setQr).catch(() => {});
  }, [url]);
  const scheduled = new Date(reveal.publish_at).getTime() > Date.now();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied.', 'ok');
    } catch {
      toast('Couldn’t copy — press and hold the link to copy it.', 'warn');
    }
  };
  return (
    <section className="gr-card gr-done">
      <span className="eyebrow">Your Gift Reveal</span>
      <h2 style={{ fontSize: 30, marginTop: 8 }}>For {to || 'someone special'}</h2>
      <div className="gr-status" style={{ margin: '10px 0 4px' }}>
        <span className={`gr-badge ${scheduled ? 'off' : ''}`} style={{ justifySelf: 'center' }}>
          {scheduled ? `Opens ${fmt(reveal.publish_at)}` : reveal.views ? `Opened ${reveal.views}×` : 'Live · not opened yet'}
        </span>
        {reveal.first_opened_at && <small className="muted">First opened {fmt(reveal.first_opened_at)}</small>}
      </div>
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
          <a className="btn btn-ghost" href={qr} download={`JHAYRA-gift-reveal-${(to || 'qr').replace(/[^a-z0-9]+/gi, '-')}.png`}>
            <Icon name="download" size={16} /> Save QR code
          </a>
        )}
      </div>
      <p className="gr-private" style={{ marginTop: 16, textAlign: 'left' }}>
        <Icon name="lock" size={16} />
        <span>Only someone with this link or QR code can open it — it carries no order or personal details. {scheduled ? 'It stays closed until the time you chose. ' : ''}It closes automatically when your order is delivered.</span>
      </p>
    </section>
  );
}

export default function GiftReveal() {
  const toast = useToast();
  const [params] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(params.get('order') || '');
  const [mobile, setMobile] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [err, setErr] = useState('');
  const [order, setOrder] = useState(null); // verify response
  const [draft, setDraft] = useState(blank);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(0);
  const [justSaved, setJustSaved] = useState(false);
  const fileRef = useRef(null);
  const clipRef = useRef(null);
  const top = useRef(null);
  const set = (patch) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };

  const verify = async (num = orderNumber, mob = mobile) => {
    setErr('');
    setVerifying(true);
    try {
      const r = await verifyOrder(num, mob);
      setOrder(r);
      if (r.reveal && !dirty) setDraft(fromReveal(r.reveal));
      setJustSaved(false);
      top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      setErr(e.message);
    } finally {
      setVerifying(false);
    }
  };

  // Arriving from the order confirmation or My Orders: details are handed over in
  // this tab only (never in the URL), and we check them straight away.
  useEffect(() => {
    const h = takeHandOff();
    if (h?.orderNumber) {
      setOrderNumber(h.orderNumber);
      if (h.mobile) {
        setMobile(h.mobile);
        verify(h.orderNumber, h.mobile);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addPhotos = async (files) => {
    const room = LIMITS.photos - draft.photos.length;
    const next = [];
    for (const f of [...files].slice(0, room)) {
      try {
        next.push(await preparePhoto(f));
      } catch (e) {
        toast(e.message, 'warn');
      }
    }
    if (files.length > room) toast(`Up to ${LIMITS.photos} photos — the first ${room} were added.`, 'warn');
    set({ photos: [...draft.photos, ...next] });
  };
  const addClip = (file) => {
    try {
      set({ clip: prepareClip(file) });
    } catch (e) {
      toast(e.message, 'warn');
    }
  };

  const reveal = order?.reveal || null;
  const mode = reveal ? 'update' : 'create';
  const publishAt = draft.when === 'later' && draft.at ? new Date(draft.at) : null;
  const problem = !draft.to.trim()
    ? 'Add the recipient’s name.'
    : !draft.from.trim()
      ? 'Add your name.'
      : !draft.message.trim() && !draft.photos.length
        ? 'Add a message or at least one photo.'
        : draft.when === 'later' && !publishAt
          ? 'Choose the date and time it should open.'
          : publishAt && publishAt.getTime() > Date.now() + 120 * 864e5
            ? 'Please choose a time within the next 120 days.'
            : '';
  const data = { to: draft.to.trim(), from: draft.from.trim(), occasion: draft.occasion, message: draft.message.trim(), theme: draft.theme, sound: draft.sound, photos: draft.photos, clip: draft.clip, gifts: order?.gifts || [] };

  const save = async () => {
    if (problem) return toast(problem, 'warn');
    setBusy(0.02);
    try {
      const res = await saveReveal(order.session, mode, { ...data, publishAt: publishAt && publishAt.getTime() > Date.now() ? publishAt.toISOString() : null }, (p) => setBusy(Math.max(0.02, p)));
      setOrder((o) => ({ ...o, reveal: res.reveal }));
      setDraft(fromReveal(res.reveal));
      setDirty(false);
      setJustSaved(true);
      toast(res.created ? 'Your Gift Reveal is ready.' : 'Changes saved.', 'ok');
      top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      if (e.code === 'session') {
        setOrder(null);
        setErr('For your security, please confirm your order details again — your changes are kept.');
      } else if (e.code === 'exists' && e.payload?.reveal) {
        // Created a moment ago from another device or tab: switch to editing it.
        setOrder((o) => ({ ...o, reveal: e.payload.reveal }));
        toast('This order already has a Gift Reveal — you can edit it here. Your words are kept; press Save changes to apply them.', 'warn');
      } else if (e.code === 'missing') {
        setOrder((o) => ({ ...o, reveal: null }));
        toast(e.message, 'warn');
      } else if (e.payload?.state) {
        setOrder({ state: e.payload.state, hasReveal: !!reveal });
      } else toast(e.message, 'warn');
    } finally {
      setBusy(0);
    }
  };

  const minAt = toLocalInput(Date.now() + 5 * 60e3);
  const maxAt = toLocalInput(Date.now() + 120 * 864e5);

  return (
    <>
      <Seo title="Gift Reveal — A Digital Unboxing for Your Order" description="Ordered a JHAYRA gift? Send a private digital reveal before it arrives — your photos, your words and the gift itself, opened with a link or QR code." path="/gift-reveal" />
      <div className="wrap gr" ref={top}>
        <header className="gr-hero">
          <span className="eyebrow">Gift Reveal</span>
          <h1 className="h1" style={{ marginTop: 12 }}>
            Let them open it <em>twice.</em>
          </h1>
          <p className="lead" style={{ marginTop: 10, maxWidth: 640 }}>
            Ordered a JHAYRA gift for someone? Before it arrives, send them a private digital reveal — your words, your photos, and the very gift you chose. One reveal per order, open until it’s delivered.
          </p>
        </header>

        {!order ? (
          <section className="gr-card gr-verify" style={{ marginTop: 22 }}>
            <h2>Find your order</h2>
            <p className="gr-hint">Enter the order number from your confirmation and the mobile number you used at checkout.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                verify();
              }}
            >
              <label className="gr-field">
                Order number
                <input className="input" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="JHY-20261030-123456" autoComplete="off" autoCapitalize="characters" spellCheck={false} required />
              </label>
              <label className="gr-field">
                Mobile number
                <input className="input" value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" required />
              </label>
              {err && (
                <p className="gr-err" role="alert">
                  {err}
                </p>
              )}
              <button className="btn btn-gold btn-lg btn-block" disabled={verifying}>
                {verifying ? 'Checking…' : 'Continue'} {!verifying && <Icon name="arrow" size={17} />}
              </button>
              <p className="gr-private">
                <Icon name="lock" size={16} />
                <span>We only use these to confirm the order is yours. Nothing about your order is shown until it’s confirmed, and the reveal link never contains your order or contact details.</span>
              </p>
              <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
                Haven’t ordered yet? <Link to="/shop">Browse wall art</Link> or <Link to="/customize">personalise a frame</Link> — you can create the reveal after checkout.
              </p>
            </form>
          </section>
        ) : order.state !== 'active' ? (
          <section className="gr-card gr-verify" style={{ marginTop: 22, textAlign: 'center' }}>
            <h2>{(CLOSED[order.state] || CLOSED.cancelled)[0]}</h2>
            <p className="gr-hint" style={{ marginTop: 8 }}>
              {(CLOSED[order.state] || CLOSED.cancelled)[1]}
              {order.hasReveal && order.state !== 'unpaid' ? ' Its Gift Reveal has been closed.' : ''}
            </p>
            <div className="grv-actions">
              <button className="btn btn-ghost" onClick={() => setOrder(null)}>
                Check another order
              </button>
              <a className="btn btn-ghost" href={waLink(`Hi JHAYRA! I have a question about the Gift Reveal for order ${orderNumber.trim().toUpperCase()}.`)} target="_blank" rel="noopener noreferrer">
                <WhatsAppGlyph size={16} /> Ask us
              </a>
            </div>
          </section>
        ) : (
          <div className="gr-grid" style={{ marginTop: 22 }}>
            <div>
              <section className="gr-card gr-order">
                <div className="gr-order-head">
                  <h2 style={{ margin: 0 }}>
                    Order {order.orderNumber || orderNumber.toUpperCase()}
                  </h2>
                  {order.orderStatus && <span className="gr-badge">{STATUS[order.orderStatus] || order.orderStatus}</span>}
                </div>
                <p className="gr-hint" style={{ margin: 0 }}>
                  {order.gifts.length > 1 ? `These ${order.gifts.length} gifts` : 'This gift'} will be revealed exactly as ordered.
                </p>
                <div className="gr-items">
                  {order.gifts.map((g, i) => (
                    <div className="gr-item" key={i}>
                      <GiftPiece gift={g} />
                    </div>
                  ))}
                </div>
              </section>

              {reveal && justSaved && <ShareCard reveal={reveal} to={draft.to} />}

              <section className="gr-card">
                <h2>
                  <small>1</small>Who is it for?
                </h2>
                <div className="gr-row two" style={{ marginTop: 12 }}>
                  <label className="gr-field">
                    Their name
                    <input className="input" value={draft.to} maxLength={LIMITS.name} onChange={(e) => set({ to: e.target.value })} placeholder="The person opening it" autoComplete="off" />
                  </label>
                  <label className="gr-field">
                    Your name
                    <input className="input" value={draft.from} maxLength={LIMITS.name} onChange={(e) => set({ from: e.target.value })} placeholder="How they know you" autoComplete="off" />
                  </label>
                </div>
                <div className="gr-field" style={{ marginTop: 14 }}>
                  Occasion
                  <div className="gr-chips" role="group" aria-label="Occasion">
                    {OCCASIONS.map((o) => (
                      <button key={o} type="button" aria-pressed={draft.occasion === o} onClick={() => set({ occasion: o })}>
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
                  <textarea className="input" rows={5} value={draft.message} maxLength={LIMITS.message} onChange={(e) => set({ message: e.target.value })} placeholder="Write what this memory means to you…" aria-label="Your message" />
                  <small>
                    {draft.message.length}/{LIMITS.message}
                  </small>
                </label>
              </section>

              <section className="gr-card">
                <h2>
                  <small>3</small>Photos, and a voice or video
                </h2>
                <p className="gr-hint">
                  Up to {LIMITS.photos} photos. Optional: one video or voice note (up to {LIMITS.clipMB} MB; recordings up to {LIMITS.voiceSeconds} seconds).
                </p>
                <div className="gr-photos">
                  {draft.photos.map((p, i) => (
                    <div key={p.path || p.url} className="gr-photo">
                      <img src={p.url} alt={`Photo ${i + 1}`} />
                      <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => set({ photos: draft.photos.filter((x) => x !== p) })}>
                        <Icon name="close" size={14} />
                      </button>
                    </div>
                  ))}
                  {draft.photos.length < LIMITS.photos && (
                    <button type="button" className="gr-add" onClick={() => fileRef.current?.click()}>
                      <Icon name="plus" size={20} />
                      Add photo
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => (addPhotos(e.target.files), (e.target.value = ''))} />
                <div className="gr-clip">
                  {draft.clip ? (
                    <>
                      {draft.clip.kind === 'video' ? <video src={draft.clip.url} controls playsInline preload="metadata" /> : <audio src={draft.clip.url} controls />}
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => set({ clip: null })}>
                        <Icon name="trash" size={14} /> Remove {draft.clip.kind === 'video' ? 'video' : 'voice note'}
                      </button>
                    </>
                  ) : (
                    <>
                      <VoiceRecorder onDone={(clip) => set({ clip })} />
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => clipRef.current?.click()}>
                        <Icon name="upload" size={15} /> Add a video or audio file
                      </button>
                    </>
                  )}
                </div>
                <input ref={clipRef} type="file" accept="video/*,audio/*" hidden onChange={(e) => (e.target.files[0] && addClip(e.target.files[0]), (e.target.value = ''))} />
              </section>
            </div>

            <aside className="gr-side">
              <section className="gr-card">
                <h2>
                  <small>4</small>Choose the reveal
                </h2>
                <div className="gr-themes" role="group" aria-label="Reveal theme" style={{ marginTop: 12 }}>
                  {THEMES.map((t) => (
                    <button key={t.id} type="button" className="gr-theme" aria-pressed={draft.theme === t.id} onClick={() => set({ theme: t.id })}>
                      <ThemeSwatch id={t.id} />
                      <b>{t.name}</b>
                      <small>{t.line}</small>
                    </button>
                  ))}
                </div>
                <label className="gr-toggle" style={{ marginTop: 12 }}>
                  <input type="checkbox" checked={draft.sound} onChange={(e) => set({ sound: e.target.checked })} />
                  Soft chime when it opens <span className="muted">(they can mute it)</span>
                </label>
              </section>

              <section className="gr-card gr-when">
                <h2>
                  <small>5</small>When can they open it?
                </h2>
                <div className="gr-chips" role="group" aria-label="When it opens">
                  <button type="button" aria-pressed={draft.when === 'now'} onClick={() => set({ when: 'now' })}>
                    As soon as I share it
                  </button>
                  <button type="button" aria-pressed={draft.when === 'later'} onClick={() => set({ when: 'later', at: draft.at || toLocalInput(Date.now() + 864e5) })}>
                    At a time I choose
                  </button>
                </div>
                {draft.when === 'later' && (
                  <label className="gr-field">
                    Opens on
                    <input className="input" type="datetime-local" value={draft.at} min={minAt} max={maxAt} onChange={(e) => set({ at: e.target.value })} />
                  </label>
                )}
                <p className="gr-hint" style={{ margin: 0 }}>
                  Until then the link shows a countdown. The reveal closes when the order is delivered, even if that’s before the time you choose.
                </p>
              </section>

              <section className="gr-card gr-cta">
                <button type="button" className="btn btn-ghost btn-lg btn-block" onClick={() => (problem && !/time|date/.test(problem) ? toast(problem, 'warn') : setPreview(true))}>
                  <Icon name="eye" size={18} /> Preview the reveal
                </button>
                <button type="button" className="btn btn-gold btn-lg btn-block" onClick={save} disabled={!!busy || (mode === 'update' && !dirty)}>
                  {busy ? 'Saving…' : mode === 'create' ? 'Create my Gift Reveal' : dirty ? 'Save changes' : 'Saved'} {!busy && mode === 'create' && <Icon name="arrow" size={17} />}
                </button>
                {!!busy && (
                  <div className="gr-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(busy * 100)}>
                    <i style={{ width: `${Math.round(busy * 100)}%` }} />
                  </div>
                )}
                <p className="gr-lock">
                  <Icon name="lock" size={16} />
                  <span>
                    {mode === 'create'
                      ? 'One Gift Reveal per order. After you create it, you can keep editing it until the order is delivered.'
                      : `Created ${fmt(reveal.created_at)}${reveal.updated_at !== reveal.created_at ? ` · last edited ${fmt(reveal.updated_at)}` : ''}. Edits apply to the same link.`}
                  </span>
                </p>
              </section>

              {reveal && !justSaved && <ShareCard reveal={reveal} to={draft.to} />}
            </aside>
          </div>
        )}
      </div>
      {preview && createPortal(<RevealExperience data={data} preview onClose={() => setPreview(false)} />, document.body)}
    </>
  );
}
