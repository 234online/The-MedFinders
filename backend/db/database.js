/**
 * Stratul de acces la date / Adaptor Bază de Date (Repository Pattern)
 * ======================================================================
 * Furnizează datele clinicilor din fișierul JSON generat din baza de date
 * `database/timisoara_clinics.sql`.
 * Dacă fișierul JSON lipsește, se auto-generează automat din fișierul SQL.
 * 
 * Stratul este modular: când se decide conectarea live la o bază de date
 * dedicată (PostgreSQL / MongoDB / Supabase), este suficient să actualizați
 * metodele din acest fișier.
 */

const fs = require('fs');
const path = require('path');
const { parseClinicsFromSql } = require('../scripts/sync_clinics');

const DATA_FILE_PATH = path.join(__dirname, '..', 'data', 'places.json');
const DB_TYPE = process.env.DB_TYPE || 'json';

// Cache în memorie pentru performanță
let cachedPlaces = null;

/**
 * Încarcă datele clinicilor: fie din backend/data/places.json,
 * fie le parsează direct din database/timisoara_clinics.sql dacă fișierul lipsește.
 */
async function loadPlaces() {
  if (cachedPlaces && Array.isArray(cachedPlaces) && cachedPlaces.length > 0) {
    return cachedPlaces;
  }

  // Încearcă citirea din fișierul JSON
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = await fs.promises.readFile(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedPlaces = parsed;
        return cachedPlaces;
      }
    }
  } catch (err) {
    console.warn('[DB] Avertisment citire fișier JSON, se extrage din baza SQL:', err.message);
  }

  // Fallback direct din baza de date SQL
  try {
    console.log('[DB] Se extrag datele direct din baza de date a clinicilor (timisoara_clinics.sql)...');
    cachedPlaces = parseClinicsFromSql();
    // Încercăm să salvăm fișierul JSON pentru cererile viitoare
    try {
      const dir = path.dirname(DATA_FILE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      await fs.promises.writeFile(DATA_FILE_PATH, JSON.stringify(cachedPlaces, null, 2), 'utf-8');
    } catch (saveErr) {
      // Ignorăm erorile de salvare pe disc în sandbox
    }
    return cachedPlaces;
  } catch (sqlErr) {
    console.error('[DB] Eroare la citirea bazei de date SQL:', sqlErr.message);
    return [];
  }
}

/**
 * Salvează datele actualizate în fișierul JSON
 */
async function persistPlaces(places) {
  cachedPlaces = places;
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    await fs.promises.writeFile(DATA_FILE_PATH, JSON.stringify(places, null, 2), 'utf-8');
  } catch (error) {
    console.warn('[DB] Salvarea pe disc a eșuat (memoria rămâne actualizată):', error.message);
  }
}

/**
 * Returnează lista clinicilor și locațiilor medicale, cu opțiuni de filtrare
 */
async function getPlaces(filters = {}) {
  const places = await loadPlaces();

  return places.filter((place) => {
    // Filtrare după categorie (ex: hospital, clinic, dentist, etc.)
    if (filters.category && filters.category !== 'all' && filters.category !== 'any') {
      const categories = Array.isArray(filters.category) ? filters.category : [filters.category];
      if (!categories.map(c => c.toLowerCase()).includes((place.category || '').toLowerCase())) {
        return false;
      }
    }

    // Filtrare după zonă / cartier (ex: Cetate, Fabric, etc.)
    if (filters.area && filters.area !== 'all' && filters.area !== 'any') {
      if ((place.area || '').toLowerCase() !== filters.area.toLowerCase()) {
        return false;
      }
    }

    // Filtrare după specialități medicale
    if (filters.specialties || filters.specialty) {
      const specFilter = filters.specialties || filters.specialty;
      const wantedSpecs = Array.isArray(specFilter) ? specFilter : [specFilter];
      const placeSpecs = place.specialties || [];
      const hasMatch = wantedSpecs.some((s) => placeSpecs.includes(s));
      if (!hasMatch) return false;
    }

    // Filtru boolean: Deschis non-stop
    if (filters.open24h !== undefined) {
      const isReq = filters.open24h === 'true' || filters.open24h === true;
      if (place.open24h !== isReq) return false;
    }

    // Filtru boolean: Urgențe UPU
    if (filters.emergency !== undefined) {
      const isReq = filters.emergency === 'true' || filters.emergency === true;
      if (place.emergency !== isReq) return false;
    }

    // Filtru boolean: Contract CNAS
    if (filters.cnas !== undefined) {
      const isReq = filters.cnas === 'true' || filters.cnas === true;
      if (place.cnas !== isReq) return false;
    }

    // Filtru boolean: Acces scaun rulant
    if (filters.wheelchair !== undefined) {
      const isReq = filters.wheelchair === 'true' || filters.wheelchair === true;
      if (place.wheelchair !== isReq) return false;
    }

    // Filtru boolean: Programare online
    if (filters.onlineBooking !== undefined) {
      const isReq = filters.onlineBooking === 'true' || filters.onlineBooking === true;
      if (place.onlineBooking !== isReq) return false;
    }

    // Filtru boolean: Parcare
    if (filters.parking !== undefined) {
      const isReq = filters.parking === 'true' || filters.parking === true;
      if (place.parking !== isReq) return false;
    }

    // Filtru boolean: Potrivit pentru copii
    if (filters.kids !== undefined) {
      const isReq = filters.kids === 'true' || filters.kids === true;
      if (place.kids !== isReq) return false;
    }

    // Filtru scor minim
    if (filters.minScore && filters.minScore !== 'any') {
      const min = Number(filters.minScore);
      if (!isNaN(min) && (place.score ?? 0) < min) {
        return false;
      }
    }

    // Căutare liberă după text (în nume, adresă, specialități, descriere, tag-uri)
    if (filters.search || filters.q) {
      const q = (filters.search || filters.q).toLowerCase().trim();
      const matchName = place.name?.toLowerCase().includes(q);
      const matchAddress = place.address?.toLowerCase().includes(q);
      const matchDesc = place.description?.toLowerCase().includes(q);
      const matchArea = place.area?.toLowerCase().includes(q);
      const matchSpecs = Array.isArray(place.specialties) && place.specialties.some(s => s.toLowerCase().includes(q));
      const matchTags = Array.isArray(place.tags) && place.tags.some(t => t.toLowerCase().includes(q));

      if (!matchName && !matchAddress && !matchDesc && !matchArea && !matchSpecs && !matchTags) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Returnează o singură clinică după ID sau cod
 */
async function getPlaceById(id) {
  const places = await loadPlaces();
  return places.find((p) => String(p.id) === String(id) || p.code === id) || null;
}

/**
 * Adaugă o clinică nouă
 */
async function addPlace(placeData) {
  const places = await loadPlaces();

  const numericIds = places.map((p) => Number(p.id)).filter((n) => !isNaN(n));
  const nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;

  const newPlace = {
    id: nextId,
    code: placeData.code || `clinic-${nextId}`,
    name: placeData.name || 'Clinică fără nume',
    category: placeData.category || 'clinic',
    area: placeData.area || 'Cetate',
    address: placeData.address || '',
    phone: placeData.phone || '',
    email: placeData.email || '',
    website: placeData.website || '',
    description: placeData.description || '',
    tags: Array.isArray(placeData.tags) ? placeData.tags : [],
    specialties: Array.isArray(placeData.specialties) ? placeData.specialties : [],
    languages: Array.isArray(placeData.languages) ? placeData.languages : ['ro', 'en'],
    priceLevel: Number(placeData.priceLevel) || 2,
    open24h: Boolean(placeData.open24h),
    emergency: Boolean(placeData.emergency),
    cnas: Boolean(placeData.cnas),
    wheelchair: Boolean(placeData.wheelchair),
    onlineBooking: Boolean(placeData.onlineBooking),
    parking: Boolean(placeData.parking),
    kids: Boolean(placeData.kids),
    hours: placeData.hours || null,
    googlePlaceId: placeData.googlePlaceId || '',
    lat: Number(placeData.lat) || 45.7537,
    lng: Number(placeData.lng) || 21.2257,
    score: placeData.score || null,
    reviewCount: placeData.reviewCount || 0,
    reviews: Array.isArray(placeData.reviews) ? placeData.reviews : []
  };

  places.push(newPlace);
  await persistPlaces(places);
  return newPlace;
}

/**
 * Actualizează o clinică existentă
 */
async function updatePlace(id, updateData) {
  const places = await loadPlaces();
  const index = places.findIndex((p) => String(p.id) === String(id) || p.code === id);

  if (index === -1) return null;

  const existing = places[index];
  const updated = {
    ...existing,
    ...updateData,
    id: existing.id,
    code: existing.code
  };

  places[index] = updated;
  await persistPlaces(places);
  return updated;
}

/**
 * Șterge o clinică după ID
 */
async function deletePlace(id) {
  const places = await loadPlaces();
  const index = places.findIndex((p) => String(p.id) === String(id) || p.code === id);

  if (index === -1) return false;

  places.splice(index, 1);
  await persistPlaces(places);
  return true;
}

/**
 * Returnează statistici pe categorii
 */
async function getCategoriesStats() {
  const places = await loadPlaces();
  const stats = {};

  for (const place of places) {
    const cat = place.category || 'other';
    stats[cat] = (stats[cat] || 0) + 1;
  }

  return Object.keys(stats).map((key) => ({
    category: key,
    count: stats[key]
  }));
}

/**
 * Returnează lista completă a specialităților prezente în baza de date
 */
async function getSpecialtiesStats() {
  const places = await loadPlaces();
  const specCounts = {};

  for (const place of places) {
    if (Array.isArray(place.specialties)) {
      for (const spec of place.specialties) {
        specCounts[spec] = (specCounts[spec] || 0) + 1;
      }
    }
  }

  return Object.keys(specCounts)
    .sort()
    .map((spec) => ({
      specialty: spec,
      count: specCounts[spec]
    }));
}

/**
 * Informații despre furnizorul de date și conexiune
 */
async function getDatabaseInfo() {
  const places = await loadPlaces();
  return {
    provider: DB_TYPE === 'json' ? 'Clinics Database (SQL/JSON Engine)' : DB_TYPE,
    sourceFile: 'database/timisoara_clinics.sql',
    dataFile: 'backend/data/places.json',
    totalClinics: places.length,
    status: 'Ready & Linked with Frontend API',
    supportedAdapters: ['PostgreSQL', 'MongoDB', 'MySQL', 'Supabase', 'SQLite']
  };
}

/**
 * Resincronizează datele din fișierul SQL
 */
async function reloadFromSqlDatabase() {
  cachedPlaces = parseClinicsFromSql();
  await persistPlaces(cachedPlaces);
  return cachedPlaces;
}

module.exports = {
  loadPlaces,
  getPlaces,
  getPlaceById,
  addPlace,
  updatePlace,
  deletePlace,
  getCategoriesStats,
  getSpecialtiesStats,
  getDatabaseInfo,
  reloadFromSqlDatabase
};
