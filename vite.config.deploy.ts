// Deployment config — used when building LabelLens outside Lovable's own
// workspace (Vercel, Netlify, your own server). It uses only public packages,
// so `npm install` works from a plain GitHub clone, and it hands the server
// build to Nitro, which picks the preset for the platform it is running on.
//
// Local development uses vite.config.local.ts instead.
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({ server: { entry: "server" } }),
    viteReact(),
    // On Vercel/Netlify/Cloudflare, Nitro detects the platform and builds the
    // matching preset. Anywhere else it falls back to a plain Node.js server
    // you can start with `node .output/server/index.mjs`.
    nitro({ defaultPreset: "node-server" }),
  ],
});
