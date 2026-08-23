'use client';
export default function Modal({ open, onClose, width, children }) {
  if (!open) return null;
  return (
    <div
      className="modal-overlay open"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="modal" style={width ? { width } : undefined}>
        {children}
      </div>
    </div>
  );
}
