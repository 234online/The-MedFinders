# MedFinders - Backend API

Server backend construit în **Node.js** cu **Express**, creat pentru a alimenta aplicația frontend The-MedFinders cu date despre locațiile medicale din oraș (spitale, clinici, farmacii, cabinete medicale, stomatologie, laboratoare, optică).

---

## 📌 Cum funcționează baza de date (JSON File DB)

Conform cerințelor proiectului:
1. **În acest moment**, datele sunt servite dintr-un fișier JSON structurat: `backend/data/places.json`.
2. **Stratul de date (`backend/db/database.js`)** acționează ca un adaptor abstract (Repository Pattern).
3. **Când baza de date finală va fi aleasă** (ex: PostgreSQL, MongoDB, MySQL, Supabase, SQLite), doar logica din `backend/db/database.js` trebuie actualizată pentru a citi/scrie din acea bază de date. Restul codului (rutele Express, validările și frontend-ul) vor continua să funcționeze fără nicio modificare!

---

## 🚀 Pornire Server

### 1. Navigare în folderul backend:
```bash
cd backend
```

### 2. Instalare dependențe (dacă nu au fost deja instalate):
```bash
npm install
```

### 3. Pornire server:
- **Mod dezvoltare** (reîncărcare automată la modificări):
  ```bash
  npm run dev
  ```
- **Mod standard**:
  ```bash
  npm start
  ```

Serverul va porni la adresa: `http://localhost:5000`

---

## 🔗 Cum este conectat cu Frontend-ul

- **CORS activat**: Serverul permite cereri de la aplicația frontend Vite (`http://localhost:5173`).
- **Parsare JSON**: `express.json()` activat pentru cereri de tip `POST` / `PUT`.
- În frontend (React), datele pot fi preluate prin:
  ```javascript
  // Exemplu în React:
  fetch('http://localhost:5000/api/places')
    .then(res => res.json())
    .then(data => console.log('Locații primite din backend:', data));
  ```

---

## 📡 End-point-uri API Disponibile

| Metodă | Rută | Descriere |
| :--- | :--- | :--- |
| `GET` | `/` | Informații generale despre starea API-ului |
| `GET` | `/api/health` | Verificare de sănătate a serverului |
| `GET` | `/api/db-status` | Detalii despre adaptorul de date curent (JSON vs viitoarea DB) |
| `GET` | `/api/places` | Toate locațiile medicale (suportă parametri de filtrare) |
| `GET` | `/api/places/:id` | O singură locație după ID |
| `POST` | `/api/places` | Adaugă o nouă locație medicală (salvează în `places.json`) |
| `PUT` | `/api/places/:id` | Actualizează o locație existentă |
| `DELETE` | `/api/places/:id` | Șterge o locație existentă |
| `GET` | `/api/categories` | Lista categoriilor și numărul de unități din fiecare |

### Exemple de Filtrare pe `GET /api/places`:
- Filtrare după categorie: `http://localhost:5000/api/places?category=hospital`
- Filtrare deschis non-stop: `http://localhost:5000/api/places?open24h=true`
- Filtrare urgențe + scaun cu rotile: `http://localhost:5000/api/places?emergency=true&wheelchair=true`
- Căutare liberă: `http://localhost:5000/api/places?search=urgente`

---

## 🛠️ Ghid: Implementarea Bazei de Date Ulterioare

Când echipa decide ce bază de date se va folosi:

1. Modifică `.env`:
   ```env
   DB_TYPE=mongodb    # sau postgres / mysql
   DATABASE_URL=mongodb://localhost:27017/medfinders
   ```
2. Instalează driverul bazei de date (ex: `npm install mongoose` sau `npm install pg`).
3. În fișierul `backend/db/database.js`:
   - Conectează baza de date folosind `process.env.DATABASE_URL`.
   - Înlocuiește apelurile din `getPlaces()`, `addPlace()`, `updatePlace()` etc. cu interogările către baza aleasă (vezi comentariile marcate cu `VIITOARE BAZĂ DE DATE` din `database.js`).
