/**
 * ANALYTICS ON TIGER DATA (TimescaleDB): "ore aglomerate" for each clinic
 * and the demand dashboard. Real data only: every row is a real
 * Call / WhatsApp / Email click made on the website.
 *
 * Needs TIGER_DATABASE_URL (Tiger Cloud -> service -> Connect). Without it
 * these features are turned off and the website hides them.
 *
 * Tables, continuous aggregate and compression: see analytics.sql
 * (created automatically when the backend starts).
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const TIGER_URL = (process.env.TIGER_DATABASE_URL || '').trim();
const TIME_ZONE = 'Europe/Bucharest';
const KINDS = ['call', 'whatsapp', 'email'];
const MAX_WEEKS = 8; // popular times look at up to the last 8 weeks
const MIN_CLICKS = 10; // fewer clicks than this for a clinic = "not enough data yet"

const pool = TIGER_URL
  ? new Pool({ connectionString: TIGER_URL, ssl: { rejectUnauthorized: false }, max: 5 })
  : null;
if (pool) pool.on('error', (err) => console.error('[Tiger] Conexiune închisă:', err.message));

let ready = false;
const isEnabled = () => Boolean(pool) && ready;

// ---------------------------------------------------------------------
// Start-up: create the hypertable, continuous aggregate and compression
// ---------------------------------------------------------------------
async function init() {
  if (!pool) {
    console.warn('[Tiger] TIGER_DATABASE_URL lipsește: statisticile sunt dezactivate');
    return;
  }
  const sql = fs.readFileSync(path.join(__dirname, 'analytics.sql'), 'utf-8');
  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.replace(/^\s*--.*$/gm, '').trim())
    .filter(Boolean);
  // One by one: a continuous aggregate can't be created inside a transaction
  for (const statement of statements) await pool.query(statement);
  ready = true;
  console.log('[Tiger] Conectat: hypertable, continuous aggregate și compresie pregătite');
}

// ---------------------------------------------------------------------
// Record one real click
// ---------------------------------------------------------------------
async function record({ placeCode, kind, userId = null }) {
  if (!isEnabled() || !placeCode || !KINDS.includes(kind)) return;
  await pool.query('INSERT INTO contact_activity (time, place_code, kind, user_id) VALUES (now(), $1, $2, $3)', [
    placeCode,
    kind,
    userId
  ]);
}

// Day of week (1 = Monday) and hour, in Timișoara
const local = (column) => `extract(isodow FROM ${column} AT TIME ZONE '${TIME_ZONE}')::int AS dow,
       extract(hour   FROM ${column} AT TIME ZONE '${TIME_ZONE}')::int AS hour`;

// ---------------------------------------------------------------------
// Popular times for one clinic
// ---------------------------------------------------------------------
async function popularTimes(placeCode) {
  const [hist, info, now] = await Promise.all([
    pool.query(
      `SELECT ${local('bucket')}, sum(contacts)::int AS n
       FROM contact_activity_hourly
       WHERE place_code = $1 AND bucket >= now() - INTERVAL '${MAX_WEEKS} weeks'
       GROUP BY 1, 2`,
      [placeCode]
    ),
    pool.query(
      `SELECT count(*)::int AS total, min(time) AS first
       FROM contact_activity
       WHERE place_code = $1 AND time >= now() - INTERVAL '${MAX_WEEKS} weeks'`,
      [placeCode]
    ),
    pool.query(
      `SELECT ${local('now()')},
              (SELECT count(*)::int FROM contact_activity
               WHERE place_code = $1 AND time > now() - INTERVAL '1 hour') AS last_hour`,
      [placeCode]
    )
  ]);

  const total = info.rows[0].total;
  const { dow, hour, last_hour: lastHour } = now.rows[0];
  const base = { source: 'tiger', placeCode, total, minClicks: MIN_CLICKS, now: { dow, hour, lastHour } };
  if (total < MIN_CLICKS) return { ...base, enoughData: false, days: null };

  // Average per week, over the weeks we actually have data for (max 8)
  const first = new Date(info.rows[0].first).getTime();
  const weeks = Math.min(MAX_WEEKS, Math.max(1, Math.ceil((Date.now() - first) / (7 * 24 * 3600 * 1000))));
  const days = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const r of hist.rows) days[r.dow - 1][r.hour] += r.n;
  const averages = days.map((h) => h.map((n) => Math.round((n / weeks) * 10) / 10));
  const usual = averages[dow - 1][hour];

  return { ...base, enoughData: true, weeks, days: averages, now: { ...base.now, usual, level: levelFor(lastHour, usual) } };
}

function levelFor(now, usual) {
  if (usual < 0.3) return now > 0 ? 'busier' : 'quiet';
  const ratio = now / usual;
  if (ratio >= 1.4) return 'busier';
  if (ratio <= 0.6) return 'quieter';
  return 'usual';
}

// ---------------------------------------------------------------------
// Demand dashboard
// ---------------------------------------------------------------------
async function dashboard(rangeDays = 7) {
  const days = Math.min(Math.max(Number(rangeDays) || 7, 1), 56);
  const step = days <= 2 ? 'hour' : 'day';
  // Hours: the last N x 24 hours. Days: whole days from local midnight (today counts as one).
  const fromSql =
    step === 'hour'
      ? `now() - INTERVAL '${days * 24} hours'`
      : `(date_trunc('day', now() AT TIME ZONE '${TIME_ZONE}') - INTERVAL '${days - 1} days') AT TIME ZONE '${TIME_ZONE}'`;

  const { rows } = await pool.query(`SELECT ${fromSql} AS "from", now() AS now`);
  const from = rows[0].from;
  const nowTs = rows[0].now;
  const prevFrom = new Date(from.getTime() - (nowTs.getTime() - from.getTime()));

  const [tot, prev, places, heatRows, line, rec, firstRow] = await Promise.all([
    pool.query('SELECT kind, sum(contacts)::int AS n FROM contact_activity_hourly WHERE bucket >= $1 GROUP BY kind', [from]),
    pool.query(
      'SELECT kind, sum(contacts)::int AS n FROM contact_activity_hourly WHERE bucket >= $1 AND bucket < $2 GROUP BY kind',
      [prevFrom, from]
    ),
    pool.query('SELECT place_code, sum(contacts)::int AS n FROM contact_activity_hourly WHERE bucket >= $1 GROUP BY 1', [from]),
    pool.query(
      `SELECT ${local('bucket')}, sum(contacts)::int AS n FROM contact_activity_hourly WHERE bucket >= $1 GROUP BY 1, 2`,
      [from]
    ),
    pool.query(
      `SELECT time_bucket($2::interval, bucket, '${TIME_ZONE}') AS t, kind, sum(contacts)::int AS n
       FROM contact_activity_hourly WHERE bucket >= $1
       GROUP BY 1, 2 ORDER BY 1`,
      [from, step === 'hour' ? '1 hour' : '1 day']
    ),
    pool.query('SELECT time, place_code, kind FROM contact_activity ORDER BY time DESC LIMIT 8'),
    pool.query('SELECT min(time) AS first FROM contact_activity')
  ]);

  const totals = { call: 0, whatsapp: 0, email: 0 };
  const previous = { call: 0, whatsapp: 0, email: 0 };
  const byPlace = {};
  const heat = Array.from({ length: 7 }, () => Array(24).fill(0));
  const timeline = new Map();
  tot.rows.forEach((r) => (totals[r.kind] = r.n));
  prev.rows.forEach((r) => (previous[r.kind] = r.n));
  places.rows.forEach((r) => (byPlace[r.place_code] = r.n));
  heatRows.rows.forEach((r) => (heat[r.dow - 1][r.hour] += r.n));
  line.rows.forEach((r) => {
    const key = new Date(r.t).getTime();
    const slot = timeline.get(key) ?? { t: key, call: 0, whatsapp: 0, email: 0 };
    slot[r.kind] += r.n;
    timeline.set(key, slot);
  });

  const first = firstRow.rows[0].first;
  return {
    source: 'tiger',
    days,
    step,
    generatedAt: nowTs.getTime(),
    // No trend while the previous period is from before the first click
    hasPrevious: Boolean(first) && new Date(first) <= prevFrom,
    totals,
    previous,
    byPlace,
    heat,
    timeline: [...timeline.values()].sort((a, b) => a.t - b.t),
    recent: rec.rows.map((r) => ({ t: new Date(r.time).getTime(), placeCode: r.place_code, kind: r.kind })),
    storage: await storageStats()
  };
}

// How much space compression saves
async function storageStats() {
  try {
    const [chunks, comp] = await Promise.all([
      pool.query(
        `SELECT count(*)::int AS total, count(*) FILTER (WHERE is_compressed)::int AS compressed
         FROM timescaledb_information.chunks WHERE hypertable_name = 'contact_activity'`
      ),
      pool.query(
        `SELECT sum(before_compression_total_bytes)::bigint AS before,
                sum(after_compression_total_bytes)::bigint  AS after
         FROM hypertable_compression_stats('contact_activity')`
      )
    ]);
    const before = Number(comp.rows[0]?.before) || 0;
    const after = Number(comp.rows[0]?.after) || 0;
    return {
      chunks: chunks.rows[0].total,
      compressedChunks: chunks.rows[0].compressed,
      savedPercent: before ? Math.round((1 - after / before) * 100) : null
    };
  } catch (err) {
    console.warn('[Tiger] Statistici compresie indisponibile:', err.message);
    return null;
  }
}

module.exports = { init, isEnabled, record, popularTimes, dashboard, KINDS };
