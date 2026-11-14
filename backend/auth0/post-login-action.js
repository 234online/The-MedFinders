/**
 * AUTH0 ACTION: "Add TimiCareNow role"  (Trigger: Login / Post Login)
 *
 * Copy this whole file into Auth0 Dashboard -> Actions -> Library ->
 * Create Action -> "Login / Post Login", then Deploy it and drag it into
 * Actions -> Triggers -> post-login. Setup steps: backend/auth0/README.md
 *
 * It reads the account type from the user's app_metadata (which only an
 * admin or scripts/set_role.js can change, never the user) and adds it to
 * the tokens:
 *   access token -> the backend copies it into users.role / doctor_clinics / users.specialty
 *   ID token     -> the website shows the doctor portal to doctors
 *
 *   app_metadata example for a doctor working at two clinics:
 *   { "role": "doctor", "clinic_ids": ["medlife-spital", "medlife-eroilor"], "specialty": "Cardiologie" }
 *   ("clinic_id": "medlife-spital" also works for a single clinic)
 *   Users without app_metadata.role are patients.
 */

// Must match AUTH0_CLAIM_NAMESPACE in the backend (default below) and
// ROLE_CLAIM in frontend/src/account/useAccount.js
const NAMESPACE = 'https://timicarenow.app';
const ROLES = ['patient', 'doctor', 'admin'];

exports.onExecutePostLogin = async (event, api) => {
  const meta = event.user.app_metadata || {};
  // Auth0 RBAC roles (User Management -> Roles) also work: a role named
  // "doctor" or "admin" counts the same as app_metadata.role
  const rbac = (event.authorization && event.authorization.roles) || [];
  let role = ROLES.includes(meta.role) ? meta.role : 'patient';
  if (rbac.includes('admin')) role = 'admin';
  else if (rbac.includes('doctor') && role === 'patient') role = 'doctor';

  const claims = { role };
  if (role === 'doctor') {
    const clinics = Array.isArray(meta.clinic_ids) ? meta.clinic_ids : meta.clinic_id ? [meta.clinic_id] : [];
    claims.clinic_ids = clinics.map(String);
    if (meta.specialty) claims.specialty = String(meta.specialty);
  }

  for (const [key, value] of Object.entries(claims)) {
    api.accessToken.setCustomClaim(`${NAMESPACE}/${key}`, value);
    api.idToken.setCustomClaim(`${NAMESPACE}/${key}`, value);
  }
};
