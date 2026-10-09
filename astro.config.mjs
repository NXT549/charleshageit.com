// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://charleshageit.com",
  integrations: [sitemap()],
  build: {
    // One small page: inlining the CSS saves a render-blocking request.
    inlineStylesheets: "always",
  },
});
