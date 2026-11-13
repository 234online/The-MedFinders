import { useState } from "react";
import { TEXT } from "../config/texts.js";
import "./panels.css";

// Login / create-account form.
//   notice   optional message at the top (e.g. "log in to save")
//   onSubmit (email, password) => error text, or null when it worked
export default function LoginForm({ notice, onSubmit }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError(onSubmit(email, password) ?? "");
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
    </form>
  );
}
