// =============================================================
//  AUTH0 SETTINGS
//  Read from the .env file in the project root (next to package.json):
//
//    VITE_AUTH0_DOMAIN=your-tenant.eu.auth0.com
//    VITE_AUTH0_CLIENT_ID=yourClientId
//
//  If they're missing, the site uses the prototype login instead.
//  Restart `npm run dev` after changing .env.
// =============================================================

export const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN;
export const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID;
// API identifier from Auth0 Dashboard -> Applications -> APIs.
// Needed so the backend can save favourites / contact history per user.
//    VITE_AUTH0_AUDIENCE=https://api.medfinders
export const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE;
export const AUTH0_ENABLED = Boolean(AUTH0_DOMAIN && AUTH0_CLIENT_ID);
