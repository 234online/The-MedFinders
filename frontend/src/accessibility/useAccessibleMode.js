import { useEffect, useState } from "react";

// =============================================================
//  ACCESSIBLE MODE
//  Adds the class "a11y" to the page (<html>). Its styles are in
//  src/accessibility/accessible.css: bigger text, stronger contrast,
//  underlined links, clear focus outlines, no animations.
//  The choice is remembered in this browser.
// =============================================================

const KEY = "timicarenow:accessible";

function initial() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function useAccessibleMode() {
  const [on, setOn] = useState(initial);

  useEffect(() => {
    document.documentElement.classList.toggle("a11y", on);
    try {
      localStorage.setItem(KEY, on ? "1" : "0");
    } catch {
      // ignore
    }
  }, [on]);

  return [on, () => setOn((v) => !v)];
}
