# Deploy LabelLens to Vercel — guided steps

The repo is already deploy-ready (`vite.config.deploy.ts`, `build:deploy` script, `DEPLOY-VERCEL.md`, verified production build). Remaining work is the user's clicks on vercel.com, guided one step at a time.

## Steps

1. **Sign in to Vercel with GitHub** — done.
2. **Import the LabelLens repository** — Add New → Project → Import (grant GitHub access if the repo isn't listed). In progress.
3. **Configure Project screen** — Framework Preset: `Other`; Build Command: `npm run build:deploy`; Output Directory: leave empty; Node.js: `22`; Install Command: the one-line command from `DEPLOY-VERCEL.md` that removes the private `@lovable.dev/vite-tanstack-config` package before `npm install`.
4. **Environment variables** — add `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (values from the repo's `.env`), applied to Production/Preview/Development. Optionally `LOVABLE_API_KEY` for the AI explanation paragraph.
5. **Deploy**, then open the `*.vercel.app` address.
6. **Verify end-to-end** — I run the full flow on the live URL: paste analysis, photo/barcode scan, comparison, sign-in, saved scans, Sources page, admin panel, and confirm no Lovable badge appears.

## Known caveats (already accepted)

- Google sign-in needs the Vercel domain added to the auth provider's allowed redirect URLs; email/password sign-in works immediately.
- Admin panel now works on Vercel (role-based server checks, no privileged key needed).

## Technical details

- Build: `NITRO_PRESET=vercel` + `vite build --config vite.config.deploy.ts` → `.vercel/output` (verified locally, exit 0).
- No code changes expected during deploy; only Vercel dashboard configuration.
