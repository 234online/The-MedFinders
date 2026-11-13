/**
 * Data Access Layer / Adaptor Bază de Date
 * ========================================================
 * În acest moment, datele sunt citite și salvate dintr-un fișier JSON (data/places.json).
 * Această structură este concepută ca un strat de abstractizare:
 * Când se alege o bază de date reală (PostgreSQL, MongoDB, MySQL, SQLite etc.),
 * este necesar să modifici doar implementarea metodelor din acest fișier,
 * iar restul backend-ului și frontend-ul vor funcționa fără alte modificări.
 */

const fs = require('fs').promises;
const path = require('path');

// Calea către fișierul JSON local folosit ca bază de date temporară
const DATA_FILE_PATH = path.join(__dirname, '..', 'data', 'places.json');

// Tipul bazei de date selectat din variabilele de mediu (implicit: 'json')
const DB_TYPE = process.env.DB_TYPE || 'json';

/**
 * Citește toate locurile din fișierul JSON
 */
async function readPlacesFromJsonFile() {
  try {
    const rawData = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Eroare la citirea fișierului JSON cu locuri:', error.message);
    throw new Error('Nu s-au putut încărca datele din fișierul JSON.');
  }
}

/**
 * Scrie lista completă de locuri în fișierul JSON
 */
async function writePlacesToJsonFile(places) {
  try {
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(places, null, 2), 'utf-8');
  } catch (error) {
    console.error('Eroare la salvarea în fișierul JSON:', error.message);
    throw new Error('Nu s-au putut salva modificările în fișierul JSON.');
  }
}

/**
 * Returnează lista locurilor medicale, cu opțiuni de filtrare și căutare
 */
async function getPlaces(filters = {}) {
  // --- VIITOARE BAZĂ DE DATE ---
  // if (DB_TYPE === 'mongodb') {
  //   return await PlaceModel.find(buildMongoQuery(filters));
  // }
  // if (DB_TYPE === 'postgres') {
  //   return await prisma.place.findMany({ where: buildPrismaQuery(filters) });
  // }

  // --- IMPLEMENTARE CURENTĂ: FIȘIER JSON ---
  const places = await readPlacesFromJsonFile();

  return places.filter((place) => {
    // Filtrare după categorie (ex: hospital, pharmacy, clinic, etc.)
    if (filters.category && place.category.toLowerCase() !== filters.category.toLowerCase()) {
      return false;
    }

    // Filtrare după zonă/cartier (ex: Cetate, Fabric, etc.)
    if (filters.area && place.area && place.area.toLowerCase() !== filters.area.toLowerCase()) {
      return false;
    }

    // Filtrare boolean: deschis non-stop
    if (filters.open24h !== undefined && place.open24h !== (filters.open24h === 'true' || filters.open24h === true)) {
      return false;
    }

    // Filtrare boolean: urgențe
    if (filters.emergency !== undefined && place.emergency !== (filters.emergency === 'true' || filters.emergency === true)) {
      return false;
    }

    // Filtrare boolean: accesibilitate scaun cu rotile
    if (filters.wheelchair !== undefined && place.wheelchair !== (filters.wheelchair === 'true' || filters.wheelchair === true)) {
      return false;
    }

    // Filtrare boolean: decontat CNAS
    if (filters.cnas !== undefined && place.cnas !== (filters.cnas === 'true' || filters.cnas === true)) {
      return false;
    }

    // Căutare liberă după text (în nume, adresă, descriere, tag-uri)
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchName = place.name?.toLowerCase().includes(q);
      const matchAddress = place.address?.toLowerCase().includes(q);
      const matchDesc = place.description?.toLowerCase().includes(q);
      const matchArea = place.area?.toLowerCase().includes(q);
      const matchTags = Array.isArray(place.tags) && place.tags.some(tag => tag.toLowerCase().includes(q));

      if (!matchName && !matchAddress && !matchDesc && !matchArea && !matchTags) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Returnează un singur loc după ID
 */
async function getPlaceById(id) {
  const places = await readPlacesFromJsonFile();
  return places.find((p) => String(p.id) === String(id)) || null;
}

/**
 * Adaugă un loc nou (salvează în JSON, urmând să fie inserat în baza de date aleasă)
 */
async function addPlace(placeData) {
  const places = await readPlacesFromJsonFile();

  // Generare ID nou incremental (sau se va folosi ID-ul generat de DB)
  const numericIds = places.map((p) => Number(p.id)).filter((n) => !isNaN(n));
  const nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;

  const newPlace = {
    id: nextId,
    name: placeData.name || 'Fără nume',
    category: placeData.category || 'other',
    area: placeData.area || '',
    address: placeData.address || '',
    phone: placeData.phone || '',
    tags: Array.isArray(placeData.tags) ? placeData.tags : [],
    open24h: Boolean(placeData.open24h),
    emergency: Boolean(placeData.emergency),
    wheelchair: Boolean(placeData.wheelchair),
    cnas: Boolean(placeData.cnas),
    lat: Number(placeData.lat) || 0,
    lng: Number(placeData.lng) || 0,
    description: placeData.description || ''
  };

  places.push(newPlace);
  await writePlacesToJsonFile(places);

  return newPlace;
}

/**
 * Actualizează un loc existent după ID
 */
async function updatePlace(id, updateData) {
  const places = await readPlacesFromJsonFile();
  const index = places.findIndex((p) => String(p.id) === String(id));

  if (index === -1) {
    return null;
  }

  const existing = places[index];
  const updatedPlace = {
    ...existing,
    ...updateData,
    id: existing.id // Păstrăm același ID
  };

  places[index] = updatedPlace;
  await writePlacesToJsonFile(places);

  return updatedPlace;
}

/**
 * Șterge un loc după ID
 */
async function deletePlace(id) {
  const places = await readPlacesFromJsonFile();
  const index = places.findIndex((p) => String(p.id) === String(id));

  if (index === -1) {
    return false;
  }

  places.splice(index, 1);
  await writePlacesToJsonFile(places);
  return true;
}

/**
 * Obține categoriile și numărul de locuri per categorie
 */
async function getCategoriesStats() {
  const places = await readPlacesFromJsonFile();
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
 * Returnează informații despre starea curentă a bazei de date
 */
async function getDatabaseInfo() {
  const places = await readPlacesFromJsonFile();
  return {
    activeProvider: DB_TYPE === 'json' ? 'JSON File Database' : DB_TYPE,
    isTemporaryJson: DB_TYPE === 'json',
    totalPlaces: places.length,
    dataFile: 'backend/data/places.json',
    status: 'Ready. Data is provided from JSON file until a permanent database is connected.',
    futureOptions: ['MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Supabase', 'Firebase']
  };
}

module.exports = {
  getPlaces,
  getPlaceById,
  addPlace,
  updatePlace,
  deletePlace,
  getCategoriesStats,
  getDatabaseInfo
};
