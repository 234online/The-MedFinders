import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { TEXT } from "../config/texts.js";
import "./panels.css";

// When Auth0 refuses a login it sends the browser straight back here with
// an error instead of showing its login page. Without this banner that looks
// like "clicking Log in just reloads the page".
export default function AuthErrorBanner() {
  const { error } = useAuth0();
  const [hidden, setHidden] = useState(false);
  if (!error || hidden) return null;

  return (
    <div className="auth-error-banner" role="alert">
      <strong>{TEXT.authErrorTitle}</strong>
      <span>{error.message}</span>
      <button type="button" onClick={() => setHidden(true)} aria-label={TEXT.close}>
        ×
      </button>
    </div>
  );
}
