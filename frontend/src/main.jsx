import React from "react";
import ReactDOM from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import "leaflet/dist/leaflet.css";
import App from "./App.jsx";
import { AUTH0_ENABLED, AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_AUDIENCE } from "./account/auth0Config.js";

const app = <App />;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {AUTH0_ENABLED ? (
      <Auth0Provider
        domain={AUTH0_DOMAIN}
        clientId={AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: window.location.origin,
          // Lets the site call the backend on Render as the logged-in user
          ...(AUTH0_AUDIENCE && { audience: AUTH0_AUDIENCE, scope: "openid profile email" }),
        }}
        // Keeps you logged in after refreshing the page
        cacheLocation="localstorage"
      >
        {app}
      </Auth0Provider>
    ) : (
      app
    )}
  </React.StrictMode>
);
