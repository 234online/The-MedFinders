import { useState } from "react";
import { TEXT } from "../config/texts.js";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../account/useAccount.js";
import "./panels.css";

// Login / create-account form.
//   notice   optional message at the top (e.g. "log in to save")
//   onSubmit (email, password, role) => error text, or null when it worked
//            role: "patient" | "doctor" (the prototype lets you try both;
//            with Auth0, doctors are set by an admin, never chosen here)
export default function LoginForm({ notice, onSubmit }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [doctor, setDoctor] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError(onSubmit(email, password, doctor ? "doctor" : "patient") ?? "");
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      {notice && <p className="login-notice">{notice}</p>}

      <label>
        {TEXT.email}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus
          required
        />
      </label>

      <label>
        {TEXT.password}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
        />
      </label>

      <label className="login-check">
        <input type="checkbox" checked={doctor} onChange={(e) => setDoctor(e.target.checked)} />
        {TEXT.roleDoctorDemo}
      </label>

      {error && <p className="login-error">{error}</p>}

      <button type="submit" className="btn-primary">
        {mode === "login" ? TEXT.loginButton : TEXT.registerButton}
      </button>

      <button
        type="button"
        className="btn-link"
        onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
      >
        {mode === "login" ? TEXT.switchToRegister : TEXT.switchToLogin}
      </button>

      <p className="login-note">{TEXT.prototypeNote}</p>
      <p className="login-note">{TEXT.demoAccountsNote(Object.keys(DEMO_ACCOUNTS), DEMO_PASSWORD)}</p>
    </form>
  );
}
