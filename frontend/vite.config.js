import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { chatApiPlugin } from "./server/chatProxy.js";

export default defineConfig(({ mode }) => {
  // Loads ALL variables from .env for the server side (e.g. ANTHROPIC_API_KEY).
  // Only variables starting with VITE_ ever reach the browser.
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), chatApiPlugin(env)],
  };
});
