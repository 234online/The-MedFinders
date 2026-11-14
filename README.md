# TimiCareNow

**Find the right clinic in Timișoara, fast.** TimiCareNow is a map of 100 real hospitals, clinics, laboratories and private practices in Timișoara, with search, filters, an AI assistant, online appointment requests and a portal for doctors. Built by **The MedFinders**.

Live site: <https://timicarenow-medfinders-unihack.vercel.app>

> **For medical emergencies call 112.** Opening hours and phone numbers were collected on 2026-11-13 and can change; call the clinic before you go.

---

## Contents

- [What it does](#what-it-does)
- [Technologies](#technologies)
- [How it fits together](#how-it-fits-together)
- [Repository structure](#repository-structure)
- [Run it locally](#run-it-locally)
  - [1. Quick start: website only](#1-quick-start-website-only)
  - [2. Full setup: accounts, appointments, doctors](#2-full-setup-accounts-appointments-doctors)
  - [3. Optional: AI assistant, voice, statistics](#3-optional-ai-assistant-voice-statistics)
- [Environment variables](#environment-variables)
- [Useful scripts](#useful-scripts)
- [The clinics database](#the-clinics-database)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## What it does

### For everyone (no account needed)

- **Interactive map** of 100 medical facilities, with colour-coded pins per type (hospital, polyclinic, clinic, dental clinic, laboratory, imaging centre, private practice).
- **Search** by clinic name, specialty, doctor, network or address, with or without Romanian diacritics.
- **Filters**: 43 specialties grouped into domains, facility type, open now, open 24/7, open at the weekend, emergency hospitals, for children, minimum rating.
- **"What's wrong?" symptom guide**: describe a problem and get the specialty that usually handles it, with warnings to call 112 for red-flag symptoms.
- **Near me**: the closest suitable clinic to your location.
- **Clinic details**: opening hours (with "open now"), specialties, doctors, ratings and reviews, and one-tap **Call / WhatsApp / Email** buttons.
- **AI assistant** (Google Gemini or Anthropic Claude) that searches the real clinic data and answers in Romanian, English or Hungarian, with optional **voice** input and spoken answers (ElevenLabs).
- **Popular times** per clinic and a **public statistics dashboard** (`/#statistici`), built only from real clicks on the site.
- **Three languages** (Romanian, English, Hungarian) and an **accessible mode** (larger text, higher contrast).

### For patients (with an account)

- Log in or sign up with email + password or **Google** (Auth0).
- **Favourite clinics**, saved in the database.
- **Online appointment requests** at clinics that have doctors on the site: choose a specific doctor or "any doctor", a day, a time and a reason.
- **My appointments**: status (pending, confirmed, completed, cancelled), cancel, and the doctor's diagnosis after the visit.
- **Medical record**: blood type, allergies, chronic conditions, medication.
- **Medical documents**: upload PDFs, images (PNG, JPG, WebP, TIFF, HEIC…) or text files: medical letters, blood tests, MRI / X-ray images. The doctors who treat you can open them.
- Edit your profile, see your contact history, or delete your data.

### For doctors (`/#doctor`)

- Sign up as a doctor by choosing **"Doctor"** in the login window and sending a request (clinics, specialty, College of Physicians number). An **admin approves** it before the account becomes a doctor account.
- **Dashboard** of appointment requests at all your clinics: today / upcoming / past, accept, decline or complete with a diagnosis and notes.
- **Patient record**: age, allergies (highlighted), conditions, medication, uploaded documents and visit history. Only for patients who sent a request to the doctor's clinic, for that doctor or for "any doctor".

### For admins

- Approve or reject doctor account requests from **My account**.

---

## Technologies

| Part | Technologies |
|---|---|
| **Frontend** | [React 18](https://react.dev), [Vite 5](https://vitejs.dev), [Leaflet](https://leafletjs.com) + [React Leaflet](https://react-leaflet.js.org) with OpenStreetMap tiles, [Tabler Icons](https://tabler.io/icons), [Auth0 React SDK](https://github.com/auth0/auth0-react) |
| **Backend** | [Node.js](https://nodejs.org) + [Express 4](https://expressjs.com), [node-postgres (`pg`)](https://node-postgres.com), [`express-oauth2-jwt-bearer`](https://github.com/auth0/node-oauth2-jwt-bearer) (checks Auth0 login tokens), `cors`, `dotenv` |
| **Databases** | [PostgreSQL](https://www.postgresql.org) for users, favourites, appointments, medical records and documents (on [Render](https://render.com)); the clinics data is a PostgreSQL script (`database/timisoara_clinics.sql`); optional [Tiger Data / TimescaleDB](https://www.tigerdata.com) for the statistics |
| **Login** | [Auth0](https://auth0.com): email + password, Google, roles via an Auth0 Action |
| **AI** | [Google Gemini](https://ai.google.dev) or [Anthropic Claude](https://www.anthropic.com/api), with tool calls that search the clinic data |
| **Voice** | [ElevenLabs](https://elevenlabs.io): speech-to-text and text-to-speech |
| **Hosting** | Frontend + AI/voice serverless functions on [Vercel](https://vercel.com); backend and PostgreSQL on [Render](https://render.com) |

---

## How it fits together

```
                          ┌──────────────────────────────┐
                          │  Auth0 (login, Google, roles)│
                          └──────────────┬───────────────┘
                                         │ login token
┌────────────────────────────────────────▼──────────────────────────────┐
│ Browser: React + Vite + Leaflet (frontend/)                            │
│  • clinics come from frontend/src/data/clinics.json (database export)  │
└──────┬─────────────────────────────────────────────┬──────────────────┘
       │ /api/chat, /api/voice                       │ /api/... (with token)
┌──────▼───────────────────────────┐   ┌─────────────▼──────────────────────┐
│ Vercel functions (frontend/api/) │   │ Backend: Express (backend/)        │
│  • AI assistant → Gemini/Claude  │   │  • accounts, favourites, booking,  │
│  • voice → ElevenLabs            │   │    doctors, documents, admin       │
│  (locally: Vite dev server)      │   └─────────┬──────────────┬───────────┘
└──────────────────────────────────┘             │              │
                                      ┌──────────▼───────┐ ┌────▼─────────────┐
                                      │ PostgreSQL       │ │ Tiger Data       │
                                      │ (Render)         │ │ (statistics,     │
                                      │ users, bookings… │ │  optional)       │
                                      └──────────────────┘ └──────────────────┘
```

The website works **without** the backend: it then runs as a prototype with demo logins stored in the browser (see [Quick start](#1-quick-start-website-only)).

---

## Repository structure

```
.
├── frontend/                 React website (deployed on Vercel)
│   ├── src/
│   │   ├── App.jsx           page layout: start page, map, windows
│   │   ├── components/       map popups, clinic details, login, booking, account…
│   │   ├── doctor/           doctor portal (/#doctor)
│   │   ├── chat/             AI assistant + voice
│   │   ├── filters/          filter panel and filter logic
│   │   ├── account/          login (Auth0 / prototype), backend API calls
│   │   ├── config/           texts in 3 languages, categories, filters, sorting
│   │   ├── data/             clinics.json (database export) and how it's read
│   │   └── services/         opening hours, analytics
│   ├── server/               AI + voice proxies for the local dev server
│   ├── api/                  the same proxies as Vercel serverless functions
│   └── public/               icons, demo documents
├── backend/                  Express API (deployed on Render)
│   ├── index.js / app.js     start-up / routes and middleware
│   ├── routes/               places, account, booking, doctor, documents, admin…
│   ├── repositories/         SQL queries, one file per table
│   ├── middleware/auth.js    Auth0 token check, roles
│   ├── db/migrations/        database changes, run automatically at start-up
│   ├── auth0/                Auth0 setup guide and the post-login Action
│   └── scripts/              set-role, seed-demo, data sync
└── database/
    ├── timisoara_clinics.sql     the full clinics database (PostgreSQL)
    └── export_clinics_json.sql   exports it as frontend/src/data/clinics.json
```

---

## Run it locally

You need **[Node.js 18 or newer](https://nodejs.org)** (20 LTS recommended) and **Git**.

```bash
git clone https://github.com/234online/The-MedFinders.git
cd The-MedFinders
```

### 1. Quick start: website only

The map, search, filters, symptom guide, clinic details and a simple built-in chat work with no accounts and no keys.

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

Without a backend the site runs as a **prototype**: logins are kept only in your browser. Try the two demo accounts (password `123`):

| Email | Account |
|---|---|
| `pacient@timicarenow.app` | patient |
| `doctor@timicarenow.app` | doctor (open the portal at <http://localhost:5173/#doctor>, with demo patients) |

### 2. Full setup: accounts, appointments, doctors

This adds real logins, favourites in the database, appointment requests, the doctor portal with real patients, medical records and documents.

#### a) A PostgreSQL database

Use **either**:

- a local PostgreSQL (version 12+): create an empty database, e.g. `timicarenow`; the connection string is `postgresql://postgres:YOUR_PASSWORD@localhost:5432/timicarenow`
- **or** a Render PostgreSQL: copy its **External Database URL** (Render → database → Connect).

The backend creates all its tables by itself the first time it starts (`backend/db/migrations/`).

#### b) Auth0

1. Create a free tenant at [auth0.com](https://auth0.com).
2. **Applications → Applications → Create Application → Single Page Application.** In its **Settings**, add `http://localhost:5173` to *Allowed Callback URLs*, *Allowed Logout URLs* and *Allowed Web Origins*. Note the **Domain** and **Client ID**.
3. **Applications → APIs → Create API.** Pick any identifier, e.g. `https://api.timicarenow.app`: this is the **audience**. In the API's **Application Access** tab, allow your Single Page Application for user access.
4. For patient / doctor / admin roles, follow [`backend/auth0/README.md`](backend/auth0/README.md) (an Auth0 Action, and optionally a Machine to Machine app for approving doctors and creating the demo accounts).

#### c) Start the backend

Create `backend/.env`:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/timicarenow
AUTH0_DOMAIN=your-tenant.eu.auth0.com
AUTH0_AUDIENCE=https://api.timicarenow.app
```

```bash
cd backend
npm install
npm run dev
```

Check <http://localhost:5000/api/health>; it should show `"database":"ok","auth0":"configured"`.

#### d) Connect the website

Create `frontend/.env`:

```env
VITE_AUTH0_DOMAIN=your-tenant.eu.auth0.com
VITE_AUTH0_CLIENT_ID=your-single-page-app-client-id
VITE_AUTH0_AUDIENCE=https://api.timicarenow.app
VITE_API_URL=http://localhost:5000
```

Restart `npm run dev` in `frontend` (Vite only reads `.env` at start-up) and log in.

#### e) Your first admin and doctor

Everyone who signs up is a **patient**. Make yourself an admin once:

```bash
cd backend
npm run set-role -- your.email@example.com admin
```

Log out and in again. Doctors can now sign up by choosing **Doctor** in the login window; you approve them under **My account → Doctor account requests**. To create the two demo accounts in Auth0 instead, run `npm run seed-demo` (see [`backend/auth0/README.md`](backend/auth0/README.md)).

### 3. Optional: AI assistant, voice, statistics

Add these to `frontend/.env` (no `VITE_` prefix: they stay on the server) and restart `npm run dev`:

```env
GEMINI_API_KEY=...          # or ANTHROPIC_API_KEY=... (one AI key is enough)
ELEVENLABS_API_KEY=...      # voice questions and spoken answers
```

For the popular times and the statistics dashboard, add a Tiger Data (TimescaleDB) connection string to `backend/.env` as `TIGER_DATABASE_URL`. Without these keys the site simply hides those features.

---

## Environment variables

Never commit `.env` files. They are ignored by Git.

### Frontend (`frontend/.env`, and Vercel → Settings → Environment Variables)

| Variable | Required | What it is |
|---|---|---|
| `VITE_AUTH0_DOMAIN` | for logins | Auth0 domain, e.g. `your-tenant.eu.auth0.com` |
| `VITE_AUTH0_CLIENT_ID` | for logins | Client ID of the Auth0 **Single Page Application** |
| `VITE_AUTH0_AUDIENCE` | for logins | Identifier of your Auth0 API; must equal `AUTH0_AUDIENCE` |
| `VITE_API_URL` | for logins | Backend address (`http://localhost:5000` locally, `https://….onrender.com` online) |
| `VITE_GOOGLE_MAPS_KEY` | no | Live opening hours from Google Places for clinics that have a Google place ID |
| `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` | no | AI assistant (one is enough). **No `VITE_` prefix** |
| `AI_PROVIDER` | no | `gemini` or `claude` when both keys are set (default `gemini`) |
| `GEMINI_MODEL` / `CLAUDE_MODEL` | no | Override the AI model |
| `ELEVENLABS_API_KEY` | no | Voice. **No `VITE_` prefix** |
| `ELEVENLABS_VOICE_ID` | no | Another ElevenLabs voice |

Variables starting with `VITE_` are built into the public website: never put a secret in one.

### Backend (`backend/.env`, and Render → Environment)

| Variable | Required | What it is |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string (on Render: the **Internal** Database URL) |
| `FRONTEND_URL` | yes | Websites allowed to call the API, comma separated, e.g. `http://localhost:5173,https://the-medfinders-unihack.vercel.app` |
| `AUTH0_DOMAIN` | yes | Auth0 domain |
| `AUTH0_AUDIENCE` | yes | Auth0 API identifier |
| `PORT` | no | Default `5000` (Render sets it itself) |
| `AUTH0_MGMT_CLIENT_ID` / `AUTH0_MGMT_CLIENT_SECRET` | for approving doctors | Auth0 Machine to Machine app (see [`backend/auth0/README.md`](backend/auth0/README.md)) |
| `AUTH0_CLAIM_NAMESPACE` | no | Default `https://timicarenow.app`; must match the Auth0 Action |
| `TIGER_DATABASE_URL` | no | Tiger Data (TimescaleDB) for statistics |
| `ADMIN_API_KEY` | no | Lets scripts change the clinic list with the `x-admin-key` header |
| `DATABASE_SSL` | no | `true` / `false` to force SSL on or off (guessed from the URL otherwise) |

---

## Useful scripts

| Where | Command | What it does |
|---|---|---|
| `frontend/` | `npm run dev` | Website at <http://localhost:5173> (with the AI and voice proxies) |
| `frontend/` | `npm run build` | Production build into `dist/`; run it before pushing to catch errors |
| `backend/` | `npm run dev` | API at <http://localhost:5000>, restarts on changes |
| `backend/` | `npm start` | API without auto-restart (used on Render) |
| `backend/` | `npm run migrate` | Bring the database up to date (also happens at every start) |
| `backend/` | `npm run set-role -- <email> <patient\|doctor\|admin> [clinic-codes] ["Specialty"]` | Change an account's role, in Auth0 and the database |
| `backend/` | `npm run seed-demo` | Create / reset the demo doctor and patient (`-- --remove` deletes them) |

---

## The clinics database

`database/timisoara_clinics.sql` holds **100 real places** in Timișoara. A place was included only if a source gave its name, street address, phone number, opening hours and at least one specialty. Every clinic has a source URL in `clinic_sources`.

| Table | Contents |
|---|---|
| `clinics` | Name, network, kind, address, phone, email, website, CNAS contract, map coordinates |
| `specialties` / `clinic_specialties` | The 43 specialties (Romanian + English) and which clinic offers which |
| `opening_hours` | One row per clinic per day (1 = Monday … 7 = Sunday) |
| `doctors`, `doctor_assignments`, `doctor_schedules` | Doctors, where and when they work |
| `ratings`, `clinic_sources` | Public ratings with their source; where each piece of information came from |
| `v_clinic_overview` | A readable summary view |

The website reads an export of it, `frontend/src/data/clinics.json`, so you **don't need** to load the SQL file to run the site. To change the clinic data:

1. Load the script into PostgreSQL. In pgAdmin: create a database `Clinics_db` → Query Tool → open `database/timisoara_clinics.sql` → **F5**. It can be run again at any time; it rebuilds everything.
2. Regenerate the export (from the `frontend` folder):
   ```bash
   psql -d Clinics_db -At -f ../database/export_clinics_json.sql > src/data/clinics.json
   ```

Things to know about the data:

- **No empty values**: unknown email / website / postal code are stored as `not listed`, an unknown CNAS contract as `unknown`, and a clinic outside any chain has the network `Independent`.
- **Hospital hours** are those of the emergency department or an appointment desk; the `notes` column says which.
- **A missing day means "unknown", not "closed"**: a clinic is closed only when `is_closed` is `TRUE`. When `close_time` is earlier than `open_time`, the clinic is open overnight.
- **Map pins**: `geo_precision` is `exact` (on the building) or `street` (only on the right street).

---

## License

[MIT](LICENSE)
