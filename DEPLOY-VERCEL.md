# Deploying LabelLens to Vercel

The quickest way to get LabelLens online is still Lovable's own **Publish** button —
it needs no setup and keeps every feature working. Deploy to Vercel when you want
the deployment pipeline itself to live in your account (your own domain, your own
build logs, deploys on every `git push`).

LabelLens is a TanStack Start app: part of it is the browser code, part of it is a
server that runs the ingredient analysis. Vercel runs both, and the build config
in this repo (`vite.config.deploy.ts`) produces the exact output Vercel expects.

## Will any Lovable badge or watermark show?

No. The "Edit with Lovable" badge that appears on a published site is added by
Lovable's own hosting when you use the Publish button — it is not part of this
repository, so a Vercel deployment ships only your code. The page title, description
and every visible string are LabelLens's own. This was checked by scanning the
finished build: the only remaining references are internal sign-in plumbing and an
error hook that stays inactive outside the editor.

One thing to know: **Google sign-in** is routed through a shared sign-in service
(`oauth.lovable.app`), which is also why Google's consent screen showed that
authentication domain instead of yours. Nothing about that appears on your pages, but
the browser does contact it during a Google sign-in. **Email and password sign-in
talks directly to your own backend** and touches nothing else. If you want Google's
consent screen to carry your own name, you need your own Google OAuth app with your
own verified domain — that is a Google-side setup, not a change in this repository.

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
- No Lovable badge, watermark, or lovable.app address anywhere a visitor can see.
- The **Admin panel** works on Vercel too: admin actions run as the signed-in
  admin and the database only allows them for accounts with the admin role.
  No secret key is needed.
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
the Vercel deploy will succeed. That folder is listed in `.gitignore`, so it never
gets pushed to GitHub.
