// =============================================================
//  OPENING HOURS LOGIC (no React here, so filters can use it too)
//
//  place.hours is a list of 7 days, Monday first. Each day is:
//    null                        -> the source didn't state hours
//    { closed: true }            -> closed
//    { h24: true }               -> open all day
//    { open: "08:00", close: "20:00", note?: "Break 13:30-17:30" }
//  close earlier than open means it runs past midnight.
// =============================================================

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// Monday = 0 ... Sunday = 6
export function dayIndex(date = new Date()) {
  return (date.getDay() + 6) % 7;
}

// Is the place open at this moment? true / false / null (unknown)
export function isOpenAt(hours, date = new Date()) {
  if (!hours || hours.every((d) => d === null)) return null;

  const today = dayIndex(date);
  const yesterday = (today + 6) % 7;
  const minutes = date.getHours() * 60 + date.getMinutes();

  // Still open from yesterday's overnight shift?
  const y = hours[yesterday];
  if (y && !y.closed && !y.h24 && y.open && y.close && toMinutes(y.close) < toMinutes(y.open)) {
    if (minutes < toMinutes(y.close)) return true;
  }

  const d = hours[today];
  if (d === null) return null;
  if (d.closed) return false;
  if (d.h24) return true;
  if (!d.open || !d.close) return null;

  const open = toMinutes(d.open);
  const close = toMinutes(d.close);
  const overnight = close < open;
  const inside = overnight ? minutes >= open : minutes >= open && minutes < close;
  if (!inside) return false;

  // Lunch break written as "Break 13:30-17:30"
  const brk = d.note?.match(/Break (\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
  if (brk && minutes >= toMinutes(brk[1]) && minutes < toMinutes(brk[2])) return false;
  return true;
}

// Open all 7 days, all day
export function isAlways24h(hours) {
  return Boolean(hours) && hours.every((d) => d?.h24);
}

// Open on Saturday or Sunday
export function isOpenWeekend(hours) {
  return Boolean(hours) && [hours[5], hours[6]].some((d) => d && !d.closed);
}
