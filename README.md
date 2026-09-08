# LabelLens Insights

Understand what you eat — scan a packaged-food label, and LabelLens extracts the
ingredients, matches them against a curated knowledge base and FSSAI regulatory
records, classifies processing with NOVA, and explains it all in plain language.

---

## Run it on your machine

Requirements: **Node 22.12 or newer** (use the current LTS release) and Git.

```bash
git clone https://github.com/<your-username>/<repo-name>.git labellens
cd labellens
npm install
npm run dev
```

Open the URL the dev server prints. You should see the dark "Midnight Lab"
LabelLens landing page.

On Windows, you can instead double-click **`start-labellens.bat`**. It creates
the local settings file when needed, refreshes the required packages after every
update and keeps the window open if startup fails so the error can be read.

### Environment variables

The repo ships a `.env` with the public backend keys, so a fresh clone runs as
is. If it is missing, copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Six keys are needed — `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
`VITE_SUPABASE_PROJECT_ID` and the same three without the `VITE_` prefix (the
`VITE_` copies are read in the browser, the others inside server functions).
They are publishable/anon keys and safe to commit. The service-role key and the
database password are never needed locally and are not available.

### What needs `AI_API_KEY` locally

Two features call a hosted AI gateway and need `AI_API_KEY` in `.env`
(it is injected automatically when the app is deployed, so it is not committed):

- **Photo scan / OCR** — without the key it reports that no OCR provider is
  configured.
- **AI explanation paragraph** — without the key the report shows an
  "AI unavailable" reason instead.

Everything else works offline from the key: **manual paste** and **barcode
lookup** both run the full deterministic pipeline — parsing, knowledge-base
matching, regulatory status, NOVA, allergens, concerns and the Insight Score.


### Scripts

| Command             | What it does                                 |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Start the dev server with hot reload         |
| `npm run build`     | Production build                             |
| `npm run preview`   | Serve the production build locally           |
| `npm run lint`      | ESLint                                       |
| `npm run format`    | Prettier                                     |

### Where things live

```text
src/routes/                 pages (TanStack Router file routes)
src/components/labellens/   scanner, dashboard, consumer report, brand
src/lib/engine/             parser -> matcher -> nova -> concerns -> score
src/lib/*.functions.ts      server functions (OCR, analyze, barcode, admin)
src/lib/*.server.ts         server-only helpers (AI gateway, knowledge base)
src/styles.css              design tokens ("Midnight Lab" theme)
supabase/migrations/        database schema + seed knowledge base
```

The database schema and seed data already live in `supabase/migrations`, and the
app talks to the existing hosted database — there is no local database to set up.

Stack: TanStack Start v1, React 19, Vite 8, Tailwind CSS v4, TypeScript,

---

## Author

LabelLens was designed and developed by me as a major academic project:
the regulatory knowledge base was curated by hand from FSSAI, WHO, EFSA,
ICMR-NIN and Codex documents, and the analysis engine (parser, matcher,
NOVA classifier, concern rules and Insight Score) is deterministic code in
`src/lib/engine/`.

See `/sources` inside the app for the full citation list and methodology.
