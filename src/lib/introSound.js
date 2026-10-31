// Sound for the opening, synthesised with Web Audio (no files to download).
// Off by default; it only starts after the visitor taps the sound button.
export function createIntroSound() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return { setOn() {}, cue() {}, fade() {}, stop() {} };
  let ctx = null;
  let master = null;
  let on = false;
  let pad = [];

  const noise = (secs) => {
    const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * secs), ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource();
    s.buffer = b;
    return s;
  };
  const env = (g, t, a, peak, d) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  };

  // Soft metallic tick: filtered noise + a short brass ping.
  const tick = (t, f = 3200, peak = 0.12) => {
    const n = noise(0.06);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f;
    bp.Q.value = 9;
    const g = ctx.createGain();
    env(g, t, 0.002, peak, 0.05);
    n.connect(bp).connect(g).connect(master);
    n.start(t);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f * 0.56;
    const og = ctx.createGain();
    env(og, t, 0.003, peak * 0.35, 0.22);
    o.connect(og).connect(master);
    o.start(t);
    o.stop(t + 0.3);
  };
  // The bolt releasing: a deeper clunk.
  const clunk = (t) => {
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(190, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.25);
    const g = ctx.createGain();
    env(g, t, 0.004, 0.22, 0.3);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.4);
    tick(t + 0.01, 2100, 0.14);
  };
  // Heavy gates: low swelling air and a gentle wooden groan.
  const gates = (t) => {
    const n = noise(2.2);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(220, t);
    lp.frequency.linearRampToValueAtTime(900, t + 1.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.6);
    g.gain.linearRampToValueAtTime(0.0001, t + 2.1);
    n.connect(lp).connect(g).connect(master);
    n.start(t);
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(62, t);
    o.frequency.linearRampToValueAtTime(48, t + 1.3);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 340;
    bp.Q.value = 6;
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.linearRampToValueAtTime(0.025, t + 0.4);
    og.gain.linearRampToValueAtTime(0.0001, t + 1.4);
    o.connect(bp).connect(og).connect(master);
    o.start(t);
    o.stop(t + 1.5);
  };
  // Soft transition breath between rooms.
  const whoosh = (t, peak = 0.05) => {
    const n = noise(0.8);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(380, t);
    bp.frequency.exponentialRampToValueAtTime(1500, t + 0.6);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.25);
    g.gain.linearRampToValueAtTime(0.0001, t + 0.7);
    n.connect(bp).connect(g).connect(master);
    n.start(t);
  };
  // A warm ambient chord underneath everything.
  const startPad = () => {
    const t = ctx.currentTime;
    pad = [110, 164.81, 220, 277.18].map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i % 2 ? 'triangle' : 'sine';
      o.frequency.value = f;
      o.detune.value = (i - 1.5) * 4;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.018 / (i + 1), t + 1.6);
      o.connect(lp).connect(g).connect(master);
      o.start(t);
      return { o, g };
    });
  };

  const cues = {
    trace: () => tick(ctx.currentTime, 4200, 0.05),
    turn: () => {
      const t = ctx.currentTime;
      tick(t, 3000, 0.1);
      tick(t + 0.16, 3300, 0.1);
      clunk(t + 0.42);
    },
    open: () => gates(ctx.currentTime),
    through: () => whoosh(ctx.currentTime, 0.06),
    bedroom: () => whoosh(ctx.currentTime),
    dining: () => whoosh(ctx.currentTime),
    hall: () => whoosh(ctx.currentTime),
    brand: () => tick(ctx.currentTime, 5200, 0.04),
  };

  return {
    setOn(v) {
      on = v;
      if (v && !ctx) {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.9;
        master.connect(ctx.destination);
        startPad();
      }
      if (!ctx) return;
      if (v) ctx.resume();
      master.gain.setTargetAtTime(v ? 0.9 : 0, ctx.currentTime, 0.08);
    },
    cue(step) {
      if (on && ctx && cues[step]) {
        try {
          cues[step]();
        } catch {}
      }
    },
    fade() {
      if (ctx && master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
    },
    stop() {
      if (!ctx) return;
      const c = ctx;
      setTimeout(() => {
        pad.forEach(({ o }) => {
          try {
            o.stop();
          } catch {}
        });
        c.close().catch(() => {});
      }, 900);
    },
  };
}
