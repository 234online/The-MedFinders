const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
const sqlPath = path.join(rootDir, 'database', 'timisoara_clinics.sql');
const sql = fs.readFileSync(sqlPath, 'utf-8');

// 1. Parse Specialties
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

// 2. Parse Clinic Specialties
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

// 3. Parse Opening Hours
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

// 4. Parse Clinics
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

// 5. Area determination matching AREAS in config/placeTypes.js
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

  // Geographic boundaries
  if (lat >= 45.758 && lng <= 21.230) return 'Circumvalațiunii';
  if (lng >= 21.238 && lat >= 45.748) return 'Fabric';
  if (lat <= 45.748 && lng >= 21.232) return 'Complexul Studențesc';
  if (lat <= 45.748 && lng >= 21.218) return 'Elisabetin';
  if (lng < 21.218) return 'Iosefin';
  return 'Cetate';
}

// 6. Category mapping
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

  return {
    id: index + 1,
    name: c.name,
    category: getCategory(c, specs),
    area: getArea(c.address, c.latitude, c.longitude),
    address: c.address,
    phone: c.phone,
    tags,
    open24h: Boolean(isNonStop),
    emergency: Boolean(isEmergency),
    wheelchair: Boolean(isWheelchair),
    cnas: c.cnas_contract === 'yes',
    lat: c.latitude,
    lng: c.longitude,
    description: desc.trim(),
    hours: cleanHours,
    googlePlaceId: ''
  };
});

// Complementary Pharmacies and Opticians for full filter completeness
const extraPlaces = [
  {"id": 101, "name": "Farmacia Demo Unirii", "category": "pharmacy", "area": "Cetate", "address": "Strada Exemplu 8", "phone": "0256 000 008", "tags": ["preparate magistrale"], "open24h": false, "emergency": false, "wheelchair": true, "cnas": true, "lat": 45.7581, "lng": 21.2302, "description": "Farmacie demo.", "hours": {"mon": "08:00-21:00", "tue": "08:00-21:00", "wed": "08:00-21:00", "thu": "08:00-21:00", "fri": "08:00-21:00", "sat": "09:00-15:00", "sun": null}, "googlePlaceId": ""},
  {"id": 102, "name": "Farmacia Demo Nonstop", "category": "pharmacy", "area": "Cetate", "address": "Strada Exemplu 9", "phone": "0256 000 009", "tags": ["program de noapte"], "open24h": true, "emergency": false, "wheelchair": true, "cnas": true, "lat": 45.7541, "lng": 21.2271, "description": "Farmacie demo deschisă non-stop.", "hours": null, "googlePlaceId": ""},
  {"id": 103, "name": "Farmacia Demo Fabric", "category": "pharmacy", "area": "Fabric", "address": "Strada Exemplu 10", "phone": "0256 000 010", "tags": [], "open24h": false, "emergency": false, "wheelchair": false, "cnas": true, "lat": 45.7577, "lng": 21.2421, "description": "Farmacie demo.", "hours": {"mon": "08:00-21:00", "tue": "08:00-21:00", "wed": "08:00-21:00", "thu": "08:00-21:00", "fri": "08:00-21:00", "sat": "09:00-15:00", "sun": null}, "googlePlaceId": ""},
  {"id": 104, "name": "Farmacia Demo Iosefin", "category": "pharmacy", "area": "Iosefin", "address": "Strada Exemplu 11", "phone": "0256 000 011", "tags": ["homeopatie"], "open24h": false, "emergency": false, "wheelchair": true, "cnas": false, "lat": 45.7475, "lng": 21.2146, "description": "Farmacie demo.", "hours": {"mon": "08:00-21:00", "tue": "08:00-21:00", "wed": "08:00-21:00", "thu": "08:00-21:00", "fri": "08:00-21:00", "sat": "09:00-15:00", "sun": null}, "googlePlaceId": ""},
  {"id": 105, "name": "Farmacia Demo Studenților", "category": "pharmacy", "area": "Complexul Studențesc", "address": "Strada Exemplu 12", "phone": "0256 000 012", "tags": [], "open24h": true, "emergency": false, "wheelchair": true, "cnas": true, "lat": 45.7462, "lng": 21.2371, "description": "Farmacie demo deschisă non-stop.", "hours": null, "googlePlaceId": ""},
  {"id": 106, "name": "Farmacia Demo Elisabetin", "category": "pharmacy", "area": "Elisabetin", "address": "Strada Exemplu 13", "phone": "0256 000 013", "tags": [], "open24h": false, "emergency": false, "wheelchair": false, "cnas": true, "lat": 45.7441, "lng": 21.2209, "description": "Farmacie demo.", "hours": {"mon": "08:00-21:00", "tue": "08:00-21:00", "wed": "08:00-21:00", "thu": "08:00-21:00", "fri": "08:00-21:00", "sat": "09:00-15:00", "sun": null}, "googlePlaceId": ""},
  {"id": 107, "name": "Optica Demo Victoriei", "category": "optician", "area": "Cetate", "address": "Strada Exemplu 20", "phone": "0256 000 020", "tags": ["ochelari", "lentile de contact"], "open24h": false, "emergency": false, "wheelchair": true, "cnas": false, "lat": 45.7546, "lng": 21.2242, "description": "Magazin de optică demo.", "hours": {"mon": "10:00-19:00", "tue": "10:00-19:00", "wed": "10:00-19:00", "thu": "10:00-19:00", "fri": "10:00-19:00", "sat": "10:00-14:00", "sun": null}, "googlePlaceId": ""},
  {"id": 108, "name": "Optica Demo Iosefin", "category": "optician", "area": "Iosefin", "address": "Strada Exemplu 21", "phone": "0256 000 021", "tags": ["ochelari", "consult oftalmologic"], "open24h": false, "emergency": false, "wheelchair": false, "cnas": false, "lat": 45.7508, "lng": 21.2121, "description": "Magazin de optică demo.", "hours": {"mon": "10:00-19:00", "tue": "10:00-19:00", "wed": "10:00-19:00", "thu": "10:00-19:00", "fri": "10:00-19:00", "sat": "10:00-14:00", "sun": null}, "googlePlaceId": ""}
];

const allPlaces = [...clinicPlaces, ...extraPlaces];

// Save to frontend/src/data/places.json
const frontendPlacesPath = path.join(rootDir, 'frontend', 'src', 'data', 'places.json');
try {
  fs.writeFileSync(frontendPlacesPath, JSON.stringify(allPlaces, null, 2), 'utf-8');
  console.log('Saved', allPlaces.length, 'places to', frontendPlacesPath);
} catch (err) {
  console.warn('Could not write frontend places directly:', err.message);
}

// Save to backend/data/places.json
const backendPlacesPath = path.join(rootDir, 'backend', 'data', 'places.json');
try {
  fs.writeFileSync(backendPlacesPath, JSON.stringify(allPlaces, null, 2), 'utf-8');
  console.log('Saved', allPlaces.length, 'places to', backendPlacesPath);
} catch (err) {
  console.warn('Could not write backend places directly:', err.message);
}
