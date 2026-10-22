import { useEffect, useRef, useState } from 'react';
import RoomScene, { WALLS, FURNITURE } from './RoomScene';
import Frame from './Frame';
import Icon from './Icon';
import { useToast } from '../state/store';

const A4 = { w: 8.27, h: 11.69 };

/* ── Live camera: hang the frame on your real wall ───────────────────── */
export function CameraWall({ src, children, wIn, hIn, colour, onClose }) {
  const video = useRef(null);
  const stage = useRef(null);
  const [err, setErr] = useState('');
  const [step, setStep] = useState('calibrate'); // calibrate → place
  const [a4w, setA4w] = useState(110); // on-screen px width of the A4 guide
  const [pos, setPos] = useState({ x: 0.5, y: 0.42 });
  const [shot, setShot] = useState(null);
  const drag = useRef(null);
  const pinch = useRef(new Map());
  const pinchStart = useRef(null);
  const toast = useToast();

  useEffect(() => {
    let stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 } }, audio: false });
        if (video.current) {
          video.current.srcObject = stream;
          await video.current.play().catch(() => {});
        }
      } catch {
        setErr('We couldn’t open your camera. Please allow camera access, or use “My wall photo” instead.');
      }
    })();
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  // px per inch from the calibrated A4 sheet
  const ppi = a4w / A4.w;
  const fw = wIn * ppi;

  const down = (e) => {
    pinch.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY };
  };
  const move = (e) => {
    if (!pinch.current.has(e.pointerId)) return;
    pinch.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = stage.current.getBoundingClientRect();
    if (pinch.current.size === 2) {
      const [a, b] = [...pinch.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (!pinchStart.current) pinchStart.current = { d, a4w };
      else setA4w(Math.max(30, Math.min(r.width * 0.9, (pinchStart.current.a4w * d) / pinchStart.current.d)));
      return;
    }
    if (!drag.current) return;
    const dx = (e.clientX - drag.current.x) / r.width;
    const dy = (e.clientY - drag.current.y) / r.height;
    drag.current = { x: e.clientX, y: e.clientY };
    setPos((p) => ({ x: Math.max(0.05, Math.min(0.95, p.x + dx)), y: Math.max(0.05, Math.min(0.95, p.y + dy)) }));
  };
  const up = (e) => {
    pinch.current.delete(e.pointerId);
    if (pinch.current.size < 2) pinchStart.current = null;
    if (!pinch.current.size) drag.current = null;
  };

  const capture = async () => {
    const v = video.current;
    const st = stage.current;
    if (!v || !st) return;
    const r = st.getBoundingClientRect();
    const c = document.createElement('canvas');
    c.width = r.width * 2;
    c.height = r.height * 2;
    const ctx = c.getContext('2d');
    // cover-fit the video
    const vr = v.videoWidth / v.videoHeight;
    const sr = r.width / r.height;
    let sw = v.videoWidth;
    let sh = v.videoHeight;
    if (vr > sr) sw = sh * sr;
    else sh = sw / sr;
    ctx.drawImage(v, (v.videoWidth - sw) / 2, (v.videoHeight - sh) / 2, sw, sh, 0, 0, c.width, c.height);
    // frame
    const W = fw * 2;
    const H = (fw * (hIn / wIn)) * 2;
    const x = pos.x * c.width - W / 2;
    const y = pos.y * c.height - H / 2;
    ctx.shadowColor = 'rgba(0,0,0,.35)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 14;
    ctx.fillStyle = colour;
    ctx.fillRect(x, y, W, H);
    ctx.shadowColor = 'transparent';
    const t = W * 0.046;
    if (src) {
      await new Promise((res) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const iw = W - 2 * t;
          const ih = H - 2 * t;
          const ir = img.width / img.height;
          let w2 = img.width;
          let h2 = img.height;
          if (ir > iw / ih) w2 = h2 * (iw / ih);
          else h2 = w2 / (iw / ih);
          ctx.drawImage(img, (img.width - w2) / 2, (img.height - h2) / 2, w2, h2, x + t, y + t, iw, ih);
          res();
        };
        img.onerror = res;
        img.src = src.startsWith('http') ? `https://wsrv.nl/?url=${encodeURIComponent(src)}&w=900&output=jpg` : src;
      });
    }
    try {
      setShot(c.toDataURL('image/jpeg', 0.9));
    } catch {
      toast('Could not save the photo on this device.', 'warn');
    }
  };

  const share = async () => {
    if (!shot) return;
    try {
      const blob = await (await fetch(shot)).blob();
      const file = new File([blob], 'jhayra-on-my-wall.jpg', { type: 'image/jpeg' });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'How does this look on our wall?' });
      else {
        const a = document.createElement('a');
        a.href = shot;
        a.download = 'jhayra-on-my-wall.jpg';
        a.click();
      }
    } catch {}
  };

  return (
    <div className="cam" role="dialog" aria-modal="true" aria-label="See it on your wall with your camera">
      <div className="cam-stage" ref={stage} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <video ref={video} playsInline muted />
        {err && <div className="cam-err">{err}</div>}
        {step === 'calibrate' && !err && (
          <div className="cam-a4" style={{ width: a4w, height: a4w * (A4.h / A4.w), left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}>
            <span>A4</span>
          </div>
        )}
        {step === 'place' && (
          <div className="cam-frame" style={{ width: fw, left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}>
            <Frame src={src} ratio={{ w: wIn, h: hIn }} colour={colour} sizes="60vw">
              {children}
            </Frame>
          </div>
        )}
        {shot && (
          <div className="cam-shot">
            <img src={shot} alt="Your wall with the frame" />
          </div>
        )}
      </div>
      <div className="cam-ui">
        <button className="icon-btn cam-close" onClick={onClose} aria-label="Close camera">
          <Icon name="close" />
        </button>
        {shot ? (
          <div className="cam-panel">
            <p>Looks good? Share it with family before you order.</p>
            <div className="row">
              <button className="btn btn-light btn-sm" onClick={() => setShot(null)}>
                Retake
              </button>
              <button className="btn btn-gold btn-sm" onClick={share}>
                Share / save
              </button>
            </div>
          </div>
        ) : step === 'calibrate' ? (
          <div className="cam-panel">
            <p>
              <b>For true size:</b> tape an A4 sheet to your wall, point the camera at it, then pinch or use the slider until the gold box matches the sheet. No paper? Skip — you can resize by eye.
            </p>
            <input type="range" min="40" max="400" value={a4w} onChange={(e) => setA4w(+e.target.value)} aria-label="Match the A4 sheet" />
            <div className="row">
              <button className="btn btn-light btn-sm" onClick={() => setStep('place')}>
                Skip
              </button>
              <button className="btn btn-gold btn-sm" onClick={() => setStep('place')}>
                Matches — show my frame
              </button>
            </div>
          </div>
        ) : (
          <div className="cam-panel">
            <p>
              Drag to move. Showing <b>{wIn} × {hIn} in</b> at real size.
            </p>
            <div className="row">
              <button className="btn btn-light btn-sm" onClick={() => setStep('calibrate')}>
                Re-calibrate
              </button>
              <button className="btn btn-gold btn-sm" onClick={capture}>
                <Icon name="camera" size={16} /> Take photo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Wall studio: room / my wall photo / live camera ──────────────────── */
export default function WallStudio({ src, children, wIn, hIn, colour, compact = false }) {
  const [mode, setMode] = useState('room');
  const [wall, setWall] = useState(WALLS[0]);
  const [furniture, setFurniture] = useState('sofa');
  const [photo, setPhoto] = useState(null);
  const [pos, setPos] = useState({ x: 0.5, y: null });
  const [scale, setScale] = useState(1);
  const [cam, setCam] = useState(false);
  const file = useRef(null);
  const canCamera = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  return (
    <div className={`studio ${compact ? 'studio-compact' : ''}`}>
      <div className="studio-tabs" role="tablist">
        <button role="tab" aria-selected={mode === 'room'} onClick={() => setMode('room')}>
          <Icon name="sofa" size={17} /> Room
        </button>
        <button
          role="tab"
          aria-selected={mode === 'mine'}
          onClick={() => {
            setMode('mine');
            if (!photo) file.current?.click();
          }}
        >
          <Icon name="image" size={17} /> My wall photo
        </button>
        {canCamera && (
          <button role="tab" aria-selected={false} onClick={() => setCam(true)}>
            <Icon name="camera" size={17} /> Live camera
          </button>
        )}
      </div>
      <RoomScene
        wall={wall}
        furniture={furniture}
        photo={mode === 'mine' ? photo : null}
        frames={[{ key: 'f', src, children, wIn, hIn, colour, x: pos.x, y: pos.y ?? (mode === 'mine' ? 0.4 : undefined), scale: mode === 'mine' ? scale : 1 }]}
        onFrameDrag={(_, x, y) => setPos({ x, y })}
      />
      <div className="studio-controls">
        {mode === 'room' ? (
          <>
            <div className="swatches" aria-label="Wall colour">
              {WALLS.map((w) => (
                <button key={w.id} className={`swatch ${wall.id === w.id ? 'on' : ''}`} style={{ background: w.c }} aria-label={`${w.label} wall`} aria-pressed={wall.id === w.id} onClick={() => setWall(w)} />
              ))}
            </div>
            <div className="chips">
              {FURNITURE.map((f) => (
                <button key={f.id} className="chip" aria-pressed={furniture === f.id} onClick={() => setFurniture(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <label className="studio-scale">
              Size on photo
              <input type="range" min="0.3" max="3" step="0.01" value={scale} onChange={(e) => setScale(+e.target.value)} />
            </label>
            <button className="chip" onClick={() => file.current?.click()}>
              <Icon name="upload" size={15} /> Change photo
            </button>
          </>
        )}
        <span className="studio-hint">
          <Icon name="move" size={15} /> Drag the frame to move it
        </span>
      </div>
      <input
        ref={file}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            setPhoto(URL.createObjectURL(f));
            setMode('mine');
          }
        }}
      />
      {cam && (
        <CameraWall src={src} wIn={wIn} hIn={hIn} colour={colour} onClose={() => setCam(false)}>
          {children}
        </CameraWall>
      )}
    </div>
  );
}
