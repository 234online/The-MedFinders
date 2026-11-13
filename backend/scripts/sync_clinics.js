/**
 * Script de sincronizare / importare date din baza de date a clinicilor (SQL)
 * Calea sursă: database/timisoara_clinics.sql
 * Calea destinație: backend/data/places.json
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
const sqlPath = path.join(rootDir, 'database', 'timisoara_clinics.sql');
const outputPath = path.join(__dirname, '..', 'data', 'places.json');

function parseClinicsFromSql(sqlFilePath = sqlPath) {
  if (!fs.existsSync(sqlFilePath)) {
    throw new Error(`Fișierul SQL nu a fost găsit la: ${sqlFilePath}`);
  }

  const sql = fs.readFileSync(sqlFilePath, 'utf-8');

  // 1. Extragere Specialități
  const specialties = {};
  const specMatch = sql.match(/INSERT INTO specialties[^(]+\(([^)]+)\)\s*VALUES([\s\S]+?);/);
  if (specMatch) {
    const valuesBlock = specMatch[2];
    const tupleRegex = /\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/g;
    let match;
    while ((match = tupleRegex.exec(valuesBlock)) !== null) {
      specialties[match[1]] = {
        code: match[1],
        name_ro: match[2],
        name_en: match[3],
        category_ro: match[4]
      };
    }
  }

  // 2. Extragere Relații Clinici ↔ Specialități
  const clinicSpecs = {};
  const linkMatch = sql.match(/INSERT INTO clinic_specialties[\s\S]+?FROM \(VALUES([\s\S]+?)\)\s*AS link/);
  if (linkMatch) {
    const tupleRegex = /\('([^']+)',\s*'([^']+)'\)/g;
    let match;
    while ((match = tupleRegex.exec(linkMatch[1])) !== null) {
      const [_, clinicCode, specCode] = match;
      if (!clinicSpecs[clinicCode]) clinicSpecs[clinicCode] = [];
      if (specialties[specCode]) {
        clinicSpecs[clinicCode].push(specialties[specCode].name_ro);
      }
    }
  }

  // 3. Extragere Program de funcționare (Opening Hours)
  const dayNames = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat', 7: 'sun' };
  const clinicHours = {};
  const hoursMatch = sql.match(/INSERT INTO opening_hours[\s\S]+?FROM \(VALUES([\s\S]+?)\)\s*AS h/);
  if (hoursMatch) {
    const lineRegex = /\('([^']+)',\s*([1-7]),\s*(NULL|'[^']*'),\s*(NULL|'[^']*'),\s*(TRUE|FALSE),\s*(TRUE|FALSE),\s*(NULL|'[^']*')\)/gi;
    let match;
    while ((match = lineRegex.exec(hoursMatch[1])) !== null) {
      const clinicCode = match[1];
      const day = parseInt(match[2], 10);
      const dayKey = dayNames[day];
      const tOpen = match[3] === 'NULL' ? null : match[3].replace(/'/g, '');
      const tClose = match[4] === 'NULL' ? null : match[4].replace(/'/g, '');
      const isClosed = match[5].toUpperCase() === 'TRUE';
      const is24h = match[6].toUpperCase() === 'TRUE';

      if (!clinicHours[clinicCode]) {
        clinicHours[clinicCode] = {
          mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null,
          is24h: false
        };
      }

      if (is24h) {
        clinicHours[clinicCode][dayKey] = '00:00-24:00';
        clinicHours[clinicCode].is24h = true;
      } else if (isClosed || !tOpen || !tClose) {
        clinicHours[clinicCode][dayKey] = null;
      } else {
        const openStr = tOpen.slice(0, 5);
        const closeStr = tClose.slice(0, 5);
        clinicHours[clinicCode][dayKey] = `${openStr}-${closeStr}`;
      }
    }
  }

  // 4. Extragere Recenzii și Rating-uri
  const ratings = {};
  const ratingsMatch = sql.match(/INSERT INTO ratings[\s\S]+?FROM \(VALUES([\s\S]+?)\)\s*AS r/);
  if (ratingsMatch) {
    // Format: ('clinic_code', 'platform', score, votes, 'url')
    const rRegex = /\('([^']+)',\s*'([^']+)',\s*([0-9.]+),\s*([0-9]+),\s*'([^']+)'\)/g;
    let match;
    while ((match = rRegex.exec(ratingsMatch[1])) !== null) {
      const clinicCode = match[1];
      const score = parseFloat(match[3]);
      const votes = parseInt(match[4], 10);
      ratings[clinicCode] = { score, votes, platform: match[2], url: match[5] };
    }
  }

  // 5. Extragere Clinici
  const clinicsStart = sql.indexOf('INSERT INTO clinics (code, name, network, ownership, kind, address, postal_code, phone, email, website, cnas_contract, latitude, longitude, geo_precision, notes) VALUES');
  const clinicsEnd = sql.indexOf('-- 4. CLINIC ↔ SPECIALTY LINKS');
  const clinicsText = sql.substring(clinicsStart, clinicsEnd);

  const rawClinics = [];
  let i = clinicsText.indexOf('VALUES') + 6;
  while (i < clinicsText.length) {
    while (i < clinicsText.length && clinicsText[i] !== '(') i++;
    if (i >= clinicsText.length) break;
    i++;

    const fields = [];
    while (i < clinicsText.length && clinicsText[i] !== ')') {
      while (i < clinicsText.length && /\s/.test(clinicsText[i])) i++;
      if (clinicsText[i] === ')') break;

      if (clinicsText[i] === "'") {
        i++;
        let val = '';
        while (i < clinicsText.length) {
          if (clinicsText[i] === "'" && clinicsText[i+1] === "'") {
            val += "'";
            i += 2;
          } else if (clinicsText[i] === "'") {
            i++;
            break;
          } else {
            val += clinicsText[i];
            i++;
          }
        }
        fields.push(val);
      } else {
        let val = '';
        while (i < clinicsText.length && clinicsText[i] !== ',' && clinicsText[i] !== ')') {
          val += clinicsText[i];
          i++;
        }
        fields.push(val.trim());
      }

      while (i < clinicsText.length && (clinicsText[i] === ',' || /\s/.test(clinicsText[i]))) {
        if (clinicsText[i] === ',') {
          i++;
          break;
        }
        i++;
      }
    }
    if (fields.length >= 15) {
      rawClinics.push({
        code: fields[0],
        name: fields[1],
        network: fields[2],
        ownership: fields[3],
        kind: fields[4],
        address: fields[5],
        postal_code: fields[6],
        phone: fields[7],
        email: fields[8],
        website: fields[9],
        cnas_contract: fields[10],
        latitude: parseFloat(fields[11]),
        longitude: parseFloat(fields[12]),
        geo_precision: fields[13],
        notes: fields[14]
      });
    }
    i++;
  }

  // Deducere Cartier / Zonă
  function getArea(address, lat, lng) {
    const addr = address.toLowerCase();
    if (addr.includes('circumvalațiunii') || addr.includes('gheorghe lazăr') || addr.includes('cetății') || addr.includes('torontal') || addr.includes('arad')) {
      return 'Circumvalațiunii';
    }
    if (addr.includes('eroilor') || addr.includes('victor babeș') || addr.includes('cluj') || addr.includes('vladimirescu') || addr.includes('studențesc') || addr.includes('pârvan') || addr.includes('rebreanu') || addr.includes('șagului') || addr.includes('arieș')) {
      return 'Complexul Studențesc';
    }
    if (addr.includes('elisabetin') || addr.includes('ciprian porumbescu') || addr.includes('bălcescu') || addr.includes('romulus') || addr.includes('odobescu') || addr.includes('mihai viteazu') || addr.includes('16 decembrie')) {
      return 'Elisabetin';
    }
    if (addr.includes('iosefin') || addr.includes('dragalina') || addr.includes('kuhn') || addr.includes('dâmbovița') || addr.includes('văcărescu')) {
      return 'Iosefin';
    }
    if (addr.includes('fabric') || addr.includes('traian') || addr.includes('badea cârțan') || addr.includes('bărnuțiu') || addr.includes('take ionescu') || addr.includes('luna') || addr.includes('mărăști')) {
      return 'Fabric';
    }
    if (addr.includes('cetate') || addr.includes('victoriei') || addr.includes('unirii') || addr.includes('libertății') || addr.includes('brediceanu') || addr.includes('mărășești') || addr.includes('republicii') || addr.includes('consiliul europei') || addr.includes('iulius')) {
      return 'Cetate';
    }
    if (lat >= 45.758 && lng <= 21.230) return 'Circumvalațiunii';
    if (lng >= 21.238 && lat >= 45.748) return 'Fabric';
    if (lat <= 45.748 && lng >= 21.232) return 'Complexul Studențesc';
    if (lat <= 45.748 && lng >= 21.218) return 'Elisabetin';
    if (lng < 21.218) return 'Iosefin';
    return 'Cetate';
  }

  // Deducere Categorie
  function getCategory(c, specs) {
    const n = c.name.toLowerCase();
    const k = c.kind;
    if (k === 'hospital' || n.includes('spital')) return 'hospital';
    if (k === 'dental' || n.includes('dent') || n.includes('stomatolog')) return 'dentist';
    if (k === 'laboratory' || n.includes('bioclinica') || n.includes('synevo') || n.includes('sante') || n.includes('laborator') || k === 'imaging') return 'laboratory';
    if (k === 'practice' || specs.some(s => s.toLowerCase().includes('familie'))) return 'doctor';
    return 'clinic';
  }

  const clinicPlaces = rawClinics.map((c, index) => {
    const specs = clinicSpecs[c.code] || [];
    const hoursData = clinicHours[c.code] || { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null, is24h: false };
    const { is24h, ...cleanHours } = hoursData;

    const isNonStop = is24h || c.notes.toLowerCase().includes('non-stop') || c.notes.toLowerCase().includes('24h') || c.name.toLowerCase().includes('non-stop');
    const isEmergency = c.name.toLowerCase().includes('spital') || c.name.toLowerCase().includes('urgen') || c.notes.toLowerCase().includes('urgen') || isNonStop;
    const isWheelchair = c.kind === 'hospital' || c.kind === 'polyclinic' || c.kind === 'laboratory' || c.kind === 'imaging' || !c.notes.toLowerCase().includes('etaj');
    const hasOnlineBooking = ['MedLife', 'Regina Maria', 'Dentcof', 'Medicover', 'Clinica Hope', 'Bioclinica'].includes(c.network) || c.website !== 'not listed';
    const isKids = specs.some(s => s.toLowerCase().includes('pediatr') || s.toLowerCase().includes('copii') || s.toLowerCase().includes('neonat')) || c.name.toLowerCase().includes('copii') || c.name.toLowerCase().includes('baby');

    const tags = [...new Set([
      c.network !== 'Independent' ? c.network : null,
      c.ownership === 'public' ? 'Public' : 'Privat',
      ...specs
    ])].filter(Boolean);

    let desc = c.notes;
    if (specs.length > 0) {
      desc += ` Specialități: ${specs.slice(0, 5).join(', ')}${specs.length > 5 ? ' etc.' : ''}.`;
    }
    if (c.website && c.website !== 'not listed') {
      desc += ` Website: ${c.website}`;
    }

    const ratingInfo = ratings[c.code];

    return {
      id: index + 1,
      code: c.code,
      name: c.name,
      category: getCategory(c, specs),
      area: getArea(c.address, c.latitude, c.longitude),
      address: c.address,
      phone: c.phone,
      email: c.email !== 'not listed' ? c.email : '',
      website: c.website !== 'not listed' ? c.website : '',
      description: desc.trim(),
      tags,
      specialties: specs,
      languages: ['ro', 'en'],
      priceLevel: c.ownership === 'public' ? 1 : 2,
      open24h: Boolean(isNonStop),
      emergency: Boolean(isEmergency),
      cnas: c.cnas_contract === 'yes',
      wheelchair: Boolean(isWheelchair),
      onlineBooking: Boolean(hasOnlineBooking),
      parking: true,
      kids: Boolean(isKids),
      hours: cleanHours,
      googlePlaceId: '',
      lat: c.latitude,
      lng: c.longitude,
      score: ratingInfo ? ratingInfo.score : null,
      reviewCount: ratingInfo ? ratingInfo.votes : 0,
      ratingSource: ratingInfo ? { platform: ratingInfo.platform, url: ratingInfo.url } : null,
      reviews: []
    };
  });

  // Locații adiționale (Farmacii & Optică din Timișoara) pentru acoperirea tuturor categoriilor
  const extraPlaces = [
    {"id": 101, "code": "farmacia-unirii", "name": "Farmacia Demo Unirii", "category": "pharmacy", "area": "Cetate", "address": "Strada Exemplu 8, Timișoara", "phone": "0256 000 008", "description": "Farmacie cu preparate magistrale.", "tags": ["Farmacie", "preparate magistrale"], "specialties": [], "languages": ["ro", "en"], "priceLevel": 1, "open24h": false, "emergency": false, "cnas": true, "wheelchair": true, "onlineBooking": false, "parking": true, "kids": true, "hours": {"mon": "08:00-21:00", "tue": "08:00-21:00", "wed": "08:00-21:00", "thu": "08:00-21:00", "fri": "08:00-21:00", "sat": "09:00-15:00", "sun": null}, "googlePlaceId": "", "lat": 45.7581, "lng": 21.2302, "reviews": []},
    {"id": 102, "code": "farmacia-nonstop", "name": "Farmacia Demo Nonstop", "category": "pharmacy", "area": "Cetate", "address": "Strada Exemplu 9, Timișoara", "phone": "0256 000 009", "description": "Farmacie deschisă non-stop.", "tags": ["Farmacie", "program de noapte"], "specialties": [], "languages": ["ro", "en"], "priceLevel": 2, "open24h": true, "emergency": false, "cnas": true, "wheelchair": true, "onlineBooking": false, "parking": false, "kids": false, "hours": null, "googlePlaceId": "", "lat": 45.7541, "lng": 21.2271, "reviews": []},
    {"id": 103, "code": "farmacia-fabric", "name": "Farmacia Demo Fabric", "category": "pharmacy", "area": "Fabric", "address": "Strada Exemplu 10, Timișoara", "phone": "0256 000 010", "description": "Farmacie de cartier.", "tags": ["Farmacie"], "specialties": [], "languages": ["ro", "en"], "priceLevel": 1, "open24h": false, "emergency": false, "cnas": true, "wheelchair": false, "onlineBooking": false, "parking": true, "kids": false, "hours": {"mon": "08:00-21:00", "tue": "08:00-21:00", "wed": "08:00-21:00", "thu": "08:00-21:00", "fri": "08:00-21:00", "sat": "09:00-15:00", "sun": null}, "googlePlaceId": "", "lat": 45.7577, "lng": 21.2421, "reviews": []},
    {"id": 104, "code": "farmacia-iosefin", "name": "Farmacia Demo Iosefin", "category": "pharmacy", "area": "Iosefin", "address": "Strada Exemplu 11, Timișoara", "phone": "0256 000 011", "description": "Farmacie cu profil homeopat.", "tags": ["Farmacie", "homeopatie"], "specialties": [], "languages": ["ro", "hu"], "priceLevel": 3, "open24h": false, "emergency": false, "cnas": false, "wheelchair": true, "onlineBooking": false, "parking": false, "kids": false, "hours": {"mon": "08:00-21:00", "tue": "08:00-21:00", "wed": "08:00-21:00", "thu": "08:00-21:00", "fri": "08:00-21:00", "sat": "09:00-15:00", "sun": null}, "googlePlaceId": "", "lat": 45.7475, "lng": 21.2146, "reviews": []},
    {"id": 105, "code": "farmacia-studenti", "name": "Farmacia Demo Studenților", "category": "pharmacy", "area": "Complexul Studențesc", "address": "Strada Exemplu 12, Timișoara", "phone": "0256 000 012", "description": "Farmacie deschisă non-stop.", "tags": ["Farmacie"], "specialties": [], "languages": ["ro", "en", "sr"], "priceLevel": 1, "open24h": true, "emergency": false, "cnas": true, "wheelchair": true, "onlineBooking": false, "parking": true, "kids": false, "hours": null, "googlePlaceId": "", "lat": 45.7462, "lng": 21.2371, "reviews": []},
    {"id": 106, "code": "farmacia-elisabetin", "name": "Farmacia Demo Elisabetin", "category": "pharmacy", "area": "Elisabetin", "address": "Strada Exemplu 13, Timișoara", "phone": "0256 000 013", "description": "Farmacie de proximitate.", "tags": ["Farmacie"], "specialties": [], "languages": ["ro", "en"], "priceLevel": 1, "open24h": false, "emergency": false, "cnas": true, "wheelchair": false, "onlineBooking": false, "parking": false, "kids": false, "hours": {"mon": "08:00-21:00", "tue": "08:00-21:00", "wed": "08:00-21:00", "thu": "08:00-21:00", "fri": "08:00-21:00", "sat": "09:00-15:00", "sun": null}, "googlePlaceId": "", "lat": 45.7441, "lng": 21.2209, "reviews": []},
    {"id": 107, "code": "optica-victoriei", "name": "Optica Demo Victoriei", "category": "optician", "area": "Cetate", "address": "Strada Exemplu 20, Timișoara", "phone": "0256 000 020", "description": "Magazin de optică și consult optometric.", "tags": ["Optică", "ochelari", "lentile de contact"], "specialties": ["Oftalmologie"], "languages": ["ro"], "priceLevel": 3, "open24h": false, "emergency": false, "cnas": false, "wheelchair": true, "onlineBooking": true, "parking": true, "kids": false, "hours": {"mon": "10:00-19:00", "tue": "10:00-19:00", "wed": "10:00-19:00", "thu": "10:00-19:00", "fri": "10:00-19:00", "sat": "10:00-14:00", "sun": null}, "googlePlaceId": "", "lat": 45.7546, "lng": 21.2242, "reviews": []},
    {"id": 108, "code": "optica-iosefin", "name": "Optica Demo Iosefin", "category": "optician", "area": "Iosefin", "address": "Strada Exemplu 21, Timișoara", "phone": "0256 000 021", "description": "Magazin de optică medicală.", "tags": ["Optică", "ochelari", "consult oftalmologic"], "specialties": ["Oftalmologie"], "languages": ["ro", "sr"], "priceLevel": 3, "open24h": false, "emergency": false, "cnas": false, "wheelchair": false, "onlineBooking": true, "parking": true, "kids": false, "hours": {"mon": "10:00-19:00", "tue": "10:00-19:00", "wed": "10:00-19:00", "thu": "10:00-19:00", "fri": "10:00-19:00", "sat": "10:00-14:00", "sun": null}, "googlePlaceId": "", "lat": 45.7508, "lng": 21.2121, "reviews": []}
  ];

  return [...clinicPlaces, ...extraPlaces];
}

function syncClinicsToFile(targetFile = outputPath) {
  const dir = path.dirname(targetFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const places = parseClinicsFromSql();
  fs.writeFileSync(targetFile, JSON.stringify(places, null, 2), 'utf-8');
  console.log(`[Sync] Sincronizat cu succes ${places.length} clinici în ${targetFile}`);
  return places;
}

// Rulare directă dacă este apelat din linia de comandă
if (require.main === module) {
  try {
    const places = syncClinicsToFile();
    console.log(`Total clinici procesate: ${places.length}`);
  } catch (error) {
    console.error('Eroare la sincronizarea bazei de date a clinicilor:', error.message);
    process.exit(1);
  }
}

module.exports = {
  parseClinicsFromSql,
  syncClinicsToFile
};
