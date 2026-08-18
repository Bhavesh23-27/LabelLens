# Data Sources Bibliography — Teacher-Facing PDF

Generate a printable PDF that documents exactly where every piece of LabelLens data came from, so it can be attached to your submission or handed to your teacher.

## What the document contains

1. **Cover page** — LabelLens title, subtitle "Data Sources & Collection Methodology", date, and one-line project description. Styled in the project's Midnight Lab palette (ink navy + lime).
2. **How the data was collected** — plain-language explanation: the knowledge base was manually curated from public regulatory and scientific documents, then written into version-controlled SQL migrations; nothing was scraped from unverified websites; runtime product data comes from the Open Food Facts API.
3. **Source register table** — all 14 registered sources read live from the database, with columns: source name, type (regulatory / scientific / guideline / classification / open dataset), version or edition, licence, and official reference link. Grouped by type:
   - Regulatory: FSSAI Food Products Standards & Food Additives (2011, as amended), FSSAI Labelling & Display (2020), FSSAI Advertising & Claims (2018), Codex Alimentarius GSFA (CXS 192-1995)
   - Scientific: JECFA (FAO/WHO) ADI evaluations, EFSA Food Additive Re-evaluation Programme, IARC Monographs Vol. 1–136
   - Guidelines: WHO sugars intake (2015), WHO sodium intake (2012), ICMR-NIN Dietary Guidelines for Indians (2024)
   - Classification: NOVA (Monteiro et al., 2019)
   - Datasets: USDA FoodData Central, Open Food Facts (ODbL)
   - Internal: LabelLens Curated Ingredient Dictionary (v0.1-seed)
4. **Which source feeds which part of the app** — a mapping table: additive permission status -> FSSAI + Codex; processing class -> NOVA; safety limits/ADI -> JECFA + EFSA; hazard classification -> IARC; sugar/salt thresholds -> WHO + ICMR-NIN; barcode product lookup -> Open Food Facts.
5. **Live database counts** — ingredient, alias, rule, regulation and source row counts queried at generation time, so the numbers are verifiable, not claimed.
6. **Academic citations** — full bibliographic citation block (author, title, journal/publisher, year, URL) for the NOVA paper, WHO guidelines, and ICMR-NIN.
7. **Limitations & honesty statement** — seed records are structured summaries that must be checked against the latest official text; the app is a consumer information assistant, not medical advice; FSSAI approves safety, not healthiness.

## Technical approach

- Query the live database for `data_sources`, plus counts from `ingredients`, `ingredient_aliases`, `fssai_regulations`, `fssai_ingredient_rules`.
- Build the PDF with a Python script using ReportLab Platypus (registered DejaVu Sans TTF so accented characters and the rupee/degree glyphs render correctly).
- Write the result to `/mnt/documents/LabelLens-Data-Sources.pdf` and surface it as a downloadable artifact.
- Run visual QA: render every page to images, inspect for clipped table cells, overflow, and contrast, and fix before delivering.
- No changes to app source code — this is a generated document only.
