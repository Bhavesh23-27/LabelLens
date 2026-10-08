Fix "Continue with Google" 404 on Vercel

## Why it happens
On any address except localhost, the Google button uses a sign-in helper that only exists on the original hosting. Vercel doesn't have that helper, so the browser lands on a page that doesn't exist (404). Email-and-password sign-in is not affected.

## Fix
1. On the sign-in page, treat every address that isn't the original hosting (Vercel, localhost, custom domains) the same way localhost is treated today: send Google sign-in straight to the app's own sign-in service, then return to the same site.
2. If Google sign-in isn't set up for that address, show a clear message ("Google sign-in isn't available on this site yet, please use email") instead of a broken page.

## What you need to do afterwards (one-time, for Google to work on Vercel)
- Google sign-in outside the original hosting needs your own Google sign-in keys (the same setup that gave the "missing OAuth secret" error on localhost earlier). Once those keys are added in the backend sign-in settings, add your `.vercel.app` address to the allowed redirect addresses.
- Until then, email-and-password sign-in works fully on Vercel. Use it for your PQAI demo.

## Technical details
- `src/routes/auth.tsx`: replace the `isLocalHost` check with `useBroker = hostname.endsWith(".lovable.app") || hostname.endsWith(".lovableproject.com")`; in all other cases use `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/auth" } })`.
- Catch the "Unsupported provider" / "missing OAuth secret" error and show a friendly toast.
- Update `DEPLOY-VERCEL.md` Google section to match.
