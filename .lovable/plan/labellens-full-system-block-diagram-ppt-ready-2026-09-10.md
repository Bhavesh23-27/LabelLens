# LabelLens Full-System Block Diagram (PPT-ready)

Create a new presentation block diagram image covering the complete LabelLens pipeline you listed, styled as clean PPT-style shapes (rounded boxes, clear arrows, icons) — not a copy of the reference, but easy to explain verbally.

## Layout

Horizontal, left → right flow (with a second row where needed), 1920×1080 PNG:

```text
[INPUT LAYER]            [EXTRACTION]          [PREPROCESSING]        [MATCHING ENGINE]
 Upload photo            OCR (Tesseract.js)    Text cleaning          Exact → Alias →
 Click photo (camera)    Barcode lookup        Tokenization           INS/E-number →
 Paste ingredient text  (Open Food Facts)      Spelling correction    Fuzzy match
 Scan barcode                                   Structured list       Confidence scores
      | raw image / barcode / text  -->   raw text   -->   clean ingredient list   -->
                                            |
                                    [KNOWLEDGE BASE]  (feeds Matching + Analysis)
                                     FSSAI rules • NOVA classes • additive concerns
                                     allergens/dietary flags • trusted sources
                                     badges: FSSAI-backed, NOVA-based, Deterministic rules
                                            |
                                    [ANALYSIS LAYER]        [AI EXPLANATION]       [OUTPUT]
                                     NOVA 1–4                Gemini AI             Consumer Report Card
                                     FSSAI flag checks       plain-language        Insight Score 0–100
                                     Concern detection       consumer summary      NOVA badge
                                     Insight Score 0–100                           warnings • confidence
                                                                                   badges • citations • disclaimer
```

## Content rules

- Every box = one module with an icon and 2–4 short bullet lines.
- Arrows labeled: raw image, text, matched ingredients, classified result, plain-language summary.
- Knowledge Base sits between Matching and Analysis with bidirectional arrows.
- Trust badges near the Knowledge Base: "FSSAI-backed", "NOVA-based", "Deterministic rules".

## Style

- Match the Midnight Lab identity (dark ink-navy background, electric lime accents, mint glow) OR offer a light variant — will produce the dark branded version first since it matches the app and the earlier diagram.
- Space Grotesk headings, clean sans body, generous spacing, no clipping or overlapping text.

## Technical

- Generated image saved to `/mnt/documents/LabelLens-Block-Diagram-Full.png`, 1920×1080.
- QA pass: verify no clipped/overlapping text and readable at slide scale.
- No codebase changes.
