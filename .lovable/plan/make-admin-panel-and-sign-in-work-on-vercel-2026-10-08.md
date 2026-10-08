# Make Admin panel and sign-in work on Vercel

## 1. Admin panel (fully fixable)
Today every admin action uses a privileged key that only exists on the Lovable-hosted site. Instead, admin actions will run as the signed-in admin themselves, and the database will allow those actions only for accounts with the admin role. Result: same security, no secret key needed, works on Vercel and locally.

- Database update: add admin-only permissions (checked through the existing role check) for reading all scans/reports, editing ingredients, resolving unknown ingredients, managing admin roles, and deleting reports. Add a safe lookup function "find profile by email" usable only by admins (replaces the user-list call that needs the privileged key). Add a safe function for queuing unknown ingredients from scans.
- Switch all admin actions (overview, save ingredient, resolve unknown, list/promote/demote admins, list/delete reports) and the unknown-ingredient queue to these paths. Keep "can't remove the last admin" guard.
- Test: sign in as admin in preview, open Admin, edit an ingredient, promote/demote, delete a report.

## 2. Google sign-in on Vercel (partly fixable)
- Fixable: on non-Lovable addresses, show a clear message under the Google button if it fails, and keep email/password as the main option. Update the deploy guide with the exact redirect address to whitelist.
- Not fixable by code: the Google consent screen naming the shared sign-in domain. That needs your own Google sign-in app plus a custom sign-in domain (paid). Email/password has no such text.

## Technical details
- New migration: RLS policies `using (has_role(auth.uid(),'admin'))` on product_scans, analysis_results, ingredients, unknown_ingredients, user_roles, profiles; security-definer `admin_find_user_by_email(text)` (checks has_role inside) and `queue_unknown_ingredient(text)`; grants to authenticated.
- `src/lib/labellens.functions.ts`: replace `supabaseAdmin` with `context.supabase` (requireSupabaseAuth) / `rpc` calls.
- `DEPLOY-VERCEL.md`: remove admin caveat, refine Google section.
