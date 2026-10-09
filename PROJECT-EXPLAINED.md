# LabelLens — Complete Project Explanation

Everything about how LabelLens works: the pipelines, workflows, implementation
details, and answers to the questions examiners are most likely to ask.

---

## 1. Project Overview

**Problem:** Packaged-food labels are full of chemical names, INS/E-numbers and
legal fine print that ordinary consumers cannot interpret. Existing apps either
give a single opaque score with no reasoning, or are not built around Indian
(FSSAI) regulations.

**Solution:** LabelLens lets anyone point their phone at a food label (or paste
the ingredient list, or scan the barcode) and get a plain-language report:
what each ingredient is, whether FSSAI permits it, how processed the product is
(NOVA 1–4), what concerns exist (allergens, sugar, sodium, trans fat, additives
of concern), and a transparent 0–100 Insight Score — every claim backed by a
cited source.

**Key principle:** the analysis is **deterministic and explainable**. Rules and
a curated database decide everything; AI is used only to *read* label photos
(OCR) and to *explain* already-computed results in simple words. The AI never
decides whether something is safe.

---

## 2. Technology Stack (and why)

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | React 19 + TypeScript | Component model, type safety across the whole app |
| Framework | TanStack Start v1 | File-based routing, SSR, and server functions in one codebase |
| Build | Vite | Fast dev server and production builds |
| Styling | Tailwind CSS v4 | Token-based design system, consistent dark theme |
| Backend / DB | Lovable Cloud (PostgreSQL + Auth + RLS) | Managed Postgres with row-level security and built-in auth |
| OCR (photo) | Server vision AI + Tesseract.js fallback in browser | Accuracy first, offline-capable fallback |
| Barcode | Open Food Facts API | Free, open database of product barcodes |
| AI explanation | Gemini via AI gateway | Turns verified results into plain language |
| Deployment | Vercel (`npm run build:deploy`) | Independent hosting, no builder branding |

---

## 3. The Full Analysis Pipeline

This is the heart of the project. It mirrors the block diagram exactly.

```text
INPUT          EXTRACTION        PREPROCESSING      MATCHING           ANALYSIS          AI           OUTPUT
photo/camera → OCR (vision AI → clean text →    exact → alias →  NOVA 1–4, FSSAI  → Gemini    → consumer report
paste text     or Tesseract)    tokenize,        INS/E-number → checks, concerns,  explains     card + score +
barcode    →   Open Food Facts normalize        fuzzy (≥67%)   allergens, score   only         citations
```

### Stage 1 — Input layer (`src/routes/scan.tsx`)
Four ways in:
1. **Upload photo** — pick a label image from the device.
2. **Click photo** — camera capture (`capture="environment"` opens the rear camera on phones).
3. **Paste text** — type or paste the ingredient list directly.
4. **Scan barcode** — live barcode scanner (`src/components/labellens/barcode-scanner.tsx`).

### Stage 2 — Extraction
- **Photo:** the image goes to a server function that runs vision AI OCR
  (`runOcr` in `src/lib/ai.server.ts`), returning structured text plus an OCR
  confidence value. If no AI key is configured (e.g. running locally), the app
  falls back to **Tesseract.js running in the browser** (`src/lib/ocr-browser.ts`).
- **Barcode:** the barcode number is looked up in **Open Food Facts**
  (`src/lib/barcode.server.ts`); the product name, brand, ingredient text and
  nutrition facts come back and feed the same pipeline.

### Stage 3 — Preprocessing (`src/lib/engine/parser.ts`)
Raw label text is messy. The parser:
- cleans OCR noise (`cleanOcrText`),
- finds the actual ingredient section of the label (`extractIngredientSection`),
- splits the list into **tokens** — one per ingredient,
- normalizes each token (lowercase, punctuation, spelling variants),
- extracts structure: INS/E-numbers (`INS 322`), class hints
  (`Emulsifier (...)`), declared percentages, and sub-ingredients of compound
  ingredients,
- separately captures "may contain" allergen statements.

Example: `"Sugar, Emulsifier (INS 322), Salt (1.2%)"` becomes three tokens with
the INS number and percentage attached.

### Stage 4 — Matching engine (`src/lib/engine/matcher.ts`)
Each token is matched against the knowledge base in strict priority order:
1. **Exact** canonical-name match
2. **Alias** match (516+ known alternative names, e.g. "vitamin C" → ascorbic acid)
3. **INS / E-number** match (e.g. INS 322 → lecithin)
4. **Fuzzy** match (similarity threshold 67%, handles OCR/spelling errors)
5. **No match** → the name is recorded and queued in `unknown_ingredients` for
   admin review (`queue_unknown_ingredient`), and the report's confidence drops.

Every match carries a **match method and a confidence value**, which is why the
UI can show honest confidence badges instead of pretending certainty.

### Stage 5 — Knowledge base
The deterministic brain of the app (details in section 4): ingredients, aliases,
FSSAI rules, regulations and cited sources.

### Stage 6 — Analysis layer (all deterministic, `src/lib/engine/`)
- **NOVA classification** (`nova.ts`): rule-based assignment to NOVA 1–4 from
  the matched ingredients' processing indicators (e.g. presence of
  industrial-substance markers → NOVA 4 ultra-processed).
- **Regulatory checks:** each matched ingredient is checked against its FSSAI
  rule — permitted / restricted / banned, with conditions and maximum levels.
- **Concern detection** (`concerns.ts`): flags for added sugars (including
  sugar aliases), sodium, trans fat, additives of concern, plus **allergen
  detection** from ingredient allergen groups and "may contain" text.
- **Nutrition analysis:** when nutrition facts are available (barcode lookups),
  thresholds produce findings like "high in added sugar".
- **Insight Score** (`score.ts`): starts at 100 and applies **weighted
  deductions** across dimensions (NOVA class, regulatory status, concerns,
  nutrition, confidence). Same product → same score, every time. This
  reproducibility is a deliberate design choice and a strong viva answer.
- **Confidence** (`calculateConfidence`): combines match rate, OCR confidence
  and whether the ingredient section was found → high / medium / low.

### Stage 7 — AI explanation (`src/lib/ai.server.ts`)
Gemini receives the **already-computed** report (score, NOVA, flags, matched
ingredients) and writes a short plain-language summary for consumers. It has no
access to change any number or verdict. If the AI key is missing, the report
shows an "AI unavailable" note and everything else still works.

### Stage 8 — Output (`src/components/labellens/consumer-report.tsx`,
`analysis-dashboard.tsx`)
The consumer report card shows:
- Insight Score (0–100) with a score ring,
- NOVA badge (1–4) with plain-language meaning,
- ingredient-by-ingredient findings with FSSAI status and source links,
- warnings (allergens, concerns) and nutrition findings,
- confidence badge and match methods,
- citations and a consumer disclaimer.

---

## 4. Database Design

PostgreSQL, defined entirely in version-controlled SQL migrations
(`supabase/migrations/`) — schema and seed data together, so the database is
reproducible from the repo alone.

| Table | Purpose | Size |
| --- | --- | --- |
| `ingredients` | Canonical ingredient records: names, INS/E-numbers, category, allergen group, veg/vegan status, processing indicator, NOVA relevance, FSSAI status, risk level, source reference | 172 |
| `ingredient_aliases` | Alternative names mapped to canonical ingredients | 516 |
| `fssai_ingredient_rules` | Per-ingredient FSSAI permission status, conditions, maximum levels, regulation reference | 172 |
| `fssai_regulations` | The regulation clauses themselves | 15 |
| `data_sources` | Every source document with version, retrieval date, license | 14 |
| `unknown_ingredients` | Unmatched names seen in scans, with occurrence counts — drives knowledge-base growth | — |
| `profiles`, `user_roles` | Accounts and role assignments | — |
| scans / analyses | Saved scan history for signed-in users | — |

**Where the data came from:** curated by hand from official documents — FSSAI
regulations, WHO/FAO (JECFA), EFSA, ICMR-NIN, Codex Alimentarius, IARC, PAHO,
USDA, and Open Food Facts. Every ingredient row carries a `source_reference`,
so any claim in the UI can be traced back to the document it came from. The
`/sources` page in the app lists the full bibliography.

**Why this matters (viva answer):** the knowledge base is *referenced*, not
scraped-and-forgotten. Traceability is what makes the results defensible.

---

## 5. Authentication & Roles

- **Email/password:** signup signs the user in immediately (auto-confirm is
  enabled) and lands them on the homepage.
- **Google sign-in:** OAuth via the hosted broker on the Lovable preview; on
  Vercel it needs the project's own Google Client ID/Secret (documented in
  `DEPLOY-VERCEL.md`).
- Sessions persist in the browser; server functions receive the user's token
  through middleware (`src/integrations/supabase/auth-attacher.ts`).

**User vs admin — a real roles system, not a flag:**
- `app_role` enum (`admin`, `moderator`, `user`) + `user_roles` table.
- `has_role(user_id, role)` is a **security-definer SQL function** so role
  checks can't be bypassed or recurse through RLS.
- On signup, a trigger gives every account the `user` role; the **first**
  account in the project is promoted to `admin` automatically; further admins
  are promoted by an existing admin from the Admin panel (with a guard against
  removing the last admin).
- Admin is protected by **three independent layers**: the `/admin` route guard
  (`beforeLoad`), server-side `assertAdmin` on every admin function, and
  database RLS policies requiring the admin role. Hiding the button is never
  the only protection.

---

## 6. Key Workflows

**Photo scan, end to end:**
1. User uploads/clicks a photo → animated pipeline progress UI
   (`src/components/labellens/pipeline.tsx`) shows each stage.
2. Server OCR (or browser Tesseract fallback) → raw text + OCR confidence.
3. Parser → tokens. 4. Matcher → knowledge base. 5. NOVA, FSSAI checks,
   concerns, allergens, score, confidence. 6. Gemini writes the plain-language
   summary. 7. Report renders. 8. If signed in, the analysis **saves
   automatically** to "My Scans".

**Barcode scan:** camera reads the barcode → Open Food Facts lookup → product
name, brand, ingredients and nutrition feed the same pipeline from stage 3.

**Compare (`src/routes/compare.tsx`):** two products side by side — each side
supports photo OCR *or* pasted text — then both reports render for comparison.

**My Scans / Account (`src/routes/_authenticated/`):** signed-in users see
saved analyses, reopen full reports, manage their account, sign out.

**Admin panel (`src/routes/_authenticated/admin.tsx`):** overview stats, edit
knowledge-base ingredients, review and resolve the unknown-ingredient queue,
list reports, promote/demote admins by email.

---

## 7. Design System

"Midnight Lab": dark ink-navy canvas, electric-lime primary, mint glow accent.
Space Grotesk (headings), DM Sans (body), JetBrains Mono (numbers/codes). All
colors are semantic tokens in `src/styles.css` — no hardcoded colors in
components — so the theme stays consistent everywhere.

---

## 8. Deployment

- **Lovable preview/publish:** zero config; shows a small Lovable badge and a
  `lovable.app` URL.
- **Vercel (independent):** `npm run build:deploy` with
  `vite.config.deploy.ts` (drops the private workspace package). Needs four
  public env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
  `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`). Full guide: `DEPLOY-VERCEL.md`.
- Known Vercel caveats: Google sign-in needs the project's own Google OAuth
  keys + the Vercel domain added to allowed redirect URLs; the AI explanation
  paragraph needs an AI key (everything else works without it).

---

## 9. Likely Examiner Questions — Ready Answers

**"Why should we trust your data?"**
Every ingredient, rule and regulation is curated from official sources — FSSAI,
WHO/JECFA, EFSA, ICMR-NIN, Codex, IARC, PAHO, USDA, Open Food Facts — and every
row carries a source reference. The `/sources` page shows the full bibliography
with versions and retrieval dates.

**"Is the AI deciding whether food is safe?"**
No. Parsing, matching, NOVA, regulatory checks and the score are all
deterministic code. The AI only (a) reads text out of photos and (b) explains
the already-computed results in simple language. Removing the AI changes no
verdict.

**"How is the Insight Score calculated?"**
It starts at 100 and applies weighted deductions across explicit dimensions:
NOVA class, FSSAI regulatory status, detected concerns, nutrition findings and
confidence. The dimensions and points are shown in the report, so the score is
transparent and reproducible — the same product always gets the same score.

**"What happens when an ingredient isn't in your database?"**
It's marked as unmatched, the report's confidence level drops honestly, and the
name is queued in `unknown_ingredients` for an admin to review and add — so the
knowledge base grows from real usage.

**"How do you handle OCR mistakes?"**
Three ways: OCR confidence feeds the overall confidence score; the fuzzy
matcher tolerates spelling errors (67% similarity threshold); and anything
still unmatched is surfaced as "unknown" rather than guessed.

**"How is this different from existing food apps?"**
Built around Indian FSSAI regulations (not just US/EU data); every result is
explainable — match method, rule, and citation shown per ingredient; confidence
badges instead of false certainty; and AI is restricted to explanation, not
decision-making.

**"How is the admin panel secured?"**
Three independent layers: route guard, server-side role check on every admin
function, and database row-level security. Roles live in a protected
`user_roles` table checked via a security-definer function — never in
user-editable metadata.

**"Can the database grow?"**
Yes — it's migration-based. Adding ingredients, aliases or rules is a new SQL
migration; the unknown-ingredient queue tells us exactly what to add next.

**"What are the limitations?"**
Knowledge base currently covers 172 canonical ingredients (growing via the
unknown queue); OCR quality depends on photo clarity; nutrition analysis needs
nutrition facts (mainly via barcode); Google sign-in on self-hosted deployments
needs the project's own OAuth keys.

**"Future scope?"**
Larger knowledge base, regional-language labels, personalised dietary profiles,
offline mode, and retailer/manufacturer dashboards.

---

## 10. One-Line Summary (memorise this)

> "Images and barcodes become text, text becomes tokens, tokens are matched
> deterministically against a trusted-source database, rules produce the score
> and NOVA group, and AI is restricted to explaining those verified results in
> plain language."
