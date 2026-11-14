import { TEXT } from "../config/texts.js";

// The "Aa  Mod accesibil" button.  variant: "light" (start page) or "dark"
export default function AccessibleToggle({ on, onToggle, variant = "dark" }) {
  return (
    <button
      type="button"
      className={`a11y-toggle ${variant}${on ? " on" : ""}`}
      onClick={onToggle}
      aria-pressed={on}
      title={on ? TEXT.a11yOn : TEXT.a11yOff}
    >
      <span className="a11y-icon">Aa</span>
      {TEXT.a11yButton}
    </button>
  );
}
