# LabelLens — Teacher Demo Script

Use this script during your project demo. It assumes you are running the app at
`http://localhost:8080` (or the hosted preview URL).

---

## 1. Opening line (30 seconds)

> "LabelLens is an ingredient-intelligence app for packaged food. You scan a
> barcode, photograph the ingredient panel, or paste the ingredient text. The app
> extracts every ingredient, matches it against a structured knowledge base built
> from FSSAI and NOVA sources, classifies how processed the product is, and
> explains the result in plain language."

---

## 2. Live demo flow (3–4 minutes)

### A. Homepage
1. Open `/`.
2. Point out the two main actions: **Scan a product** and **See how it works**.
3. Mention: no account is required to analyse a label; signing in only saves history.

### B. Paste-text analysis
1. Go to **Scan a product** → **Paste text** tab.
2. Paste a sample label, for example:

```text
INGREDIENTS: Refined wheat flour (maida) 32%, Sugar, Edible vegetable oil (palm oil), Cocoa solids, Milk solids, Invert sugar syrup, Glucose syrup, Emulsifier (Lecithin – INS 322), Raising agent (INS 500(ii)), Iodised salt, Artificial flavouring substances.
```

3. Click **Analyse ingredients**.
4. When the report appears, walk through the cards in order:
   - **Insight Score** — a 0–100 readability/process transparency score, not a medical rating.
   - **NOVA classification** — shows how processed the product is (1 = unprocessed, 4 = ultra-processed).
   - **Matched ingredients** — count of ingredients that exist in the FSSAI-backed database.
   - **Findings** — added sugars, numbered additives, allergens, sodium, etc.
   - **Why trust this result?** — number of sources, match confidence, and knowledge-base date.
   - **Every ingredient in plain English** — tap any ingredient card to see what it is and which regulation references it.

### C. Compare two products
1. Go to **Compare**.
2. Click **Use sample labels** to auto-fill realistic snack and muesli labels.
3. Click **Compare products**.
4. Show the side-by-side result: scores, NOVA levels, additive counts, allergens, and the plain-language winner.

### D. Sources & Methodology page
1. Go to **Data sources**.
2. Walk through:
   - Live database counts (ingredients, aliases, FSSAI rules, clauses, sources).
   - The list of authorities: FSSAI, WHO, Codex Alimentarius, EFSA, ICMR-NIN, JECFA, etc.
   - The disclaimer that this is consumer information, not medical or regulatory advice.

---

## 3. Questions your teacher may ask

### "Which database did you use?"
> "The backend is a Supabase PostgreSQL database. The ingredient knowledge base is
> seeded from official sources: FSSAI regulations and the NOVA food-classification
> framework, plus supporting documents from WHO, Codex, EFSA, ICMR-NIN and JECFA.
> These are stored in `supabase/migrations/`."

### "Why should anyone trust this data?"
> "The analysis is deterministic, not black-box. Each ingredient is parsed,
> normalised, matched against the curated database, and then scored with visible
> rules. Every matched ingredient shows its regulatory source, and the Sources
> page lists the exact documents we used."

### "A product is already FSSAI-approved; how can you say it has harmful ingredients?"
> "LabelLens is not greater than FSSAI. FSSAI decides whether a product is legal to
> sell. LabelLens only translates the label and highlights processing level,
> allergens, added sugars, sodium, and additives so the consumer can make an
> informed choice."

### "Why would a brand list harmful ingredients?"
> "Brands don't list ingredients voluntarily — FSSAI mandates ingredient
> disclosure on packaged-food labels. LabelLens reads the legally required label
> and interprets it."

### "Where does the AI fit in?"
> "AI is used only for the plain-language explanation paragraph and for OCR when
> a photo is uploaded. The score, the NOVA class, the ingredient matches, and
> the regulatory flags all come from deterministic code in `src/lib/engine/`."

---

## 4. If the teacher wants to see code

Show these files/folders:

| Location | What it contains |
| --- | --- |
| `src/lib/engine/` | Parser, matcher, NOVA classifier, concern detector, scorer |
| `supabase/migrations/` | Database schema and seeded FSSAI/NOVA knowledge base |
| `src/routes/scan.tsx` | Scan page: barcode, photo, paste text |
| `src/routes/compare.tsx` | Side-by-side product comparison |
| `src/routes/sources.tsx` | Sources & methodology page |
| `src/routes/_authenticated/admin.tsx` | Admin dashboard (owner-only) |

---

## 5. Quick reminder for the presenter

- Keep the browser tab open on the **Scan** page before you start so the first load is fast.
- If the barcode lookup returns "not in the open product database", switch to **Paste text** and use the sample labels — that path always works offline.
- If the AI explanation is empty, say: "The deterministic analysis still runs; the AI paragraph is optional and needs an API key in the local environment."
