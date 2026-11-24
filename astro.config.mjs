import { defineConfig } from "astro/config";

// GitHub Pages serves the site from /<repo>/ unless a custom domain is set.
// The deploy workflow passes BASE_PATH; locally the site runs at "/".
export default defineConfig({
  site: process.env.SITE_URL || "https://naradararin.github.io",
  base: process.env.BASE_PATH || "/",
  build: { format: process.env.BUILD_FORMAT || "directory" },
});
