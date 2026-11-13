# Timișoara Map (prototype)

React + Vite + Leaflet. Type in the search bar or pick a category, and matching
places are highlighted on the map.

## Run it

1. Install Node.js (LTS) from https://nodejs.org
2. Open this folder in VS Code (File → Open Folder…)
3. Open the terminal (Ctrl + `) and run:

   ```
   npm install
   npm run dev
   ```

4. Open the address it prints (usually http://localhost:5173)

## Data (from the PostgreSQL database)

- `src/data/clinics.json` is an export of the clinics database, with the database's own
  table and column names. Regenerate it whenever the database changes (from this folder):

  ```
  psql -d Clinics_db -At -f database/export_clinics_json.sql > src/data/clinics.json
  ```

  (add `-U postgres -h localhost` if needed). In pgAdmin you can also run the query and
  paste the result into the file.
- `src/data/loadPlaces.js` turns the database rows into what the website uses.
- `src/data/translations.js` shows the database's English notes in Romanian.
- Specialty groups come from `specialties.category_ro`; icons/colours are in
  `src/config/placeTypes.js`. Filters are in `src/config/filters.js`.

## Notes

- The map tiles come from OpenStreetMap's public server, which is fine for development.
  For a public site, switch the `TileLayer` URL to a provider such as MapTiler, Stadia Maps
  or Carto, and keep the OpenStreetMap attribution.
- `npm run build` creates a production version in `dist/`.
