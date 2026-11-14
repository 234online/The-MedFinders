import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { TEXT } from "../config/texts.js";
import { AUTH0_ENABLED, AUTH0_AUDIENCE } from "./auth0Config.js";
import { API_ENABLED, apiFetch, setTokenGetter } from "./api.js";

// Favourites are saved in the PostgreSQL database (through the backend)
// when VITE_API_URL and VITE_AUTH0_AUDIENCE are set; otherwise in this browser.
export const SERVER_FAVORITES = AUTH0_ENABLED && API_ENABLED && Boolean(AUTH0_AUDIENCE);
// Profile, contact history etc. on the "My account" page need the same setup
export const SERVER_ACCOUNT = SERVER_FAVORITES;

// =============================================================
//  ACCOUNTS
//  Two versions with the same interface, chosen automatically:
//    - Auth0 (real login), when VITE_AUTH0_DOMAIN and
//      VITE_AUTH0_CLIENT_ID are set in .env
//    - Prototype (any email + 4-char password, stored in this
//      browser), when they aren't
//  Favourites: with Auth0 + VITE_API_URL + VITE_AUTH0_AUDIENCE they
//  are saved in the PostgreSQL database through the backend; otherwise
//  in this browser (localStorage) per user.
// =============================================================

// Account types. Doctors are set in Auth0 (app_metadata.role, see
// backend/auth0/README.md); the Auth0 Action adds it to the ID token here.
export const ROLE_CLAIM = "https://timicarenow.app/role";
export const ROLES = ["patient", "doctor"];

// Placeholder accounts (password "123"), same as backend/scripts/seed_demo.js.
// In the prototype they log straight in; with Auth0 they are real Auth0 logins.
export const DEMO_ACCOUNTS = {
  "doctor@timicarenow.app": { name: "Dr. Andrei Demo", role: "doctor" },
  "pacient@timicarenow.app": { name: "Maria Demo", role: "patient" },
};
export const DEMO_PASSWORD = "123";

const USER_KEY = "medfinders:user";
const PENDING_KEY = "timicarenow:pending-login";
const favoritesKey = (email) => `medfinders:favorites:${email}`;

function read(key, fallback, storage = localStorage) {
  try {
    const value = storage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value, storage = localStorage) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked: ignore
  }
}

function remove(key, storage = localStorage) {
  try {
    storage.removeItem(key);
  } catch {
    // ignore
  }
}

// ---------- Favourites (shared by both versions) ----------
function useFavorites(email) {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    setFavorites(email ? read(favoritesKey(email), []) : []);
  }, [email]);

  function update(forEmail, change) {
    const next = change(read(favoritesKey(forEmail), []));
    write(favoritesKey(forEmail), next);
    setFavorites(next);
  }

  function addFavorite(placeId, forEmail = email) {
    if (!forEmail) return;
    update(forEmail, (list) => (list.includes(placeId) ? list : [...list, placeId]));
  }

  function removeFavorite(placeId) {
    if (!email) return;
    update(email, (list) => list.filter((id) => id !== placeId));
  }

  function toggleFavorite(placeId) {
    if (favorites.includes(placeId)) removeFavorite(placeId);
    else addFavorite(placeId);
  }

  return {
    favorites,
    isFavorite: (placeId) => favorites.includes(placeId),
    addFavorite,
    removeFavorite,
    toggleFavorite,
  };
}

// ---------- Favourites in the database (Auth0 + backend) ----------
// Same interface as useFavorites(). Changes show at once and are then
// confirmed by the server (undone if the request fails). Requests run one
// after another so a slow answer never overwrites a newer change.
function useServerFavorites(user, enabled) {
  const [favorites, setFavorites] = useState([]);
  const queue = useRef(Promise.resolve());

  function enqueue(task) {
    queue.current = queue.current.then(task).catch((err) => console.error("[favorites]", err));
    return queue.current;
  }

  useEffect(() => {
    setFavorites([]);
    if (!enabled || !user) return;
    let cancelled = false;
    const apply = (list) => !cancelled && Array.isArray(list) && setFavorites(list);

    enqueue(async () => {
      // Save the Auth0 profile (name, email, photo) in the users table
      await apiFetch("/api/me", {
        method: "POST",
        body: { email: user.email, name: user.fullName ?? user.name, picture: user.picture },
      });
      // Move favourites saved in this browser before the database existed
      const local = read(favoritesKey(user.email), []);
      if (local.length > 0) {
        apply(await apiFetch("/api/me/favorites", { method: "POST", body: { placeIds: local } }));
        remove(favoritesKey(user.email));
      } else {
        apply(await apiFetch("/api/me/favorites"));
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, user?.id]);

  function change(placeId, optimistic, method) {
    if (!user) return;
    setFavorites(optimistic);
    enqueue(async () => {
      try {
        setFavorites(await apiFetch(`/api/me/favorites/${encodeURIComponent(placeId)}`, { method }));
      } catch (err) {
        // Show what the database really has
        apiFetch("/api/me/favorites").then(setFavorites, () => {});
        throw err;
      }
    });
  }

  const addFavorite = (placeId) =>
    change(placeId, (list) => (list.includes(placeId) ? list : [...list, placeId]), "PUT");
  const removeFavorite = (placeId) =>
    change(placeId, (list) => list.filter((id) => id !== placeId), "DELETE");

  return {
    favorites,
    isFavorite: (placeId) => favorites.includes(placeId),
    addFavorite,
    removeFavorite,
    toggleFavorite: (placeId) =>
      favorites.includes(placeId) ? removeFavorite(placeId) : addFavorite(placeId),
  };
}

// ---------- Auth0 version ----------
function useAuth0Account() {
  const {
    user: auth0User,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } = useAuth0();

  // Logged-in requests to the backend (favourites, contact history) use this token
  if (SERVER_FAVORITES) setTokenGetter(isAuthenticated ? () => getAccessTokenSilently() : null);

  // Role saved in the database (backend copies it from Auth0 at every login);
  // used when the ID token has no role claim (Auth0 Action not installed yet)
  const [serverRole, setServerRole] = useState(null);
  useEffect(() => {
    setServerRole(null);
    if (!SERVER_ACCOUNT || !isAuthenticated || auth0User?.[ROLE_CLAIM]) return;
    let cancelled = false;
    apiFetch("/api/me").then(
      (me) => !cancelled && setServerRole(me?.role ?? null),
      () => {}
    );
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, auth0User]);

  const user = useMemo(() => {
    if (!isAuthenticated || !auth0User) return null;
    return {
      id: auth0User.sub,
      email: auth0User.email ?? auth0User.sub,
      name: auth0User.given_name || auth0User.nickname || auth0User.name || "Utilizator",
      fullName: auth0User.name,
      picture: auth0User.picture,
      role: auth0User[ROLE_CLAIM] ?? serverRole ?? "patient",
    };
  }, [isAuthenticated, auth0User, serverRole]);

  // Both hooks always run (React rule); only one is used
  const localFavorites = useFavorites(SERVER_FAVORITES ? null : user?.email);
  const serverFavorites = useServerFavorites(user, SERVER_FAVORITES);
  const favorites = SERVER_FAVORITES ? serverFavorites : localFavorites;

  // Goes to Auth0's login page. "pending" = what to do when we come back
  // (e.g. save a place), because the page reloads after logging in.
  function redirectToLogin({ signup = false, google = false, pending = null } = {}) {
    if (pending) write(PENDING_KEY, pending, sessionStorage);
    else remove(PENDING_KEY, sessionStorage);

    const authorizationParams = {};
    if (signup) authorizationParams.screen_hint = "signup";
    if (google) authorizationParams.connection = "google-oauth2";
    loginWithRedirect({ authorizationParams });
  }

  // Read (once) what to do after coming back from Auth0
  function takePendingAction() {
    const pending = read(PENDING_KEY, null, sessionStorage);
    remove(PENDING_KEY, sessionStorage);
    return pending;
  }

  return {
    mode: "auth0",
    isLoading,
    user,
    ...favorites,
    redirectToLogin,
    takePendingAction,
    logout: () => logout({ logoutParams: { returnTo: window.location.origin } }),
  };
}

// ---------- Prototype version (no Auth0 settings) ----------
function useLocalAccount() {
  const [user, setUser] = useState(() => {
    const saved = read(USER_KEY, null);
    return saved ? { role: "patient", ...saved } : null;
  });
  const favorites = useFavorites(user?.email);

  // Returns { error } if something is wrong, otherwise { user }.
  // role: "patient" | "doctor" (prototype only: lets you try both account types)
  function login(email, password, role = "patient") {
    const cleanEmail = email.trim().toLowerCase();
    const demo = DEMO_ACCOUNTS[cleanEmail];
    if (demo && password === DEMO_PASSWORD) {
      const demoUser = { id: cleanEmail, email: cleanEmail, ...demo };
      write(USER_KEY, demoUser);
      setUser(demoUser);
      return { user: demoUser };
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return { error: TEXT.invalidEmail };
    if (password.length < 4) return { error: TEXT.shortPassword };

    const newUser = {
      id: cleanEmail,
      email: cleanEmail,
      name: cleanEmail.split("@")[0],
      role: ROLES.includes(role) ? role : "patient",
    };
    write(USER_KEY, newUser);
    setUser(newUser);
    return { user: newUser };
  }

  function logout() {
    remove(USER_KEY);
    setUser(null);
  }

  return {
    mode: "local",
    isLoading: false,
    user,
    ...favorites,
    login,
    takePendingAction: () => null,
    logout,
  };
}

// The app always calls useAccount(); which version runs is fixed at startup.
export const useAccount = AUTH0_ENABLED ? useAuth0Account : useLocalAccount;
