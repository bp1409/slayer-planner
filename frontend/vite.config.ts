import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === "true";
const deployPath = process.env.VITE_DEPLOY_PATH ?? "/slayer-planner/";

export default defineConfig({
  base: isGitHubPagesBuild ? deployPath : "/",
  plugins: [react()],
});
