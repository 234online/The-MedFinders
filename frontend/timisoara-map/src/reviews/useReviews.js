import { useState } from "react";

// =============================================================
//  PROTOTYPE REVIEWS written by users.
//  Stored in this browser (localStorage), so only you see them.
//  Later, save them in your database instead; the rest of the app
//  only uses what this hook returns.
//  One review per user per place: writing again replaces the old one.
// =============================================================

const KEY = "medfinders:reviews";

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}

function write(value) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // ignore in the prototype
  }
}

export function useReviews() {
  // { [placeId]: [review, ...] }
  const [byPlace, setByPlace] = useState(read);

  function addReview(placeId, { rating, text }, user) {
    const review = {
      id: `${user.email}-${Date.now()}`,
      author: user.name,
      authorEmail: user.email,
      rating,
      text: text.trim(),
      date: new Date().toISOString().slice(0, 10),
    };
    setByPlace((prev) => {
      const others = (prev[placeId] ?? []).filter((r) => r.authorEmail !== user.email);
      const next = { ...prev, [placeId]: [review, ...others] };
      write(next);
      return next;
    });
  }

  return { byPlace, addReview };
}
