# Fix: "must select atleast 1 redirect URL" when saving Google sign-in

The auth settings form refuses to save because no redirect URL is ticked. Your own Google credentials still need at least one redirect URL selected, so we add that same URL to your Google client first, then tick it here.

## Steps for you (in order)

1. Open Google Cloud Console -> APIs & Services -> Credentials -> your "LabelLens Web" client.
2. Under **Authorized redirect URIs**, keep the existing backend callback URL and add the Lovable broker URL shown next to the checkbox in the auth settings screen (the `https://oauth.lovable.app/...` one). Copy it exactly, no trailing slash.
3. Save in Google Cloud Console.
4. Back in the auth settings screen: keep **Your own credentials** selected, Client ID and Client Secret filled, and now **tick the checkbox** for that redirect URL.
5. Click Save. The error should be gone.

## Then we test

- Hosted preview: try Continue with Google, confirm it returns signed in.
- Local (`http://localhost:8080`): try Continue with Google; the sign-in page uses the direct backend OAuth flow locally, which uses the backend callback URL you added in step 2.

## If local sign-in still fails

I will adjust the sign-in page so the local flow returns to `http://localhost:8080/auth` reliably, and confirm that URL is in the backend redirect allow-list. No other app code changes are needed for this fix.
