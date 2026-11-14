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

  // Optional: lets scripts change clinics with the "x-admin-key" header
  adminApiKey: process.env.ADMIN_API_KEY || null
};
