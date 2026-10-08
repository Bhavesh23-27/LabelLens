// Local development config — used ONLY when running LabelLens on your own PC
// (npm run dev:local). It replaces the private hosted build package with the
// equivalent public plugins, so `npm install` works from a plain GitHub clone.
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: { host: "127.0.0.1", port: 8080 },
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({ server: { entry: "server" } }),
    viteReact(),
  ],
});
