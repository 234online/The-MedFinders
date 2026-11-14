/**
 * Statistics from Tiger Data (real clicks only), see db/analytics.js.
 *   GET /api/analytics/popular-times/:placeId   "ore aglomerate" for one clinic
 *   GET /api/analytics/dashboard?days=7         the /#statistici page
 *   POST /api/views { placeId, source }         a clinic was opened
 *                                               (source: "popup" | "details")
 * Without TIGER_DATABASE_URL they answer 503 and the website hides them.
 * The dashboard also counts favourites from the Render database, when set.
 */

const express = require('express');
const analytics = require('../db/analytics');
const db = require('../db/pool');
const favorites = require('../repositories/favorites');
const { placeId } = require('./validate');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = function analyticsRoutes() {
  const router = express.Router();

  const needTiger = (_req, res, next) =>
    analytics.isEnabled() ? next() : res.status(503).json({ error: 'Tiger Data (TIGER_DATABASE_URL) nu este configurat pe server' });

  router.get('/api/analytics/popular-times/:placeId', needTiger, wrap(async (req, res) => {
    const { value: code, error } = placeId(req.params.placeId);
    if (error) return res.status(400).json({ error });
    res.json(await analytics.popularTimes(code));
  }));

  router.get('/api/analytics/dashboard', needTiger, wrap(async (req, res) => {
    const data = await analytics.dashboard(req.query.days);
    // Favourites live on Render (favorites table); null if that database isn't set
    let favs = null;
    if (db.isEnabled()) {
      try {
        const byPlace = await favorites.countsSince(new Date(data.from));
        favs = { total: Object.values(byPlace).reduce((a, b) => a + b, 0), byPlace };
      } catch (err) {
        console.error('[PG] Favorite indisponibile:', err.message);
      }
    }
    res.json({ ...data, favorites: favs });
  }));

  // Visits: the same browser opening the same clinic again within 10 minutes
  // counts once, so reopening a popup doesn't inflate the numbers.
  const recent = new Map();
  const TEN_MINUTES = 10 * 60 * 1000;

  router.post('/api/views', needTiger, wrap(async (req, res) => {
    const { value: code, error } = placeId(req.body?.placeId);
    const source = req.body?.source;
    if (error || !analytics.VIEW_SOURCES.includes(source)) {
      return res.status(400).json({ error: 'Trimite { placeId, source: "popup" | "details" }' });
    }
    const key = `${req.ip}|${code}|${source}`;
    const now = Date.now();
    if (now - (recent.get(key) ?? 0) < TEN_MINUTES) return res.status(204).end();
    recent.set(key, now);
    if (recent.size > 20000) {
      for (const [k, t] of recent) if (now - t > TEN_MINUTES) recent.delete(k);
    }
    await analytics.recordView({ placeCode: code, source });
    res.status(201).json({ placeId: code, source });
  }));

  return router;
};
