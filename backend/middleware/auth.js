/**
 * Login checks for the API.
 *
 * The frontend logs in with Auth0 (email + password, or Google) and sends
 * the Auth0 access token in "Authorization: Bearer ...". Here the token is
 * checked and the matching row from the users table is put on req.user.
 *
 *   requireUser        -> 401 without a valid login
 *   optionalUser       -> req.user when logged in, nothing otherwise
 *   requireRole(role)  -> logged in AND users.role = role (e.g. 'admin').
 *                         'admin' also accepts the x-admin-key header.
 */

const { auth } = require('express-oauth2-jwt-bearer');
const db = require('../db/pool');
const users = require('../repositories/users');

const asyncMw = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Runs several middlewares one after another
const chain = (list) => (req, res, next) => {
  let i = 0;
  const step = (err) => {
    if (err || i === list.length) return next(err);
    try {
      list[i++](req, res, step);
    } catch (e) {
      next(e);
    }
  };
  step();
};

function createAuth({ authConfig, adminKey }) {
  const unavailable = (what) => (_req, res) =>
    res.status(503).json({ error: `${what} nu este configurat pe server` });

  const needDb = (req, res, next) => (db.isEnabled() ? next() : unavailable('Baza de date PostgreSQL')(req, res));
  const checkJwt = authConfig ? auth(authConfig) : unavailable('Auth0');
  const checkJwtIfPresent = authConfig ? auth({ ...authConfig, authRequired: false }) : (_req, _res, next) => next();

  const loadUser = asyncMw(async (req, _res, next) => {
    const sub = req.auth?.payload?.sub;
    if (sub) req.user = await users.upsertFromAuth0(sub);
    next();
  });

  const requireUser = chain([needDb, checkJwt, loadUser]);
  const optionalUser = chain([needDb, checkJwtIfPresent, loadUser]);

  const requireRole = (role) => {
    const byLogin = chain([
      requireUser,
      (req, res, next) =>
        req.user.role === role ? next() : res.status(403).json({ error: `Necesită rolul "${role}"` })
    ]);
    return (req, res, next) => {
      if (role === 'admin' && adminKey && req.get('x-admin-key') === adminKey) return next();
      return byLogin(req, res, next);
    };
  };

  return { requireUser, optionalUser, requireRole };
}

module.exports = { createAuth };
