// Date helpers for the doctor dashboard. Dates are "YYYY-MM-DD" strings
// in local time (so comparing them as text gives the right order).

const LOCALES = { ro: "ro-RO", en: "en-GB", hu: "hu-HU" };

export function isoDay(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parse(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// "vin., 14 nov." / "Fri 14 Nov"; adds the year when it isn't this year
export function formatDate(iso, lang, { long = false } = {}) {
  if (!iso) return "";
  const date = parse(iso);
  const options = long
    ? { day: "numeric", month: "long", year: "numeric" }
    : { weekday: "short", day: "numeric", month: "short" };
  if (!long && date.getFullYear() !== new Date().getFullYear()) options.year = "numeric";
  return new Intl.DateTimeFormat(LOCALES[lang] ?? "ro-RO", options).format(date);
}

export function ageFrom(iso) {
  if (!iso) return null;
  const born = parse(iso);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  if (now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())) {
    age -= 1;
  }
  return age;
}
