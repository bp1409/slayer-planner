import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const deployPath = process.env.PAGES_BASE ?? "/";

export default defineConfig({
  base: deployPath,
  plugins: [react()],
});
