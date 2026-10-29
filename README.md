# LabelLens — AI-Powered Food Label Analysis

**Understand what's really in your food.**

LabelLens is a full-stack web application that reads any packaged-food label —
from a photo, camera capture, pasted ingredient list, or barcode — and turns it
into a clear, trustworthy health report: an Insight Score (0–100), a NOVA
processing classification, FSSAI regulatory warnings, allergen and dietary
flags, and plain-language explanations backed by cited sources.

## Live Demo

**https://label-lens-ebon.vercel.app**

No installation needed. Open the link, paste an ingredient list (or upload a
label photo / scan a barcode) and get the full analysis in seconds. Creating an
account is optional — it adds saved scan history and side-by-side product
comparison.

---

## How It Works

LabelLens runs a deterministic, fully explainable analysis pipeline — the AI is
used only to *explain* results, never to *decide* them:

```text
Input (photo / camera / pasted text / barcode)
      |
      v
Extraction        OCR (server vision model, Tesseract.js fallback)
                  or barcode lookup via Open Food Facts
      |
      v
Preprocessing     Cleaning, tokenisation, normalisation of ingredient text
      |
      v
Matching          Exact -> alias -> INS number -> fuzzy (>= 67% confidence)
                  against the curated knowledge base
      |
      v
Analysis          FSSAI regulatory rules, NOVA 1-4 classification,
                  additive concerns, allergen & dietary flags,
                  weighted Insight Score (0-100)
      |
      v
Explanation       Gemini writes a plain-language summary of the
                  already-computed, source-backed results
      |
      v
Report            Consumer report card with score ring, NOVA badge,
                  matched ingredients, warnings, confidence badges,
                  citations and disclaimers
```

Because the pipeline is deterministic, the same product always produces the
same score — and every claim in the report traces back to a cited document.

## Knowledge Base & Data Sources

The knowledge base is curated by hand and stored in a PostgreSQL database
(schema + seed data version-controlled in `supabase/migrations/`):

- **172+ verified ingredients** with **516+ aliases** (names, INS/E-numbers)
- **172 FSSAI ingredient rules** across **15 regulatory clauses**
- **14 trusted sources**: FSSAI, WHO/FAO (JECFA), EFSA, ICMR-NIN, Codex
  Alimentarius, IARC, PAHO, USDA, Open Food Facts, and the NOVA classification
  system (Monteiro et al.)

Every ingredient, rule and concern is linked to its source document, so any
statement in a report can be traced back to the regulation or study behind it.
The full citation list is also visible inside the app on the **Sources** page.

## Features

- **Four input methods** — upload a label photo, capture with the camera,
  paste ingredient text, or scan a barcode (Open Food Facts lookup)
- **Insight Score (0–100)** — weighted, deterministic scoring with a visual
  score ring
- **NOVA classification (1–4)** — rule-based processing-level detection
- **Regulatory & safety flags** — FSSAI status, additive concerns, allergens,
  dietary suitability, sugar/sodium/trans-fat warnings
- **Confidence badges & citations** — every matched ingredient shows how it
  was matched and which source backs it
- **Compare two products** — side-by-side reports, with OCR for both
- **Accounts & history** — email/password and Google sign-in; scans are saved
  automatically to "My scans"
- **Admin panel** — role-based access (separate `user_roles` table, enforced
  by database row-level security) for managing the knowledge base and scans

## Tech Stack

| Layer      | Technology                                                        |
| ---------- | ----------------------------------------------------------------- |
| Frontend   | React 19, TypeScript, Tailwind CSS v4 ("Midnight Lab" theme)      |
| Framework  | TanStack Start v1 (SSR + server functions), Vite                  |
| Backend    | Lovable Cloud (Supabase): PostgreSQL, Auth, Row-Level Security    |
| OCR        | Server-side vision model + Tesseract.js browser fallback          |
| Barcode    | Open Food Facts API                                               |
| AI         | Google Gemini (explanations only, via AI gateway)                 |
| Hosting    | Vercel (production)                                               |

## Project Structure

```text
src/routes/                 pages (TanStack Router file routes)
src/components/labellens/   scanner, dashboard, consumer report, brand
src/lib/engine/             parser -> matcher -> nova -> concerns -> score
src/lib/*.functions.ts      server functions (OCR, analyze, barcode, admin)
src/lib/*.server.ts         server-only helpers (AI gateway, knowledge base)
src/styles.css              design tokens ("Midnight Lab" theme)
supabase/migrations/        database schema + seed knowledge base
```

## Run It Locally

Requirements: **Node 22.12 or newer** and Git.

```bash
git clone https://github.com/Bhavesh23-27/LabelLens.git labellens
cd labellens
npm install
npm run dev:local
```

On Windows, you can instead double-click **`start-labellens.bat`** — it creates
the local settings file when needed, refreshes packages after updates and keeps
the window open if startup fails so the error can be read.

The repo ships a `.env` with the public backend keys (publishable/anon keys,
safe to commit), so a fresh clone runs as-is. If it is missing, copy
`.env.example` to `.env`. The service-role key and database password are never
needed and are not available.

Two optional features call a hosted AI gateway and need `AI_API_KEY` in `.env`
(injected automatically when deployed): **photo OCR** and the **AI explanation
paragraph**. Everything else — paste analysis and barcode lookup — runs the
full deterministic pipeline without it.

### Scripts

| Command              | What it does                                                   |
| -------------------- | -------------------------------------------------------------- |
| `npm run dev:local`  | Start the dev server on your own PC                            |
| `npm run build`      | Production build                                               |
| `npm run preview`    | Serve the production build locally                             |
| `npm run lint`       | ESLint                                                         |
| `npm run format`     | Prettier                                                       |
| `npm run build:deploy` | Build for external hosting (Vercel) — see `DEPLOY-VERCEL.md` |

## Deployment

The production site is deployed on **Vercel** from this repository. The exact
build settings, environment variables and step-by-step guide live in
[`DEPLOY-VERCEL.md`](DEPLOY-VERCEL.md).

## Documentation

- [`PROJECT-EXPLAINED.md`](PROJECT-EXPLAINED.md) — full technical walkthrough:
  every pipeline stage, the database design, auth & roles, and viva-ready Q&A
- [`DEPLOY-VERCEL.md`](DEPLOY-VERCEL.md) — deployment guide
- `/sources` page inside the app — complete citation list and methodology

## Author

LabelLens was designed and developed by **Bhavesh** as a major academic
project. The regulatory knowledge base was curated by hand from FSSAI, WHO,
EFSA, ICMR-NIN and Codex documents, and the analysis engine (parser, matcher,
NOVA classifier, concern rules and Insight Score) is deterministic code in
`src/lib/engine/`.
