/**
 * Exportă datele din database/timisoara_clinics.sql în fișierul folosit de site:
 * frontend/src/data/places.json
 *
 * Rulare: npm run export-frontend   (din folderul backend)
 *
 * Locațiile demo ("Strada Exemplu ...") adăugate de sync_clinics.js nu sunt
 * exportate: în site ajung doar clinicile reale din baza de date.
 */

const fs = require('fs');
const path = require('path');
const { parseClinicsFromSql } = require('./sync_clinics');

const frontendFile = path.resolve(__dirname, '..', '..', 'frontend', 'src', 'data', 'places.json');

function exportToFrontend(targetFile = frontendFile) {
  const places = parseClinicsFromSql().filter((p) => !/Strada Exemplu/i.test(p.address || ''));

  // Un obiect pe linie, ca în fișierul original (diff-uri mai mici în git)
  const body = places.map((p) => '  ' + JSON.stringify(p)).join(',\n');
  fs.writeFileSync(targetFile, `[\n${body}\n]\n`, 'utf-8');

  console.log(`[Export] ${places.length} locații scrise în ${targetFile}`);
  return places;
}

if (require.main === module) {
  try {
    exportToFrontend();
  } catch (error) {
    console.error('[Export] Eroare:', error.message);
    process.exit(1);
  }
}

module.exports = { exportToFrontend };
