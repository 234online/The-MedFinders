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

## Where things are

- `src/data/places.json`: the places (name, category, tags, coordinates). Add your own here.
  The sample coordinates are approximate, so check them before relying on them.
- `src/App.jsx`: search logic, the sidebar, and the map
- `src/App.css`: styling
- `CATEGORIES` in `App.jsx`: category labels and marker colours

## Notes

- The map tiles come from OpenStreetMap's public server, which is fine for development.
  For a public site, switch the `TileLayer` URL to a provider such as MapTiler, Stadia Maps
  or Carto (they all have free tiers), and keep the OpenStreetMap attribution.
- `npm run build` creates a production version in `dist/`.
