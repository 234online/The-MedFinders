import "./FloatingButton.css";

// A round glass button that floats over the map.
//   icon     path to an image in the public folder, e.g. "/info-icon.svg"
//   position "top-right" | "bottom-right" (add more in FloatingButton.css)
//   active   shows a small green dot (used when logged in)
export default function FloatingButton({ icon, label, onClick, position, active = false }) {
  return (
    <button
      type="button"
      className={`floating-btn ${position}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <img src={icon} alt="" />
      {active && <span className="floating-dot" />}
    </button>
  );
}
