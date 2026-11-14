import { LANGUAGES, TEXT } from "../config/texts.js";
import "./LanguageSwitcher.css";

// RO | EN | HU buttons.  variant: "light" (on the dark start page) or "dark"
export default function LanguageSwitcher({ value, onChange, variant = "dark" }) {
  return (
    <div className={`lang-switch ${variant}`} role="group" aria-label={TEXT.languageLabel}>
      {LANGUAGES.map((l) => (
        <button
          key={l.id}
          type="button"
          className={l.id === value ? "active" : ""}
          onClick={() => onChange(l.id)}
          title={l.name}
          aria-pressed={l.id === value}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
