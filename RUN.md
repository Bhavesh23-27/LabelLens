# How to run LabelLens on your PC

There is **no `index.html` to double-click**. LabelLens is not a plain HTML site:
the ingredient analysis, the barcode lookup and the database calls all run on a
small server that starts together with the page. So it is started with one
command instead of opening a file.

## Every time you want to use it

Open PowerShell in the project folder and run:

```powershell
npm start
```

Then open the URL it prints (usually http://localhost:8080).
Press `Ctrl + C` in PowerShell to stop it.

## First time only

```powershell
npm install
npm start
```

Needs **Node 20 or newer** (check with `node -v`).

## Easiest option on Windows

Double-click **`start-labellens.bat`** in the project folder. It installs
anything missing the first time, then starts the app and prints the URL.

## Getting the latest version from GitHub

```powershell
git pull
npm install
npm start
```

## Folders, in plain words

| Folder | What is inside |
| --- | --- |
| `src/routes` | One file per page (`index.tsx` = home, `scan.tsx` = scan page) |
| `src/components` | Reusable pieces of the interface |
| `src/lib` | The analysis brain: parser, matcher, NOVA, scoring |
| `public` | Files served as-is (the tab icon lives here) |
| `supabase` | Database setup for the ingredient knowledge base |
