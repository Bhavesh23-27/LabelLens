# Deploy LabelLens on Vercel (no Lovable badge anywhere)

## What you'll end up with

LabelLens live at your own `https://<your-name>.vercel.app` address (later your own
domain), with **no "Edit with Lovable" badge, no lovable.app address, and no Lovable
wording anywhere a visitor can see**. The badge you were worried about is added by
Lovable's own hosting when you use the Publish button — it is not inside your code,
so on Vercel there is simply nothing to remove.

```text
Your GitHub repo  ->  Vercel builds it  ->  your.vercel.app
                        (browser code + analysis server)
                                  |
                          your LabelLens backend
```

## Steps

### 1. Make sure the latest code is on GitHub
Lovable syncs this project to your GitHub repository. The two files Vercel needs
(`vite.config.deploy.ts` and the `build:deploy` command in `package.json`) are already
committed, so nothing new is required — but confirm your repo shows the latest commit
before importing it.

### 2. Small cleanups in the project (I do these)
- Add `.vercel/` to the ignore list so build output never gets pushed from your PC.
- Re-run the exact production build Vercel will run, and confirm it finishes and
  writes the folder Vercel reads (`.vercel/output` with the server function inside).
- Scan the finished browser bundle to prove no Lovable badge or branding script is
  shipped with the app.
- Add a short "why there is no badge here" note plus the sign-in caveat to
  `DEPLOY-VERCEL.md`, so the guide matches what you will see.

### 3. You create the Vercel project (about 5 minutes of clicking)
1. vercel.com → **Add New → Project → Import** your LabelLens GitHub repository.
2. **Configure Project → Build & Development Settings**:
   - Framework Preset: `Other`
   - Install Command: the one-line command from `DEPLOY-VERCEL.md` (it drops the
     private build-only package before installing — this is what broke your PC
     install twice)
   - Build Command: `npm run build:deploy`
   - Output Directory: leave empty
   - Node.js Version: `22`
3. **Settings → Environment Variables** — add all four values (copy them from the
   `.env` file in the repository): `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`.
   Apply them to Production, Preview and Development, then deploy.
4. Later: **Settings → Domains** to attach your own domain.

### 4. I verify the live site
Once your Vercel address exists, I open it and run the real flow: paste an ingredient
list and analyse, sign in with email and password, check the scan is saved under
"My scans", open a saved report and the Sources page, and confirm no Lovable badge,
watermark, or wording appears anywhere in the browser.

## What works on Vercel, and what does not

| Feature | On Vercel |
| --- | --- |
| Photo, camera, barcode, pasted-text analysis | Works |
| Insight Score, NOVA group, warnings, citations, disclaimer | Works |
| Compare two products | Works |
| Email and password sign-in, saved scans, account, sign-out | Works |
| Plain-language AI explanation paragraph | Only if you add an AI key as a Vercel secret; without it the app skips just that paragraph and still analyses everything |
| Admin panel | Does not work — it needs a privileged database key that Lovable Cloud does not hand out. Do admin work on the Lovable-hosted version, or move the database to your own account first |
| Google sign-in | Needs your new Vercel address added to the sign-in provider's allowed redirect URLs, or Google refuses it. The Google consent screen will still show the existing authentication domain text — that only changes if you create your own Google app |

## Technical details

- Build config: `vite.config.deploy.ts` uses only public plugins (TypeScript path
  aliases, Tailwind, TanStack Start, React, Nitro) and outputs the Vercel Build Output
  format when the build runs with `NITRO_PRESET=vercel`.
- The private package `@lovable.dev/vite-tanstack-config` stays in `package.json` for
  the online workspace build, and is removed at install time on Vercel and on your PC.
- Browser config is read from `VITE_`-prefixed variables (compiled at build time);
  server code reads `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` at run time — hence
  both pairs.
- AI calls go to a server-side endpoint with a `LOVABLE_API_KEY` / `AI_API_KEY`
  secret; nothing about it is visible in the browser.
- No private database key exists in the repository — the committed `.env` holds only
  the public backend address and public key, and the only `service_role` mentions are
  permission statements in the database migrations.
- `.vercel/` added to `.gitignore`; the guide is `DEPLOY-VERCEL.md`.
