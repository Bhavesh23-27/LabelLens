# Stop the micro-step loop: run this working LabelLens locally

Your hand-built local copy keeps producing type errors because each file was typed separately and the types drifted apart. Instead of chasing them one by one, we take the version that already works — this project — and put it on your machine.

## What you'll end up with

- A GitHub repo containing this complete LabelLens app (engine, scan flow, barcode lookup, consumer report, Midnight Lab theme).
- The same app running at `localhost` on your PC via `npm run dev`.
- Two-way sync: edits you push to GitHub appear here, and changes made here are pushed to GitHub.

## Steps you do (in the Lovable UI)

1. Click the **Plus (+)** button in the chat input, choose **GitHub**, authorize the Lovable GitHub App, pick your account, then **Create Repository**.
2. On your PC, in a fresh folder (do NOT reuse `E:\Projects\LabelLens` — keep the old attempt aside):
   ```powershell
   git clone https://github.com/<your-username>/<repo-name>.git labellens
   cd labellens
   npm install
   ```
3. Create a `.env` file in the project root with these six keys (I'll give you the exact values to paste in chat once the repo exists — they are the public/anon backend keys, safe for local use):
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_PUBLISHABLE_KEY=...
   VITE_SUPABASE_PROJECT_ID=...
   SUPABASE_URL=...
   SUPABASE_PUBLISHABLE_KEY=...
   SUPABASE_PROJECT_ID=...
   ```
4. Run it:
   ```powershell
   npm run dev
   ```
   Expected: the dev server prints a local URL, and opening it shows the dark LabelLens landing page. Scan, barcode lookup and the consumer report all work against the existing cloud database.

## What I do in this project

- Confirm nothing local-only is missing from the repo (a `.env.example` listing the six keys, and a short `README` section with the clone/install/run commands so future-you isn't guessing).
- Note that the AI explanation step runs through the hosted AI gateway; when the key isn't present locally the app still returns the full deterministic analysis and only omits the AI paragraph.

## About your old local folder

Keep `E:\Projects\LabelLens` as a learning reference, but don't try to merge it into the clone — the type definitions differ. Once the clone runs, we continue learning by reading and modifying real files in it, which is far faster than retyping them.

## Technical notes

- Stack: TanStack Start v1 + Vite 8, React 19, Tailwind v4, TypeScript, Supabase-backed cloud.
- Node 20+ required for Vite 8.
- OCR here runs server-side through the AI gateway rather than browser Tesseract, so no WASM setup is needed locally.
- Database schema and seed data already live in `supabase/migrations`, so no local database work is needed — the app talks to the existing hosted one.
