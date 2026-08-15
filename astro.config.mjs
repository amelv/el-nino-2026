import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";

export default defineConfig({
  output: "static",
  site: "https://amelv.github.io",
  base: "/el-nino-2026",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
