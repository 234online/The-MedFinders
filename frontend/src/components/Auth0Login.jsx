import { TEXT } from "../config/texts.js";
import "./panels.css";

// Login window when Auth0 is set up: the buttons send you to Auth0's
// secure login page, which brings you back here afterwards.
export default function Auth0Login({ notice, onLogin, onSignup, onGoogle }) {
  return (
    <div className="login-form">
      {notice && <p className="login-notice">{notice}</p>}
      <p className="auth0-intro">{TEXT.auth0Intro}</p>

      <button type="button" className="btn-primary" onClick={onLogin}>
        {TEXT.loginButton}
      </button>

      <button type="button" className="btn-google" onClick={onGoogle}>
        <span className="btn-google-g">G</span>
        {TEXT.googleLogin}
      </button>

      <button type="button" className="btn-link" onClick={onSignup}>
        {TEXT.switchToRegister}
      </button>

      <p className="login-note">{TEXT.auth0Note}</p>
    </div>
  );
}
