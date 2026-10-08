# Deploying LabelLens to Vercel

The quickest way to get LabelLens online is still Lovable's own **Publish** button —
it needs no setup and keeps every feature working. Deploy to Vercel when you want
the deployment pipeline itself to live in your account (your own domain, your own
build logs, deploys on every `git push`).

LabelLens is a TanStack Start app: part of it is the browser code, part of it is a
server that runs the ingredient analysis. Vercel runs both, and the build config
in this repo (`vite.config.deploy.ts`) produces the exact output Vercel expects.

## 1. Push the code to GitHub

Lovable syncs the project to a GitHub repository. Make sure the latest changes are
pushed there (the `vite.config.deploy.ts` file and the `build:deploy` script must be
in the commit Vercel builds from).

## 2. Import the repository

1. On vercel.com: **Add New → Project → Import** your GitHub repository.
2. Pick the branch you want to deploy (the one Lovable syncs).

## 3. Build settings

Open **Configure Project → Build & Development Settings** and set:

| Setting | Value |
| --- | --- |
| Framework Preset | `Other` |
| Install Command | see below |
| Build Command | `npm run build:deploy` |
| Output Directory | leave empty |
| Node.js Version | `22` |

Install Command — paste this exactly. The repository still lists one private
package that only exists inside Lovable's workspace; this removes it before
installing, so the build works from a plain clone:

```
node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));delete p.devDependencies['@lovable.dev/vite-tanstack-config'];fs.writeFileSync('package.json',JSON.stringify(p,null,2))" && npm install
```

## 4. Environment variables

Add these under **Settings → Environment Variables** (Production, Preview and
Development), then re-deploy so the build picks them up:

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | your backend URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | your public backend key |
| `SUPABASE_URL` | the same backend URL |
| `SUPABASE_PUBLISHABLE_KEY` | the same public key |

Both pairs are needed: the `VITE_` ones are compiled into the browser code at
build time, the other two are read by the server at run time. You can copy all
four from the `.env` file in the repository.

Optional — `LOVABLE_API_KEY` (or `AI_API_KEY`): without it the app still analyses
everything, it only skips the plain-language AI explanation paragraph.

## 5. After the first deploy

1. Open the `https://<your-project>.vercel.app` address Vercel gives you.
2. Sign in with email and password and run a scan end to end — photo, barcode and
   pasted text all use the same analysis server.
3. If you use Google sign-in, add the new Vercel domain to the authentication
   provider's allowed redirect URLs, otherwise Google will refuse the new address.
4. Later: **Settings → Domains** to attach your own domain.

## What to expect on Vercel

- The public pages, analysis, comparison, saved scans and account/sign-out all work.
- The **Admin panel** needs a privileged database key to load its numbers. Lovable
  Cloud does not hand that key out, so it cannot be given to Vercel. Keep admin
  work on the Lovable-hosted version, or move the database to your own account
  first if you want admin there too.
- Vercel's free tier is enough for a demo; the analysis server cold-starts from
  time to time, so the first scan after a wait can take a couple of seconds longer.

## Checking the build on your own PC

The same build Vercel runs, without leaving the project folder:

```
git pull
npm install
npm run build:deploy
```

A finished build writes a `.vercel/output` folder. If that appears without errors,
the Vercel deploy will succeed.
