/**
 * Small helper for the Auth0 Management API, used by the scripts
 * (set_role.js, seed_demo.js). Needs a Machine to Machine app with the
 * scopes read:users, update:users, create:users, delete:users
 * (see auth0/README.md):
 *   AUTH0_DOMAIN, AUTH0_MGMT_CLIENT_ID, AUTH0_MGMT_CLIENT_SECRET
 */

const config = require('../config');

const isConfigured = () => Boolean(config.auth0Domain && config.auth0Management);
// The Auth0 "Database" connection that stores email + password logins
const DB_CONNECTION = process.env.AUTH0_DB_CONNECTION || 'Username-Password-Authentication';

let cachedToken = null;
async function token() {
  if (cachedToken) return cachedToken;
  const { clientId, clientSecret } = config.auth0Management;
  const res = await fetch(`https://${config.auth0Domain}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${config.auth0Domain}/api/v2/`
    })
  });
  if (!res.ok) throw new Error(`Auth0 token: ${res.status} ${await res.text()}`);
  cachedToken = (await res.json()).access_token;
  return cachedToken;
}

async function api(method, path, body) {
  const res = await fetch(`https://${config.auth0Domain}/api/v2${path}`, {
    method,
    headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(`Auth0 ${method} ${path}: ${res.status} ${data?.message || ''}`);
    error.status = res.status;
    error.auth0 = data;
    throw error;
  }
  return data;
}

const usersByEmail = (email) => api('GET', `/users-by-email?email=${encodeURIComponent(email)}`);
const updateUser = (userId, changes) => api('PATCH', `/users/${encodeURIComponent(userId)}`, changes);
const createUser = (user) => api('POST', '/users', { connection: DB_CONNECTION, ...user });
const deleteUser = (userId) => api('DELETE', `/users/${encodeURIComponent(userId)}`);

module.exports = { isConfigured, DB_CONNECTION, usersByEmail, updateUser, createUser, deleteUser };
