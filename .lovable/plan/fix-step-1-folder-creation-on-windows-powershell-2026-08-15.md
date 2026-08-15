# Fix Step 1: Folder creation on Windows PowerShell

## Problem
The previous command used `mkdir -p`, which is a Unix/bash flag. Windows PowerShell does not accept `-p` as a positional argument for `mkdir`, so it fails.

## Fix
Use the PowerShell native syntax for nested folders. In PowerShell, `mkdir` is an alias for `New-Item -ItemType Directory`, and it accepts a comma-separated list of paths without needing a `-p` flag.

Run this single command from inside the `labellens` folder:

```powershell
New-Item -ItemType Directory -Path "src/routes", "src/components/labellens", "src/lib/engine", "src/assets", "src/integrations/supabase", "src/hooks", "public", "supabase/migrations"
```

If you prefer the shorter `mkdir` form, this also works in PowerShell:

```powershell
mkdir "src/routes", "src/components/labellens", "src/lib/engine", "src/assets", "src/integrations/supabase", "src/hooks", "public", "supabase/migrations"
```

## Test
After running, verify the folders exist with:

```powershell
Get-ChildItem -Recurse -Directory
```

You should see all eight folders listed (`src/routes`, `src/components/labellens`, `src/lib/engine`, `src/assets`, `src/integrations/supabase`, `src/hooks`, `public`, `supabase/migrations`).

## Next step
Once this passes, the next step will be to add the `package.json` file in the root of `labellens` and run `npm install`.

Reply "DONE" when you have successfully created the folders and seen them listed.
