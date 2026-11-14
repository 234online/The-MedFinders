# Patient and doctor accounts (Auth0)

Everyone who signs up is a **patient**. A **doctor** is an account that an
admin has marked as a doctor in Auth0. A person can never choose this role
themselves, because doctors can read patients' medical details.

The role is stored in **Auth0** (the user's `app_metadata`), which is the
source of truth. At every login the role goes into the token, and the backend
copies it into the database (`users.role`, `users.specialty`, `doctor_clinics`).
A doctor can work at **several clinics**.

```
Auth0 app_metadata ──(Action)──► token claims ──(backend login check)──► users.role
{ "role": "doctor",                                                      doctor_clinics
  "clinic_ids": ["medlife-spital", "medlife-eroilor"],                   users.specialty
  "specialty": "Cardiologie" }
```

When a patient clicks a clinic and presses **"Cere o programare online"**
(preferred day, time and reason), the request appears under **"Cereri noi de
programare"** on the dashboard of **every doctor of that clinic**. Any of them
can accept or decline it. The others then see who handled it, and the patient
sees the answer under "Programările mele".

A doctor sees only the patients who sent a request to **one of their clinics**.
Everything on the doctor page comes from those patients' own data:

| On the doctor page        | Comes from                                    |
|---------------------------|-----------------------------------------------|
| Name, age, sex, phone     | `users` (the patient's "My account" details)  |
| Blood type, allergies, conditions, medication | `medical_profiles` (filled in by the patient) |
| Requests and appointments | `appointments` (sent by the patient from a clinic's page) |
| Visit history             | completed `appointments`, with the doctor's diagnosis and notes |

## One-time setup in Auth0

1. **Add the Action** (puts the role into the tokens)
   - Auth0 Dashboard → **Actions → Library → Create Action → Build from scratch**
   - Name: `Add TimiCareNow role`, Trigger: **Login / Post Login**
   - Paste in the contents of [`post-login-action.js`](post-login-action.js), then **Deploy**
   - **Actions → Triggers → post-login**: drag the action between *Start* and *Complete*, then **Apply**

2. **Optional: let the `set-role` script write to Auth0** (Machine to Machine app)
   - **Applications → Create Application → Machine to Machine**, named e.g. `TimiCareNow scripts`
   - Authorise it for the **Auth0 Management API** with the scopes `read:users`, `update:users`,
     `create:users` and `delete:users` (the last two only for the demo accounts)
   - Put its credentials in `backend/.env` (never commit them):
     ```
     AUTH0_MGMT_CLIENT_ID=...
     AUTH0_MGMT_CLIENT_SECRET=...
     ```

## Doctors ask, an admin approves (on the site)

1. In the login window the person chooses **Medic** and logs in / signs up. Back on the
   site, the **doctor account request** opens: clinics (one or more), specialty, College of
   Physicians number / stamp code, optional message. (Already logged-in patients find the same
   form under **Contul meu → Ești medic?**)
2. The account stays a **patient** account while the request waits.
3. An **admin** sees the waiting requests under **Contul meu → Cereri de cont de medic** and
   approves or rejects them (with a reason the person sees). Check the number in the
   College of Physicians register before approving.
4. Approving writes `{ role, clinic_ids, specialty }` to Auth0 **and** the database, like
   `set-role` below. This needs the Machine to Machine app (`AUTH0_MGMT_CLIENT_ID` /
   `AUTH0_MGMT_CLIENT_SECRET`) **on Render too**: without it only the database changes and,
   with the Action installed, the next login turns the person back into a patient (the site
   shows this warning when approving).
5. The person logs out and in again to see the doctor portal. From then on, patients can
   pick them when booking at those clinics.

A clinic **takes online appointments** when at least one approved doctor works there.
Patients choose a doctor or "any doctor": a request for one doctor is seen only by them; a
request for "any doctor" by every doctor of the clinic.

**The first admin** is made with the script (there is nobody yet to approve them):

```bash
npm run set-role -- your.email@gmail.com admin
```

## Making someone a doctor (script)

The person must sign up on the site first, as a normal patient. Then:

```bash
cd backend
npm run set-role -- ana.popescu@gmail.com doctor medlife-spital,medlife-eroilor "Cardiologie"
npm run set-role -- ana.popescu@gmail.com patient      # undo
```

Clinic codes are separated by commas. A clinic code is the clinic's `id` in
the website data (`frontend/src/data/clinics.json`), e.g. `medlife-spital`.
The script updates Auth0 and the database. The person must **log out and log
in again** before the site shows the doctor portal.

**Without the Machine to Machine app**, do it by hand: Auth0 Dashboard →
**User Management → Users** → the person → **app_metadata**:

```json
{ "role": "doctor", "clinic_ids": ["medlife-spital", "medlife-eroilor"], "specialty": "Cardiologie" }
```

Then save. The database updates the next time they log in.

## Placeholder accounts (password `123`)

| Email | Account |
|-------|---------|
| `doctor@timicarenow.app` | doctor at `medlife-spital` and `medlife-eroilor` |
| `pacient@timicarenow.app` | patient with a medical record, a new request, a confirmed appointment and a past visit |

```bash
cd backend
npm run seed-demo              # create / reset both (Auth0 + database)
npm run seed-demo -- --remove  # delete both
```

- Auth0 refuses `123` with its default password policy. First set **Authentication → Database →
  Username-Password-Authentication → Password Policy** to **None** and turn off Password History,
  Password Dictionary and Personal Data. If the connection has another name, set `AUTH0_DB_CONNECTION`.
- It needs the Machine to Machine app (above) and `DATABASE_URL`. Running it again resets the
  passwords, roles and demo appointments.
- In the prototype (no Auth0), the two emails log in with `123` straight away.

> **Warning:** anyone who knows these passwords can log in. The demo doctor sees **every request
> sent to its two clinics, including real patients' requests and medical data**. Run
> `npm run seed-demo -- --remove` before real patients use the site.

## Environment variables (backend)

| Variable | Needed for |
|----------|------------|
| `AUTH0_DOMAIN`, `AUTH0_AUDIENCE` | login (already used) |
| `DATABASE_URL` | accounts, appointments, medical details (already used) |
| `AUTH0_CLAIM_NAMESPACE` | optional, default `https://timicarenow.app` (must match the Action) |
| `AUTH0_MGMT_CLIENT_ID`, `AUTH0_MGMT_CLIENT_SECRET` | optional, for `npm run set-role` and `npm run seed-demo` to update Auth0 |
| `AUTH0_DB_CONNECTION` | optional, default `Username-Password-Authentication` (used by `seed-demo`) |

The database tables are created automatically when the server starts
(`db/migrations/003_roles_appointments_medical.sql`).
