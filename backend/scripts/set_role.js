/**
 * Makes an account a doctor (or a patient again), in Auth0 AND in the
 * PostgreSQL users table.
 *
 *   npm run set-role -- <email> doctor <clinic-code>[,<clinic-code>...] ["Specialty"]
 *   npm run set-role -- <email> patient
 *
 *   e.g.  npm run set-role -- ana.popescu@gmail.com doctor medlife-spital,medlife-eroilor "Cardiologie"
 *
 * Auth0: writes { role, clinic_ids, specialty } into the user's app_metadata
 * (needs AUTH0_DOMAIN, AUTH0_MGMT_CLIENT_ID, AUTH0_MGMT_CLIENT_SECRET, see
 * auth0/README.md). The Action then puts it into every login token.
 * Database: updates users right away (needs DATABASE_URL), so the change
 * works before the person logs in again. They must log out and back in
 * for the website to show the doctor portal.
 */

const db = require('../db/pool');
const users = require('../repositories/users');
const places = require('../db/database');
const auth0 = require('./auth0Management');

async function updateAuth0(email, appMetadata) {
  const list = await auth0.usersByEmail(email);
  if (list.length === 0) throw new Error(`Nu există niciun cont Auth0 cu emailul ${email}`);
  // The same email can have several Auth0 accounts (password + Google): update all
  for (const user of list) {
    await auth0.updateUser(user.user_id, { app_metadata: appMetadata });
    console.log(`[Auth0] ${user.user_id}: app_metadata actualizat`);
  }
}

async function main() {
  const [email, role, clinicList = '', specialty = null] = process.argv.slice(2);
  if (!email || !['patient', 'doctor', 'admin'].includes(role)) {
    console.log('Folosire: npm run set-role -- <email> <patient|doctor|admin> [cod-clinică,cod-clinică...] ["Specialitate"]');
    process.exit(1);
  }
  const clinicIds = clinicList.split(',').map((c) => c.trim()).filter(Boolean);
  if (role === 'doctor') {
    if (clinicIds.length === 0) throw new Error('Un medic are nevoie de cel puțin un cod de clinică (ex. medlife-spital)');
    for (const id of clinicIds) {
      const place = await places.getPlaceById(id);
      if (!place) throw new Error(`Nu există clinica „${id}”`);
      console.log(`Clinica: ${place.name}`);
    }
  }

  // Auth0 merges app_metadata keys: null removes the old ones from a patient
  const access = {
    role,
    clinic_ids: role === 'doctor' ? clinicIds : null,
    clinic_id: null,
    specialty: role === 'doctor' ? specialty : null
  };

  let done = false;
  if (auth0.isConfigured()) {
    await updateAuth0(email, access);
    done = true;
  } else {
    console.warn('[Auth0] AUTH0_MGMT_CLIENT_ID / SECRET lipsesc: setează app_metadata manual (vezi auth0/README.md)');
  }

  if (db.isEnabled()) {
    const rows = await users.findByEmail(email);
    for (const u of rows) {
      await users.setAccess(u.id, { role, clinicIds, specialty: access.specialty });
      console.log(`[PG] users.id=${u.id}: rol „${role}”`);
    }
    if (rows.length === 0) console.log('[PG] Contul nu s-a logat încă pe site: rolul vine din Auth0 la prima logare');
    done = true;
  }

  if (!done) throw new Error('Nici Auth0 Management, nici DATABASE_URL nu sunt configurate');
  console.log('Gata. Persoana trebuie să se deconecteze și să se logheze din nou.');
}

main()
  .catch((err) => {
    console.error('Eroare:', err.message);
    process.exitCode = 1;
  })
  .finally(() => db.close());
