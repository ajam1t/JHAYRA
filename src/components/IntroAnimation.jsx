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
  const [running, setRunning] = useState(false);
  const [phase,   setPhase]   = useState('s1');
  const [muted,   setMuted]   = useState(false);

  const mutedRef  = useRef(false);
  const masterRef = useRef(null);
  const ctxRef    = useRef(null);
  const skipRef   = useRef(null);

  useEffect(() => {
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

    skipRef.current = cancelAll;

    try { if (sessionStorage.getItem(SESSION_KEY)) return; } catch { /* private mode */ }

    setRunning(true);
    setPhase('s1');

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

    function runSequence(audioCtx) {
      startAmbient(audioCtx);
      schedule(() => setPhase('s2'), 1750);
      schedule(() => {
        setPhase('exit');
        doSpeak();
        fadeAmbient(audioCtx);
      }, 3350);
      schedule(() => {
        setRunning(false);
        try { sessionStorage.setItem(SESSION_KEY, '1'); } catch {}
      }, 4300);
    }

    // Always start immediately — skip audio if AudioContext is suspended (mobile browsers)
    runSequence(ctx && ctx.state !== 'suspended' ? ctx : null);

    return () => {
      cancelAll();
      try { speechSynthesis?.cancel(); } catch {}
      if (ctx) { try { ctx.close(); } catch {} }
      masterRef.current = null;
      ctxRef.current    = null;
    };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

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

  function onSkip(e) {
    if (e.target.closest('.jhintro-mute')) return;
    skipRef.current?.();
    try { speechSynthesis?.cancel(); } catch {}
    if (masterRef.current && ctxRef.current)
      masterRef.current.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 0.5);
    setPhase('exit');
    setTimeout(() => {
      setRunning(false);
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch {}
    }, 900);
  }

  if (!running) return null;

  return (
    <div
      className={`jhintro${phase === 'exit' ? ' jhintro-exit' : ''}`}
      onClick={onSkip}
      role="presentation"
      aria-hidden="true"
    >
      <div className="jhintro-grain" />
      <div className="jhintro-vignette" />

      {/* Scene 1 — Tagline */}
      <div className={`jhintro-scene${phase === 's1' ? ' jhintro-in' : ''}`}>
        <p className="jhintro-tag1">Some memories deserve to be</p>
        <p className="jhintro-tag2">more than a photo.</p>
      </div>

      {/* Scene 2 — Logo */}
      <div className={`jhintro-scene${phase === 's2' ? ' jhintro-in' : ''}`}>
        <div className="jhintro-rule" />
        <h1 className="jhintro-logo">JHAYRA</h1>
        <div className="jhintro-rule" />
        <p className="jhintro-sub">Crafting Memories Into Art</p>
      </div>

      {/* Mute */}
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

      <span className="jhintro-skip">Tap anywhere to skip</span>
    </div>
  );
}
