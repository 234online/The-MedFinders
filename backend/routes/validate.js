/**
 * Small input checks shared by the routes.
 * Each returns { value } when the input is fine, or { error } with a message.
 */

// Clinic codes from the website, e.g. 'medlife-spital', 'clinica-hope-2'
const PLACE_ID = /^[a-z0-9][a-z0-9_-]{0,79}$/i;

function placeId(value) {
  const v = typeof value === 'number' ? String(value) : value;
  return typeof v === 'string' && PLACE_ID.test(v) ? { value: v } : { error: 'ID de clinică invalid' };
}

const LANGUAGES = ['ro', 'en', 'hu'];

// Profile fields: undefined = not sent (unchanged), null or "" = clear it
const PROFILE_RULES = {
  name(v) {
    if (typeof v !== 'string' || v.trim().length < 1 || v.trim().length > 200) return { error: 'Numele trebuie să aibă 1–200 de caractere' };
    return { value: v.trim() };
  },
  phone(v) {
    const s = String(v).trim();
    if (!/^\+?[0-9 ().-]{6,25}$/.test(s)) return { error: 'Număr de telefon invalid' };
    return { value: s };
  },
  birth_date(v) {
    const s = String(v);
    const d = new Date(`${s}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || isNaN(d) || d.toISOString().slice(0, 10) !== s) return { error: 'Data nașterii trebuie să fie AAAA-LL-ZZ' };
    if (s < '1900-01-01' || d > new Date()) return { error: 'Data nașterii nu este validă' };
    return { value: s };
  },
  preferred_language(v) {
    return LANGUAGES.includes(v) ? { value: v } : { error: `Limba trebuie să fie: ${LANGUAGES.join(', ')}` };
  }
};

function profileChanges(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Corpul cererii trebuie să fie un obiect JSON' };
  const changes = {};
  for (const [key, rule] of Object.entries(PROFILE_RULES)) {
    if (!(key in body)) continue;
    const raw = body[key];
    if (raw === null || raw === '') {
      if (key === 'name') return { error: 'Numele nu poate fi gol' };
      changes[key] = null;
      continue;
    }
    const { value, error } = rule(raw);
    if (error) return { error };
    changes[key] = value;
  }
  return { value: changes };
}

module.exports = { placeId, profileChanges };
