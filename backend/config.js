/**
 * All settings come from environment variables
 * (backend/.env locally, Render -> Environment online). See .env.example.
 */

require('dotenv').config();

const AUTH0_DOMAIN = (process.env.AUTH0_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

module.exports = {
  port: process.env.PORT || 5000,

  // Websites allowed to call the API, comma separated (local + Vercel)
  frontendUrls: (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((u) => u.trim().replace(/\/$/, ''))
    .filter(Boolean),

  // Auth0 -> Applications -> APIs -> your API (Identifier = audience)
  authConfig:
    AUTH0_DOMAIN && AUTH0_AUDIENCE
      ? { issuerBaseURL: `https://${AUTH0_DOMAIN}/`, audience: AUTH0_AUDIENCE }
      : null,

  // Prefix of the custom claims the Auth0 Action adds to the access token
  // (role, clinic_id, specialty). Must match NAMESPACE in auth0/post-login-action.js.
  auth0ClaimNamespace: (process.env.AUTH0_CLAIM_NAMESPACE || 'https://timicarenow.app').replace(/\/$/, ''),

  // Optional: Auth0 Management API (Machine to Machine app), used by
  // scripts/set_role.js to write the role into Auth0 app_metadata.
  auth0Domain: AUTH0_DOMAIN || null,
  auth0Management:
    process.env.AUTH0_MGMT_CLIENT_ID && process.env.AUTH0_MGMT_CLIENT_SECRET
      ? { clientId: process.env.AUTH0_MGMT_CLIENT_ID, clientSecret: process.env.AUTH0_MGMT_CLIENT_SECRET }
      : null,

  // Optional: lets scripts change clinics with the "x-admin-key" header
  adminApiKey: process.env.ADMIN_API_KEY || null,

  // Optional: Tiger Data (TimescaleDB) for the statistics ("ore aglomerate",
  // /#statistici). Tiger Cloud -> service -> Connect -> Service URL.
  // Without it the statistics are off and the website hides them.
  tigerDatabaseUrl: (process.env.TIGER_DATABASE_URL || '').trim() || null
};
