import { useEffect } from "react";
import { TEXT } from "../config/texts.js";
import "./Modal.css";

// A window in the middle of the screen with a dark background behind it.
// Closes with the × button, the Esc key, or a click outside it.
export default function Modal({ title, onClose, children, width = 520 }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal"
        style={{ maxWidth: width }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label={TEXT.close}>
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
