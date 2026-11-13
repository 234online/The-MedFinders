import "./FloatingButton.css";

// A round glass button that floats over the map.
//   icon     path to an image in the public folder, e.g. "/info-icon.svg"
//   position "top-right" | "bottom-right" (add more in FloatingButton.css)
//   active   shows a small green dot (used when logged in)
//   photo    optional picture shown instead of the icon (e.g. profile photo)
export default function FloatingButton({ icon, label, onClick, position, active = false, photo }) {
  return (
    <button
      type="button"
      className={`floating-btn ${position}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {photo ? (
        <img src={photo} alt="" className="floating-photo" referrerPolicy="no-referrer" />
      ) : (
        <img src={icon} alt="" />
      )}
      {active && <span className="floating-dot" />}
    </button>
  );
}
