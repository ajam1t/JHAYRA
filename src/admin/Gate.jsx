import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon';

// Welcome gate shown before the sign-in form: the founder's portrait and a
// 4-digit PIN. It is a personal welcome, not a security layer — access is
// still protected by the Supabase email/password sign-in and the admin role.
// Only a hash of the PIN is kept in the code.
const PIN_HASH = 'cd09e9982b65d45fe1d9544b81fbe77cb7c50d02ce8c1ab32324f2a93704bcd8';
export const GATE_KEY = 'jh_gate_ok';

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export default function Gate({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [state, setState] = useState(''); // '' | 'bad' | 'ok'
  const busy = useRef(false);

  const push = (d) => {
    if (busy.current || state === 'ok') return;
    setState('');
    setPin((p) => (d === 'del' ? p.slice(0, -1) : p.length < 4 ? p + d : p));
  };

  useEffect(() => {
    if (pin.length !== 4) return;
    busy.current = true;
    sha256(`jhayra-gate:${pin}`).then((h) => {
      if (h === PIN_HASH) {
        setState('ok');
        try {
          sessionStorage.setItem(GATE_KEY, '1');
        } catch {}
        setTimeout(onUnlock, 900);
      } else {
        setState('bad');
        if (navigator.vibrate) navigator.vibrate(120);
        setTimeout(() => {
          setPin('');
          busy.current = false;
        }, 650);
      }
    });
  }, [pin, onUnlock]);

  useEffect(() => {
    const onKey = (e) => {
      if (/^\d$/.test(e.key)) push(e.key);
      else if (e.key === 'Backspace') push('del');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className={`gt ${state}`}>
      <div className="gt-portrait">
        <span className="gt-ring" aria-hidden="true" />
        <span className="gt-ring gt-ring2" aria-hidden="true" />
        <img src="/founder/sandeep-jha.webp" alt="Sandeep Jha" width="180" height="180" />
        <span className="gt-scan" aria-hidden="true" />
      </div>
      <p className="gt-hello">Welcome back</p>
      <h1 className="gt-name">Sandeep</h1>
      <p className="gt-role">
        <span>CEO</span> · JHAYRA
      </p>
      <p className="gt-prompt" id="gt-prompt">
        {state === 'bad' ? 'Incorrect PIN — try again' : state === 'ok' ? 'Unlocked' : 'Enter your PIN'}
      </p>
      <div className="gt-dots" role="status" aria-live="polite" aria-label={`${pin.length} of 4 digits entered`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < pin.length ? 'on' : ''} />
        ))}
      </div>
      <div className="gt-pad" role="group" aria-labelledby="gt-prompt">
        {KEYS.map((k, i) =>
          k ? (
            <button key={i} type="button" className={k === 'del' ? 'gt-del' : ''} onClick={() => push(k)} aria-label={k === 'del' ? 'Delete digit' : k}>
              {k === 'del' ? <Icon name="arrowL" size={20} /> : k}
            </button>
          ) : (
            <span key={i} aria-hidden="true" />
          ),
        )}
      </div>
    </div>
  );
}
