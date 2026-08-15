import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "static",
  site: "https://amelv.github.io",
  base: "/el-nino-2026",
  vite: {
    plugins: [tailwindcss()],
  },
});
