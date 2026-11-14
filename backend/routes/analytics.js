/**
 * Statistics from Tiger Data (real clicks only), see db/analytics.js.
 *   GET /api/analytics/popular-times/:placeId   "ore aglomerate" for one clinic
 *   GET /api/analytics/dashboard?days=7         the /#statistici page
 * Without TIGER_DATABASE_URL both answer 503 and the website hides them.
 */

const express = require('express');
const analytics = require('../db/analytics');
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
    res.json(await analytics.dashboard(req.query.days));
  }));

  return router;
};
