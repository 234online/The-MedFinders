/**
 * Placeholder accounts for demos, both with the password "123":
 *
 *   doctor@timicarenow.app   doctor at 2 clinics (medlife-spital, medlife-eroilor)
 *   pacient@timicarenow.app  patient with a medical record, an appointment
 *                            request, a confirmed appointment and a past visit
 *
 *   npm run seed-demo              create / reset them
 *   npm run seed-demo -- --remove  delete them (Auth0 + database)
 *
 * Auth0 (needs the Machine to Machine app, see auth0/README.md): creates the
 * two logins in the Database connection. Auth0's default password policy
 * refuses "123": set Authentication -> Database -> your connection ->
 * Password Policy to "None" first (the script tells you if it is refused).
 * Database (needs DATABASE_URL): creates the users rows with the same Auth0
 * ids, the doctor's clinics, the patient's details and appointments.
 *
 * WARNING: anyone who knows these passwords can log in. The demo doctor sees
 * every request sent to its two clinics, including real patients' ones.
 * Remove the accounts (--remove) before real patients use the site.
 */

const db = require('../db/pool');
const { migrate } = require('../db/migrate');
const users = require('../repositories/users');
const medical = require('../repositories/medical');
const auth0 = require('./auth0Management');

const PASSWORD = '123';

const DEMO = {
  doctor: {
    email: 'doctor@timicarenow.app',
    name: 'Dr. Andrei Demo',
    role: 'doctor',
    clinicIds: ['medlife-spital', 'medlife-eroilor'],
    specialty: 'Medicină internă'
  },
  patient: {
    email: 'pacient@timicarenow.app',
    name: 'Maria Demo',
    role: 'patient',
    phone: '0700 000 123',
    birthDate: '1990-05-12',
    sex: 'F'
  }
};

const appMetadataFor = (a) =>
  a.role === 'doctor'
    ? { role: 'doctor', clinic_ids: a.clinicIds, specialty: a.specialty }
    : { role: 'patient', clinic_ids: null, clinic_id: null, specialty: null };

// Creates or resets the Auth0 login; returns its Auth0 id ("sub")
async function ensureAuth0User(a) {
  const existing = (await auth0.usersByEmail(a.email)).find((u) =>
    (u.identities || []).some((i) => i.connection === auth0.DB_CONNECTION)
  );
  try {
    if (existing) {
      await auth0.updateUser(existing.user_id, { password: PASSWORD, connection: auth0.DB_CONNECTION });
      await auth0.updateUser(existing.user_id, { name: a.name, email_verified: true, app_metadata: appMetadataFor(a) });
      console.log(`[Auth0] ${a.email}: parola și rolul resetate (${existing.user_id})`);
      return existing.user_id;
    }
    const created = await auth0.createUser({
      email: a.email,
      password: PASSWORD,
      name: a.name,
      email_verified: true,
      app_metadata: appMetadataFor(a)
    });
    console.log(`[Auth0] ${a.email}: cont creat (${created.user_id})`);
    return created.user_id;
  } catch (err) {
    if (/password/i.test(err.auth0?.message || '') || err.auth0?.errorCode === 'PasswordStrengthError') {
      throw new Error(
        `Auth0 refuză parola "${PASSWORD}". În Auth0 Dashboard -> Authentication -> Database -> ` +
          `${auth0.DB_CONNECTION} -> Password Policy alege "None" (și dezactivează Password History / ` +
          'Dictionary / Personal data), salvează, apoi rulează din nou scriptul.'
      );
    }
    throw err;
  }
}

const isoDay = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

async function seedDatabase(ids) {
  const { doctor, patient } = DEMO;

  // Rows created earlier without Auth0 ("demo|...") take the real Auth0 id
  for (const [key, sub] of Object.entries(ids)) {
    const placeholder = `demo|${key}`;
    if (sub !== placeholder) {
      await db.query(
        'UPDATE users SET auth0_id = $1 WHERE auth0_id = $2 AND NOT EXISTS (SELECT 1 FROM users WHERE auth0_id = $1)',
        [sub, placeholder]
      );
    }
  }

  const doc = await users.upsertFromAuth0(ids.doctor, { email: doctor.email, name: doctor.name }, {
    role: 'doctor',
    clinicIds: doctor.clinicIds,
    specialty: doctor.specialty
  });
  await db.query('UPDATE users SET name = $2 WHERE id = $1', [doc.id, doctor.name]);
  console.log(`[PG] medic users.id=${doc.id}, clinici: ${doctor.clinicIds.join(', ')}`);

  const pat = await users.upsertFromAuth0(ids.patient, { email: patient.email, name: patient.name }, { role: 'patient' });
  await users.updateProfile(pat.id, { name: patient.name, phone: patient.phone, birth_date: patient.birthDate, sex: patient.sex });
  await medical.save(pat.id, {
    bloodType: 'A+',
    allergies: ['Penicilină', 'Polen'],
    conditions: ['Astm bronșic ușor'],
    medications: [{ name: 'Salbutamol inhalator', dose: 'la nevoie' }]
  });

  // Fresh appointments every time the script runs
  await db.query('DELETE FROM appointments WHERE patient_id = $1', [pat.id]);
  const add = (placeId, day, time, reason, status, extra = {}) =>
    db.query(
      `INSERT INTO appointments (patient_id, place_id, day, time, reason, status, doctor_id, diagnosis, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [pat.id, placeId, day, time, reason, status, extra.doctorId ?? null, extra.diagnosis ?? null, extra.notes ?? null]
    );
  await add('medlife-spital', isoDay(1), '10:00', 'Tuse persistentă de două săptămâni', 'pending');
  await add('medlife-eroilor', isoDay(3), '15:30', 'Control anual', 'confirmed', { doctorId: doc.id });
  await add('medlife-spital', isoDay(-30), '09:00', 'Dificultăți de respirație la efort', 'completed', {
    doctorId: doc.id,
    diagnosis: 'Astm bronșic ușor, controlat',
    notes: 'Spirometrie normală după bronhodilatator. Continuă tratamentul la nevoie.'
  });
  console.log(`[PG] pacient users.id=${pat.id}: fișă medicală + 3 programări`);
}

async function remove() {
  for (const a of Object.values(DEMO)) {
    if (auth0.isConfigured()) {
      for (const u of await auth0.usersByEmail(a.email)) {
        await auth0.deleteUser(u.user_id);
        console.log(`[Auth0] ${a.email}: șters (${u.user_id})`);
      }
    }
    if (db.isEnabled()) {
      const { rowCount } = await db.query('DELETE FROM users WHERE lower(email) = lower($1)', [a.email]);
      console.log(`[PG] ${a.email}: ${rowCount} rând(uri) șterse`);
    }
  }
}

async function main() {
  if (!db.isEnabled() && !auth0.isConfigured()) {
    throw new Error('Setează DATABASE_URL și/sau AUTH0_MGMT_CLIENT_ID + AUTH0_MGMT_CLIENT_SECRET în backend/.env');
  }
  if (db.isEnabled()) await migrate({ log: () => {} });
  if (process.argv.includes('--remove')) return remove();

  const ids = { doctor: 'demo|doctor', patient: 'demo|patient' };
  if (auth0.isConfigured()) {
    ids.doctor = await ensureAuth0User(DEMO.doctor);
    ids.patient = await ensureAuth0User(DEMO.patient);
  } else {
    console.warn('[Auth0] Fără Machine to Machine: conturile apar doar în baza de date și nu se pot loga încă.');
  }
  if (db.isEnabled()) await seedDatabase(ids);
  else console.warn('[PG] DATABASE_URL lipsește: rândurile apar la prima logare (fără programări demo).');

  console.log(`\nGata. Logare cu parola "${PASSWORD}":\n  ${DEMO.doctor.email}  (medic)\n  ${DEMO.patient.email}  (pacient)`);
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error('Eroare:', err.message);
      process.exitCode = 1;
    })
    .finally(() => db.close());
}

module.exports = { DEMO, PASSWORD, seedDatabase };
