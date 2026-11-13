# TimiCareNow

A website by **The MedFinders** that helps people in Timișoara find the clinic they need, fast and easily.

> For medical emergencies call **112**. The information on this site (opening hours, phone numbers) was collected on 2026-11-13 and can change; call the clinic before you go.

## What is in this repository

| Folder | What it is | Status |
|---|---|---|
| `frontend/` | React + Vite app with a Leaflet map and a search bar | Works, but still reads the sample file `src/data/places.json` (landmarks, not clinics) |
| `backend/` | Express server (`index.js`) | Only a skeleton: no routes and no database connection yet |
| `database/` | `timisoara_clinics.sql`, the full clinics database for PostgreSQL | Ready to run |

## Setting up the database

The database is **not** stored in Git. Git only carries the `.sql` script, so everyone on the team has to build the database once on their own computer.

You need PostgreSQL (version 12 or newer) and pgAdmin.

1. Open pgAdmin and connect to your local server.
2. Right-click **Databases** → **Create** → **Database…**, name it `Clinics_db`, and save.
3. Right-click `Clinics_db` → **Query Tool**.
4. Click the folder icon (**Open File**) and choose `database/timisoara_clinics.sql`.
5. Press **F5**.

The script is safe to run again at any time: it deletes the old tables first and rebuilds everything. Run it again whenever the `.sql` file changes after a `git pull`.

To check that it worked, run this in the Query Tool. It should return 100 rows:

```sql
SELECT * FROM v_clinic_overview;
```

## What is in the database

100 real clinics, hospitals, laboratories and practices in Timișoara. A place is included only if a source gave its name, street address, phone number, opening hours and at least one specialty.

| Table | Contents |
|---|---|
| `clinics` | One row per place: name, network, kind, address, phone, email, website, CNAS contract, map coordinates, and a readable `specialties` list |
| `specialties` | The 43 medical specialties (Romanian and English names) and the filter category each belongs to |
| `clinic_specialties` | Which clinic offers which specialty |
| `opening_hours` | One row per clinic per day (1 = Monday … 7 = Sunday) |
| `doctors`, `doctor_assignments`, `doctor_schedules` | Doctors, where they work, and when |
| `ratings` | Aggregate public ratings with their source |
| `clinic_sources` | The web page each piece of information came from |
| `v_clinic_overview` | A view that joins the main tables into one readable summary |

More example queries are at the bottom of the `.sql` file.

### Things to know when using the data

- **No empty values in `clinics`.** Every column is filled. When the real value is not known, a fixed text is stored instead, so treat these as "no value" on the site (for example, do not turn them into links):
  - `email`, `website`, `postal_code`: `not listed`
  - `cnas_contract`: `yes`, `no` or `unknown` (81 clinics are `unknown`)
  - `network`: `Independent` when the clinic is not part of a chain
- **Filters.** `specialties.category_ro` / `category_en` group the specialties into 8 menu sections (General care, Dental, Mental health, …). `clinics.specialties` is a ready-to-display text list; for filtering, use the `clinic_specialties` link table, not that text.
- **Map coordinates.** `latitude` and `longitude` are ready for Leaflet. `geo_precision` is `exact` when the pin is on the building and `street` when it is only on the right street (14 clinics).
- **Hospital hours are not general opening hours.** For hospitals the stored hours are either the emergency department or an appointment desk. The `notes` column in `opening_hours` says which, so show it on the site.
- **A missing day means "unknown", not "closed".** A clinic is closed on a day only when `is_closed` is `TRUE`.
- **Hours past midnight.** When `close_time` is earlier than `open_time` (for example 15:00 → 08:00), the clinic stays open overnight.
- **Midday breaks.** Each day has one interval, from first opening to last closing. A break is written in `notes`.
- **Search without diacritics.** People type "Timisoara" and "Sagului", the data says "Timișoara" and "Șagului". PostgreSQL's `unaccent` extension handles this.

## Running the frontend

```bash
cd frontend
npm install
npm run dev
```

## Backend

The backend is not runnable yet: it has no `package.json`, no routes and it never starts listening. When it is connected to the database, keep the database password in `backend/.env` (already ignored by Git) and never write it in the code. A typical `.env`:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=Clinics_db
DB_USER=postgres
DB_PASSWORD=your-own-password
```
