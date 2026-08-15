import { useEffect, useRef, useState } from 'react';

const SESSION_KEY = 'jhayra_intro_v1';

function pickVoice() {
  if (!window.speechSynthesis) return null;
  const all = speechSynthesis.getVoices();
  const prefer = [
    'Samantha','Karen','Moira','Allison','Ava','Victoria','Fiona','Serena',
    'Google UK English Female','Google US English',
    'Microsoft Zira','Microsoft Aria','Microsoft Jenny',
  ];
  for (const name of prefer) {
    const v = all.find(v => v.name.includes(name) && v.lang.startsWith('en'));
    if (v) return v;
  }
  return all.find(v => v.lang.startsWith('en')) || null;
}

export default function IntroAnimation() {
  const [running,   setRunning]   = useState(false);
  const [phase,     setPhase]     = useState('s1');   // s1 | s2 | exit
  const [tapNeeded, setTapNeeded] = useState(false);
  const [muted,     setMuted]     = useState(false);

  const mutedRef    = useRef(false);
  const masterRef   = useRef(null);   // Web Audio master gain — for mute toggle
  const ctxRef      = useRef(null);   // Web Audio context — for mute toggle
  const skipRef     = useRef(null);   // called by onSkip to cancel pending timers
  const tapStartRef = useRef(null);   // called by onTap to start sequence

  useEffect(() => {
    /* ── StrictMode-safe: use a local active flag + local timer list.
       On StrictMode double-invocation: cleanup sets active=false and clears
       the first run's timers; second run creates fresh ones. ── */
    let active = true;
    const localTimers = [];

    function schedule(fn, ms) {
      const id = setTimeout(() => { if (active) fn(); }, ms);
      localTimers.push(id);
    }

    function cancelAll() {
      active = false;
      localTimers.forEach(clearTimeout);
    }

    // Expose cancel to skip handler
    skipRef.current = cancelAll;

    try { if (sessionStorage.getItem(SESSION_KEY)) return; } catch { /* private mode */ }

    setRunning(true);
    setPhase('s1');
    setTapNeeded(false);

    // ── Web Audio: warm ambient chord ──────────────────────────
    let ctx = null;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
    } catch { /* browser without Web Audio */ }

    function startAmbient(c) {
      if (!c || mutedRef.current) return;
      const master = c.createGain();
      master.gain.setValueAtTime(0, c.currentTime);
      master.gain.linearRampToValueAtTime(0.038, c.currentTime + 1.3);
      master.connect(c.destination);
      masterRef.current = master;

      // A2 + E3 + A3 — warm, calm, cinematic minor chord
      [[110, 0.55], [164.8, 0.27], [220, 0.17]].forEach(([hz, vol]) => {
        const osc = c.createOscillator();
        const lpf = c.createBiquadFilter();
        const g   = c.createGain();
        osc.type = 'sine';
        osc.frequency.value = hz;
        lpf.type = 'lowpass';
        lpf.frequency.value = 480;
        lpf.Q.value = 0.35;
        g.gain.value = vol;
        osc.connect(lpf);
        lpf.connect(g);
        g.connect(master);
        osc.start();
      });
    }

    function fadeAmbient(c) {
      if (!masterRef.current || !c) return;
      masterRef.current.gain.linearRampToValueAtTime(0, c.currentTime + 0.9);
    }

    // ── Web Speech: voice ───────────────────────────────────────
    function doSpeak() {
      if (mutedRef.current || !window.speechSynthesis) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance('Welcome to Jhayra dot com');
      u.rate   = 0.80;
      u.pitch  = 0.90;
      u.volume = 0.90;
      const go = () => {
        const v = pickVoice();
        if (v) u.voice = v;
        speechSynthesis.speak(u);
      };
      if (speechSynthesis.getVoices().length > 0) go();
      else speechSynthesis.addEventListener('voiceschanged', go, { once: true });
    }

    // ── Sequence: scene timings ─────────────────────────────────
    function runSequence(audioCtx) {
      startAmbient(audioCtx);

      schedule(() => setPhase('s2'), 1750);           // s1 → s2

      schedule(() => {                                 // s2 → exit + voice
        setPhase('exit');
        doSpeak();
        fadeAmbient(audioCtx);
      }, 3350);

      schedule(() => {                                 // unmount overlay
        setRunning(false);
        try { sessionStorage.setItem(SESSION_KEY, '1'); } catch {}
      }, 4300);
    }

    // ── Start: try audio, fall back to tap ──────────────────────
    if (ctx && ctx.state === 'suspended') {
      setTapNeeded(true);
      tapStartRef.current = () => {
        if (!active) return;
        ctx.resume()
          .then(() => runSequence(ctx))
          .catch(() => runSequence(null));
      };
    } else {
      tapStartRef.current = null;
      runSequence(ctx);
    }

    return () => {
      cancelAll();
      try { speechSynthesis?.cancel(); } catch {}
      if (ctx) { try { ctx.close(); } catch {} }
      masterRef.current = null;
      ctxRef.current    = null;
    };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tap to enter (mobile audio unlock) ────────────────────────
  function onTap() {
    if (!tapNeeded) return;
    setTapNeeded(false);
    tapStartRef.current?.();
  }

  // ── Mute / unmute ─────────────────────────────────────────────
  function toggleMute() {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next) {
      try { speechSynthesis?.cancel(); } catch {}
      if (masterRef.current && ctxRef.current)
        masterRef.current.gain.setValueAtTime(0, ctxRef.current.currentTime);
    } else {
      if (masterRef.current && ctxRef.current)
        masterRef.current.gain.setValueAtTime(0.038, ctxRef.current.currentTime);
    }
  }

  // ── Click anywhere to skip ────────────────────────────────────
  function onSkip(e) {
    if (tapNeeded) { onTap(); return; }
    if (e.target.closest('.jhintro-mute') || e.target.closest('.jhintro-tap')) return;
    skipRef.current?.();
    try { speechSynthesis?.cancel(); } catch {}
    if (masterRef.current && ctxRef.current) fadeGain(0);
    setPhase('exit');
    setTimeout(() => {
      setRunning(false);
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch {}
    }, 900);
  }

  function fadeGain(target) {
    if (!masterRef.current || !ctxRef.current) return;
    masterRef.current.gain.linearRampToValueAtTime(target, ctxRef.current.currentTime + 0.5);
  }

  if (!running) return null;

  return (
    <div
      className={`jhintro${phase === 'exit' ? ' jhintro-exit' : ''}`}
      onClick={onSkip}
      role="presentation"
      aria-hidden="true"
    >
      {/* Film grain */}
      <div className="jhintro-grain" />
      {/* Edge vignette */}
      <div className="jhintro-vignette" />

      {/* ── Scene 1 — Tagline ── */}
      <div className={`jhintro-scene${phase === 's1' ? ' jhintro-in' : ''}`}>
        <p className="jhintro-tag1">Some memories deserve to be</p>
        <p className="jhintro-tag2">more than a photo.</p>
      </div>

      {/* ── Scene 2 — Logo ── */}
      <div className={`jhintro-scene${phase === 's2' ? ' jhintro-in' : ''}`}>
        <div className="jhintro-rule" />
        <h1 className="jhintro-logo">JHAYRA</h1>
        <div className="jhintro-rule" />
        <p className="jhintro-sub">Crafting Memories Into Art</p>
      </div>

      {/* ── Tap to enter (mobile audio block) ── */}
      {tapNeeded && (
        <button className="jhintro-tap" onClick={onTap} aria-label="Tap to enter">
          <span className="jhintro-tap-pulse" />
          <span className="jhintro-tap-pulse jhintro-tap-pulse2" />
          <span className="jhintro-tap-core" />
          <span className="jhintro-tap-lbl">Tap to enter</span>
        </button>
      )}

      {/* ── Mute / unmute ── */}
      {!tapNeeded && (
        <button
          className="jhintro-mute"
          onClick={e => { e.stopPropagation(); toggleMute(); }}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
          )}
        </button>
      )}

      {/* Skip hint */}
      {!tapNeeded && (
        <span className="jhintro-skip">Click anywhere to skip</span>
      )}
    </div>
  );
}
