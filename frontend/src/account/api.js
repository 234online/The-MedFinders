// =============================================================
//  BACKEND API (Render)
//  Address from .env:  VITE_API_URL=https://your-backend.onrender.com
//  Requests from a logged-in user carry their Auth0 token, so the
//  backend knows who they are.
// =============================================================

export const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const API_ENABLED = Boolean(API_URL);

// useAccount() registers Auth0's getAccessTokenSilently here after login,
// so any part of the app can make logged-in requests.
let getToken = null;
export function setTokenGetter(fn) {
  getToken = fn;
}

async function authHeader() {
  if (!getToken) return {};
  try {
    return { Authorization: `Bearer ${await getToken()}` };
  } catch {
    return {}; // not logged in / token expired: send without it
  }
}

export async function apiFetch(path, { method = "GET", body, keepalive = false } = {}) {
  const headers = { ...(await authHeader()) };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    keepalive,
  });
  if (!response.ok) {
    // The backend explains what went wrong in { error: "..." }
    const details = await response.json().catch(() => ({}));
    const error = new Error(details.error || `API ${method} ${path}: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

// ---------- "My account" (profile in the PostgreSQL database) ----------
export const accountApi = {
  getProfile: () => apiFetch("/api/me"),
  // { name, phone, birth_date: "YYYY-MM-DD", preferred_language }; "" clears a field
  updateProfile: (changes) => apiFetch("/api/me", { method: "PATCH", body: changes }),
  deleteAccount: () => apiFetch("/api/me", { method: "DELETE" }),
  getContacts: (limit = 10) => apiFetch(`/api/me/contacts?limit=${limit}`),
};

// Records a Call / WhatsApp / Email click (never blocks or breaks the link).
//   kind: "call" | "whatsapp" | "email"
export function trackContact(placeId, kind, target) {
  if (!API_ENABLED) return;
  apiFetch("/api/contacts", { method: "POST", body: { placeId, kind, target }, keepalive: true }).catch(
    () => {}
  );
}
