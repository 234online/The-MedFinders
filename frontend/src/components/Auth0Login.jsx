import { useState } from "react";
import { TEXT } from "../config/texts.js";
import "./panels.css";

// Login window when Auth0 is set up: the buttons send you to Auth0's
// secure login page, which brings you back here afterwards.
// "I'm a doctor": after coming back, the doctor account request opens
// (the account stays a patient account until an admin approves it).
//   onLogin / onSignup / onGoogle  ({ doctor }) => void
export default function Auth0Login({ notice, onLogin, onSignup, onGoogle }) {
  const [doctor, setDoctor] = useState(false);

  return (
    <div className="login-form">
      {notice && <p className="login-notice">{notice}</p>}
      <p className="auth0-intro">{TEXT.auth0Intro}</p>

      <fieldset className="account-type">
        <legend>{TEXT.accountTypeLabel}</legend>
        <label>
          <input type="radio" name="account-type" checked={!doctor} onChange={() => setDoctor(false)} />
          {TEXT.rolePatient}
        </label>
        <label>
          <input type="radio" name="account-type" checked={doctor} onChange={() => setDoctor(true)} />
          {TEXT.roleDoctor}
        </label>
      </fieldset>
      {doctor && <p className="login-note account-note">{TEXT.doctorSignupNote}</p>}

      <button type="button" className="btn-primary" onClick={() => onLogin({ doctor })}>
        {TEXT.loginButton}
      </button>

      <button type="button" className="btn-google" onClick={() => onGoogle({ doctor })}>
        <span className="btn-google-g">G</span>
        {TEXT.googleLogin}
      </button>

      <button type="button" className="btn-link" onClick={() => onSignup({ doctor })}>
        {TEXT.switchToRegister}
      </button>

      <p className="login-note">{TEXT.auth0Note}</p>
    </div>
  );
}
