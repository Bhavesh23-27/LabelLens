# Fix: "Ingredient verification is temporarily unavailable" on photo scan

## Root cause (confirmed)

The error banner appears when the analysis server function cannot load the knowledge base. I checked the live database: **all application tables are gone** — `public.ingredients` and every other table no longer exist, and there are no RLS policies. The backend database was reset/wiped at some point, so every scan fails at the knowledge-load step.

The good news: all 8 migration files (schema + the full seeded dataset of 172+ ingredients, 516+ aliases, FSSAI rules, sources) are still safely stored in the project at `supabase/migrations/`. Nothing needs to be rebuilt — only re-applied.

## Fix steps

1. Re-apply the 8 migration files to the database, in filename order:
   - Core schema: tables (ingredients, ingredient_aliases, fssai_ingredient_rules, data_sources, profiles, user_roles, scans, reports, unknown_ingredients), enums, RLS policies, grants
   - Seed data: the full verified ingredient dataset, aliases, FSSAI rules, and source records
   - Admin/roles additions from the later migrations
2. Verify the restore:
   - Confirm row counts (ingredients ~172+, aliases ~516+, rules ~172, sources ~14)
   - Confirm anon SELECT policies exist on the public knowledge tables
3. Test the exact failing flow end-to-end in the preview: upload a label photo → OCR → analysis → consumer report renders without the error banner.
4. Also spot-check paste-text analysis, barcode lookup, sign-in, and /sources, since they depend on the same tables.

## Technical details

- Migrations run via the Lovable Cloud SQL tool, file by file, in timestamp order.
- No app code changes are needed — `src/lib/knowledge.server.ts` and the analysis pipeline are correct; they just had no data to read.
- If any migration partially fails (e.g. a leftover object), I will adjust and re-run only the failing statements.

## Note

Your previous scans and user accounts were stored in the same database, so they were wiped too. After the restore, sign up again (the first account becomes admin automatically, as before).
