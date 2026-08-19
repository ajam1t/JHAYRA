import { useState, useRef } from 'react';

/* Shared photo crop / zoom / reposition modal.
   Produces a transform { zoom, panX, panY } consumed by FramedArt.
   Used by the Customize scratch builder / template wizard and by the product
   page "Replace Image" flow. */
export default function PhotoEditModal({ photo, slotLabel = 'Your Photo', initial, onConfirm, onClose }) {
  const [state, setState] = useState({
    zoom: initial?.zoom ?? 1,
    panX: initial?.panX ?? 0,
    panY: initial?.panY ?? 0,
  });
  const containerRef = useRef(null);
  const dragRef = useRef(null);

  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    dragRef.current = { lastX: e.clientX, lastY: e.clientY };
    if (containerRef.current) containerRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
    const cw = containerRef.current?.offsetWidth || 320;
    const ch = containerRef.current?.offsetHeight || 400;
    setState(prev => ({
      ...prev,
      panX: prev.panX + dx / (cw * prev.zoom),
      panY: prev.panY + dy / (ch * prev.zoom),
    }));
  };

  const handlePointerUp = () => { dragRef.current = null; };
  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };
  const containerW = 'min(320px, 85vw)';

  return (
    <div className="photo-editor-overlay" onClick={handleOverlayClick}>
      <div className="photo-editor-title">Adjust Photo · {slotLabel}</div>
      <div
        ref={containerRef}
        className="photo-editor-container"
        style={{ width: containerW, aspectRatio: '4/5' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <img
          src={photo}
          alt={slotLabel}
          className="photo-editor-img"
          style={{
            transform: `scale(${state.zoom}) translate(${state.panX * 100}%, ${state.panY * 100}%)`,
            transformOrigin: 'center',
          }}
        />
        <div className="photo-editor-guide" />
      </div>
      <div className="photo-editor-zoom" onClick={e => e.stopPropagation()}>
        <span style={{ fontSize: '.75rem' }}>Zoom</span>
        <input
          type="range" min={1} max={4} step={0.05}
          value={state.zoom}
          onChange={e => setState(prev => ({ ...prev, zoom: +e.target.value }))}
        />
        <span style={{ fontSize: '.75rem', minWidth: '2.5rem', textAlign: 'right' }}>{state.zoom.toFixed(1)}×</span>
      </div>
      <div className="photo-editor-actions" onClick={e => e.stopPropagation()}>
        <button className="photo-editor-btn reset"   onClick={() => setState({ zoom: 1, panX: 0, panY: 0 })}>Reset</button>
        <button className="photo-editor-btn cancel"  onClick={onClose}>Cancel</button>
        <button className="photo-editor-btn confirm" onClick={() => { onConfirm(state); onClose(); }}>Done ✓</button>
      </div>
    </div>
  );
}
