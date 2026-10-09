# LabelLens Complete Project Explanation Document

## Goal
Create one comprehensive, student-friendly document (`PROJECT-EXPLAINED.md` at the repo root) that explains every part of LabelLens — pipelines, workflows, implementation details, and answers to likely examiner questions — so the user can present and defend the project confidently.

## Document contents

### 1. Project overview
- What LabelLens does, the problem it solves (consumers can't understand food labels), who it serves.

### 2. Technology stack (with "why we chose it")
- React 19 + TanStack Start v1 (SSR, file-based routing, server functions)
- Vite, TypeScript, Tailwind CSS v4
- Lovable Cloud backend: PostgreSQL database, authentication, Row Level Security
- Tesseract.js (browser OCR), vision AI OCR (server), Open Food Facts API (barcode), Gemini AI (explanations only)

### 3. The full analysis pipeline (step by step, matching the block diagram)
1. **Input layer** — upload photo, camera capture, paste text, barcode scan
2. **Extraction** — server vision OCR with browser Tesseract.js fallback; barcode lookup via Open Food Facts
3. **Preprocessing** — OCR text cleaning, ingredient-section extraction, tokenization, normalization, spelling handling (`src/lib/engine/parser.ts`)
4. **Matching engine** — exact → alias → INS/E-number → fuzzy (67% threshold) → unknown queue (`src/lib/engine/matcher.ts`)
5. **Knowledge base** — 172 ingredients, 516 aliases, 172 FSSAI rules, 15 regulations, 14 cited sources
6. **Analysis layer** — NOVA 1–4 classification, FSSAI regulatory checks, concern/allergen detection, nutrition analysis, Insight Score 0–100, confidence level (`nova.ts`, `concerns.ts`, `score.ts`)
7. **AI explanation** — Gemini turns verified results into plain language; never changes the deterministic results
8. **Output** — consumer report card: score, NOVA badge, findings, warnings, confidence badges, citations, disclaimer

### 4. Database design
- Tables: ingredients, ingredient_aliases, fssai_ingredient_rules, fssai_regulations, data_sources, unknown_ingredients, profiles, user_roles, scans/analyses
- How data was gathered (FSSAI, WHO, EFSA, ICMR-NIN, Codex, IARC, PAHO, USDA, Open Food Facts) and why traceability matters
- Version-controlled SQL migrations as the single source of truth

### 5. Authentication & roles
- Email/password signup (instant, auto sign-in), Google OAuth
- User vs admin separation: `user_roles` table, `has_role()` security-definer function, first-account-becomes-admin bootstrap, three-layer admin protection (route guard, server check, RLS)

### 6. Key workflows
- What happens when a photo is uploaded (end to end)
- What happens on barcode scan
- Auto-save to "My Scans" for signed-in users
- Compare two products flow
- Admin panel: knowledge-base editing, unknown-ingredient review, admin promotion

### 7. Design system
- "Midnight Lab" dark theme, semantic color tokens, Space Grotesk/DM Sans/JetBrains Mono

### 8. Deployment
- Lovable hosting vs Vercel deployment, environment variables, what differs between them

### 9. Likely examiner questions + ready answers
- "Why should we trust your data?" → curated from official sources, every claim cited
- "Is the AI deciding safety?" → No — deterministic rules score; AI only explains
- "How is your score calculated?" → weighted 100-point system, reproducible
- "What if an ingredient isn't in the database?" → marked unknown, queued for admin review, lowers confidence
- "How is this different from existing apps?" → FSSAI-specific, explainable matching, confidence badges, citations
- Security, scalability, limitations, future scope

## Deliverable
- `PROJECT-EXPLAINED.md` in the repo root — plain language, organized with headings, ready to read or print for viva prep.
