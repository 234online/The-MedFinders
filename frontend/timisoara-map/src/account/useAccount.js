import { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { TEXT } from "../config/texts.js";
import { AUTH0_ENABLED } from "./auth0Config.js";

// =============================================================
//  ACCOUNTS
//  Two versions with the same interface, chosen automatically:
//    - Auth0 (real login), when VITE_AUTH0_DOMAIN and
//      VITE_AUTH0_CLIENT_ID are set in .env
//    - Prototype (any email + 4-char password, stored in this
//      browser), when they aren't
//  Favourites are kept in this browser (localStorage) per user in
//  both versions. Later they can move to your database.
// =============================================================

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

// ---------- Auth0 version ----------
function useAuth0Account() {
  const { user: auth0User, isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0();

  const user = useMemo(() => {
    if (!isAuthenticated || !auth0User) return null;
    return {
      id: auth0User.sub,
      email: auth0User.email ?? auth0User.sub,
      name: auth0User.given_name || auth0User.nickname || auth0User.name || "Utilizator",
      picture: auth0User.picture,
    };
  }, [isAuthenticated, auth0User]);

  const favorites = useFavorites(user?.email);

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
  const [user, setUser] = useState(() => read(USER_KEY, null));
  const favorites = useFavorites(user?.email);

  // Returns { error } if something is wrong, otherwise { user }
  function login(email, password) {
    const cleanEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return { error: TEXT.invalidEmail };
    if (password.length < 4) return { error: TEXT.shortPassword };

    const newUser = { id: cleanEmail, email: cleanEmail, name: cleanEmail.split("@")[0] };
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
