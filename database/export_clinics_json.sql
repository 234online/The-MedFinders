-- =====================================================================
--  EXPORT THE CLINICS DATABASE AS JSON FOR THE WEBSITE
--  Produces the file src/data/clinics.json (inside the frontend folder)
--  (same table and column names as the database).
--
--  Easiest way (terminal, from the frontend folder):
--    psql -d Clinics_db -At -f database/export_clinics_json.sql > src/data/clinics.json
--  (add -U postgres -h localhost if psql asks who you are)
--
--  pgAdmin: open this file in the Query Tool, press F5, then copy the
--  single result cell into src/data/clinics.json.
--
--  Run it again whenever the database changes.
-- =====================================================================

SELECT jsonb_pretty(jsonb_build_object(
  'exported_on', to_char(CURRENT_DATE, 'YYYY-MM-DD'),

  -- All specialties (the website groups them by category_ro)
  'specialties', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
             'code', s.code,
             'name_ro', s.name_ro,
             'name_en', s.name_en,
             'category_ro', s.category_ro,
             'category_en', s.category_en
           ) ORDER BY s.category_ro, s.name_ro), '[]'::jsonb)
    FROM specialties s
  ),

  -- One object per clinic, with its related rows nested inside
  'clinics', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'code',          c.code,
      'name',          c.name,
      'network',       c.network,
      'ownership',     c.ownership,
      'kind',          c.kind,
      'address',       c.address,
      'postal_code',   c.postal_code,
      'phone',         c.phone,
      'email',         c.email,
      'website',       c.website,
      'cnas_contract', c.cnas_contract,
      'latitude',      c.latitude,
      'longitude',     c.longitude,
      'geo_precision', c.geo_precision,
      'notes',         c.notes,

      'specialties', (
        SELECT COALESCE(jsonb_agg(s.code ORDER BY s.name_ro), '[]'::jsonb)
        FROM clinic_specialties cs
        JOIN specialties s ON s.specialty_id = cs.specialty_id
        WHERE cs.clinic_id = c.clinic_id
      ),

      'opening_hours', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
                 'day_of_week', oh.day_of_week,
                 'open_time',   to_char(oh.open_time,  'HH24:MI'),
                 'close_time',  to_char(oh.close_time, 'HH24:MI'),
                 'is_closed',   oh.is_closed,
                 'is_24h',      oh.is_24h,
                 'notes',       oh.notes
               ) ORDER BY oh.day_of_week), '[]'::jsonb)
        FROM opening_hours oh
        WHERE oh.clinic_id = c.clinic_id
      ),

      'doctors', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
                 'full_name', d.full_name,
                 'title',     d.title,
                 'specialty', s.code,
                 'role',      da.role,
                 'schedule', (
                   SELECT COALESCE(jsonb_agg(jsonb_build_object(
                            'day_of_week', ds.day_of_week,
                            'start_time',  to_char(ds.start_time, 'HH24:MI'),
                            'end_time',    to_char(ds.end_time,   'HH24:MI')
                          ) ORDER BY ds.day_of_week, ds.start_time), '[]'::jsonb)
                   FROM doctor_schedules ds
                   WHERE ds.assignment_id = da.assignment_id
                 )
               ) ORDER BY d.full_name), '[]'::jsonb)
        FROM doctor_assignments da
        JOIN doctors d          ON d.doctor_id = da.doctor_id
        LEFT JOIN specialties s ON s.specialty_id = da.specialty_id
        WHERE da.clinic_id = c.clinic_id
      ),

      'ratings', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
                 'platform',     r.platform,
                 'score',        r.score,
                 'max_score',    r.max_score,
                 'votes',        r.votes,
                 'retrieved_on', to_char(r.retrieved_on, 'YYYY-MM-DD'),
                 'source_url',   r.source_url
               ) ORDER BY r.platform), '[]'::jsonb)
        FROM ratings r
        WHERE r.clinic_id = c.clinic_id
      ),

      'sources', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
                 'url',          cs.url,
                 'confirms',     cs.confirms,
                 'retrieved_on', to_char(cs.retrieved_on, 'YYYY-MM-DD')
               ) ORDER BY cs.url), '[]'::jsonb)
        FROM clinic_sources cs
        WHERE cs.clinic_id = c.clinic_id
      )
    ) ORDER BY c.clinic_id), '[]'::jsonb)
    FROM clinics c
  )
));
