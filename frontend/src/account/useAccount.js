import { useEffect, useState } from "react";
import { TEXT } from "../config/texts.js";

// =============================================================
//  PROTOTYPE ACCOUNTS
//  The user and their favourites are kept in this browser
//  (localStorage). Any email + password (4+ characters) works,
//  and nothing is checked against a server: this is NOT secure.
//
//  To make it real later, replace login() / logout() with a real
//  auth service (Supabase Auth, Firebase Auth or your own backend),
//  and save favourites in the database instead of localStorage.
//  The rest of the app only uses what this hook returns, so it
//  won't need to change.
// =============================================================

const USER_KEY = "medfinders:user";
const favoritesKey = (email) => `medfinders:favorites:${email}`;

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked: ignore in the prototype
  }
}

export function useAccount() {
  const [user, setUser] = useState(() => read(USER_KEY, null));
  const [favorites, setFavorites] = useState([]);

  // Load this user's favourites whenever the user changes
  useEffect(() => {
    setFavorites(user ? read(favoritesKey(user.email), []) : []);
  }, [user]);

  function updateFavorites(email, change) {
    const next = change(read(favoritesKey(email), []));
    write(favoritesKey(email), next);
    setFavorites(next);
  }

  // Returns { error } if something is wrong, otherwise { user }
  function login(email, password) {
    const cleanEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return { error: TEXT.invalidEmail };
    if (password.length < 4) return { error: TEXT.shortPassword };

    const newUser = { email: cleanEmail, name: cleanEmail.split("@")[0] };
    write(USER_KEY, newUser);
    setUser(newUser);
    return { user: newUser };
  }

  function logout() {
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      // ignore
    }
    setUser(null);
  }

  function addFavorite(placeId, email = user?.email) {
    if (!email) return;
    updateFavorites(email, (list) => (list.includes(placeId) ? list : [...list, placeId]));
  }

  function removeFavorite(placeId) {
    if (!user) return;
    updateFavorites(user.email, (list) => list.filter((id) => id !== placeId));
  }

  function toggleFavorite(placeId) {
    if (favorites.includes(placeId)) removeFavorite(placeId);
    else addFavorite(placeId);
  }

  return {
    user,
    favorites,
    isFavorite: (placeId) => favorites.includes(placeId),
    login,
    logout,
    addFavorite,
    removeFavorite,
    toggleFavorite,
  };
}
