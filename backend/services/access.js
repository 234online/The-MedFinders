/**
 * Changing someone's account type (patient -> doctor).
 *
 * Auth0 app_metadata is the source of truth for roles: at every login the
 * Auth0 Action puts it into the token and the backend copies it into the
 * database (see backend/auth0/README.md). So a role has to be written to
 * Auth0 AND to the database, or the next login would undo it.
 * Writing to Auth0 needs the Machine to Machine app (AUTH0_MGMT_CLIENT_ID /
 * AUTH0_MGMT_CLIENT_SECRET); without it only the database is updated.
 */

const users = require('../repositories/users');
const auth0 = require('../scripts/auth0Management');

/**
 * Makes `user` a doctor at `placeIds` (added to the clinics they already
 * have, if they were a doctor before).
 * Returns { user, auth0: 'updated' | 'not-configured' }.
 */
async function grantDoctor(user, { placeIds, specialty }) {
  const clinicIds = users.cleanClinicIds([...(user.role === 'doctor' ? user.clinic_ids ?? [] : []), ...placeIds]);

  let auth0Result = 'not-configured';
  if (auth0.isConfigured()) {
    // Auth0 merges app_metadata keys: clinic_id: null removes the old single-clinic key
    await auth0.updateUser(user.auth0_id, {
      app_metadata: { role: 'doctor', clinic_ids: clinicIds, clinic_id: null, specialty }
    });
    auth0Result = 'updated';
  }
  const updated = await users.setAccess(user.id, { role: 'doctor', clinicIds, specialty });
  return { user: updated, auth0: auth0Result };
}

module.exports = { grantDoctor };
