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
  sex(v) {
    return v === 'M' || v === 'F' ? { value: v } : { error: 'Sexul trebuie să fie M sau F' };
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

// ---------- Medical profile ----------
const BLOOD_TYPES = ['0+', '0-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

// A list of short texts: trimmed, empty ones dropped, no duplicates
function textList(v, label, { max = 30, maxLength = 120 } = {}) {
  if (v === undefined || v === null) return { value: [] };
  if (!Array.isArray(v) || v.length > max) return { error: `„${label}” trebuie să fie o listă de cel mult ${max} elemente` };
  const items = [...new Set(v.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean))];
  if (items.some((x) => x.length > maxLength)) return { error: `Un element din „${label}” are peste ${maxLength} de caractere` };
  return { value: items };
}

function medicalProfile(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Corpul cererii trebuie să fie un obiect JSON' };
  const bloodType = body.bloodType || null;
  if (bloodType !== null && !BLOOD_TYPES.includes(bloodType)) return { error: `Grupa sanguină trebuie să fie: ${BLOOD_TYPES.join(', ')}` };

  const allergies = textList(body.allergies, 'Alergii');
  if (allergies.error) return allergies;
  const conditions = textList(body.conditions, 'Afecțiuni');
  if (conditions.error) return conditions;

  const rawMeds = body.medications ?? [];
  if (!Array.isArray(rawMeds) || rawMeds.length > 30) return { error: '„Tratament” trebuie să fie o listă de cel mult 30 de elemente' };
  const medications = [];
  for (const m of rawMeds) {
    const name = typeof m?.name === 'string' ? m.name.trim() : '';
    const dose = typeof m?.dose === 'string' ? m.dose.trim() : '';
    if (!name) continue;
    if (name.length > 120 || dose.length > 120) return { error: 'Numele sau doza unui medicament este prea lungă' };
    medications.push({ name, dose });
  }
  return { value: { bloodType, allergies: allergies.value, conditions: conditions.value, medications } };
}

// ---------- Appointments ----------
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function isoToday() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function newAppointment(body) {
  if (!body || typeof body !== 'object') return { error: 'Corpul cererii trebuie să fie un obiect JSON' };
  const place = placeId(body.placeId);
  if (place.error) return { error: 'Câmpul "placeId" lipsește sau este invalid' };

  const date = String(body.date ?? '');
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!DAY.test(date) || isNaN(parsed) || parsed.toISOString().slice(0, 10) !== date) return { error: 'Data trebuie să fie AAAA-LL-ZZ' };
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() + 1);
  if (date < isoToday() || parsed > limit) return { error: 'Alege o dată de azi până peste un an' };

  const time = String(body.time ?? '');
  if (!TIME.test(time)) return { error: 'Ora trebuie să fie HH:MM' };

  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (reason.length < 3 || reason.length > 300) return { error: 'Motivul trebuie să aibă 3–300 de caractere' };

  return { value: { placeId: place.value, date, time, reason } };
}

// What a doctor may change on an appointment
function doctorAppointmentChanges(body, statuses) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Corpul cererii trebuie să fie un obiect JSON' };
  const changes = {};
  if ('status' in body) {
    if (!statuses.includes(body.status)) return { error: `Statusul trebuie să fie: ${statuses.join(', ')}` };
    changes.status = body.status;
  }
  for (const [key, max] of [['diagnosis', 500], ['notes', 4000]]) {
    if (!(key in body)) continue;
    const v = body[key] === null ? '' : body[key];
    if (typeof v !== 'string' || v.length > max) return { error: `„${key}” trebuie să fie un text de cel mult ${max} de caractere` };
    changes[key] = v.trim() || null;
  }
  if (Object.keys(changes).length === 0) return { error: 'Nimic de schimbat' };
  return { value: changes };
}

// ---------- Doctor sign-up requests ----------
// Romanian doctors have a registration number with the College of
// Physicians (CMR) / a stamp code ("cod parafă"): letters, digits, - and spaces
const LICENSE = /^[A-Za-z0-9][A-Za-z0-9 -]{2,29}$/;

function placeIdList(raw, { min = 1, max = 10 } = {}) {
  if (!Array.isArray(raw)) return { error: 'Alege cel puțin o clinică' };
  const ids = [...new Set(raw.map((v) => placeId(v).value).filter(Boolean))];
  if (ids.length !== raw.length) return { error: 'Lista de clinici conține un ID invalid sau repetat' };
  if (ids.length < min || ids.length > max) return { error: `Alege între ${min} și ${max} clinici` };
  return { value: ids };
}

function specialtyText(v) {
  const s = typeof v === 'string' ? v.trim() : '';
  return s.length >= 2 && s.length <= 120 ? { value: s } : { error: 'Specialitatea trebuie să aibă 2–120 de caractere' };
}

function doctorRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Corpul cererii trebuie să fie un obiect JSON' };
  const places = placeIdList(body.placeIds);
  if (places.error) return places;
  const specialty = specialtyText(body.specialty);
  if (specialty.error) return specialty;
  const license = typeof body.licenseNumber === 'string' ? body.licenseNumber.trim() : '';
  if (!LICENSE.test(license)) return { error: 'Numărul de înregistrare (CMR / cod parafă) trebuie să aibă 3–30 de litere sau cifre' };
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (message.length > 500) return { error: 'Mesajul poate avea cel mult 500 de caractere' };
  return { value: { placeIds: places.value, specialty: specialty.value, licenseNumber: license, message: message || null } };
}

// An admin may correct the clinics / specialty while approving
function doctorApproval(body) {
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const value = {};
  if (b.placeIds !== undefined) {
    const places = placeIdList(b.placeIds);
    if (places.error) return places;
    value.placeIds = places.value;
  }
  if (b.specialty !== undefined) {
    const specialty = specialtyText(b.specialty);
    if (specialty.error) return specialty;
    value.specialty = specialty.value;
  }
  return { value };
}

function reviewNote(body) {
  const note = typeof body?.note === 'string' ? body.note.trim() : '';
  return note.length <= 300 ? { value: note || null } : { error: 'Nota poate avea cel mult 300 de caractere' };
}

// Optional chosen doctor when booking: a positive integer, or nothing = any doctor
function chosenDoctor(v) {
  if (v === undefined || v === null || v === '') return { value: null };
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? { value: n } : { error: 'Medicul ales nu este valid' };
}

module.exports = {
  placeId,
  profileChanges,
  medicalProfile,
  newAppointment,
  doctorAppointmentChanges,
  doctorRequest,
  doctorApproval,
  reviewNote,
  chosenDoctor
};
