# Admin / User Role Separation

## Why this is needed

LabelLens already has an `/admin` page and admin-only database tables, but the route itself is not gated. Any signed-in user who stumbles on `/admin` will see the page (it only fails if the server function throws). The database already has the scaffolding — `app_role` enum, `user_roles` table, and `has_role()` security-definer function — and the admin server functions already call `assertAdmin`. What’s missing is:

1. A safe way to bootstrap the first admin.
2. A route-level guard so non-admins are redirected away from `/admin`.
3. A UI for the owner to promote other users to admin.
4. A UI for admins to review/delete user scans and reports.
5. Navigation that only shows "Admin" to admins.

## Current state

- `src/routes/_authenticated/admin.tsx` exists but has no `beforeLoad` admin check.
- `src/lib/labellens.functions.ts` already has `assertAdmin`, `checkIsAdmin`, and admin-only server functions (`adminOverview`, `adminSaveIngredient`, `adminResolveUnknown`).
- New users currently get only the `'user'` role via the `handle_new_user()` trigger.
- There is no server function or UI to assign the `'admin'` role.

## Plan

### 1. Bootstrap the first admin

Add a migration that promotes the first registered user to `admin`. This avoids a chicken-and-egg problem where nobody can access admin UI to promote anyone else.

- Add a database function `promote_first_user_to_admin()` and an `INSERT` trigger on `auth.users` that grants `admin` to the first user if no admin exists yet.
- Keep the existing `handle_new_user()` trigger that creates the profile and base `'user'` role.
- Backfill: if there are existing users and no admin, promote the earliest-created user.

### 2. Add admin route guard

Update `src/routes/_authenticated/admin.tsx` to check admin status in `beforeLoad` using the existing `checkIsAdmin` server function, and redirect non-admins to `/saved` with a toast-style message.

- Use the `_authenticated` layout already in place.
- Do not re-implement a separate auth gate; rely on the integration-managed layout for sign-in.
- Add `errorComponent` and `notFoundComponent` as required by project conventions.

### 3. Expose admin status in auth context

Update `src/hooks/useAuth.ts` (or add a small wrapper) to expose `isAdmin` by calling `checkIsAdmin` once on session change.

- Avoid multiple re-fetches; cache the result alongside the session.
- Return `{ session, user, isAuthenticated, isAdmin, loading }`.

### 4. Update navigation

In `src/components/labellens/site-layout.tsx`, show the "Admin" link only when `isAdmin` is true.

- Add it to the desktop header dropdown/account area, not the mobile bottom nav (admin is not a primary consumer action).
- Keep the existing footer link but consider hiding it for non-admins to avoid confusion.

### 5. Build admin user-promotion UI

Add an "Admins" section to `src/routes/_authenticated/admin.tsx` (or a new sub-route if the page becomes too long).

- List current admins by reading `user_roles` joined to `profiles` via an admin-only server function.
- Allow the owner to promote another registered user by email.
- Provide a confirmation step; demotion should require a second confirm to avoid accidental lockouts.
- Server function `adminPromoteUser` and `adminDemoteUser` must verify `assertAdmin` and use `supabaseAdmin`.

### 6. Build admin scan/report review UI

Add a "Reports" section to the admin page.

- List recent `product_scans` and `analysis_results` with user email/profile name, score, NOVA class, date, and a link to the full report.
- Allow admins to delete spam/inappropriate scans.
- Add server functions `adminListReports` and `adminDeleteReport` with `assertAdmin` checks.

### 7. Harden admin server functions

Audit every admin-facing function in `src/lib/labellens.functions.ts`:

- Confirm `assertAdmin(context)` is called before any `supabaseAdmin` usage.
- Confirm no admin function leaks PII or full user tables unnecessarily.
- Ensure deleted reports cascade or handle `analysis_results` correctly.

### 8. Testing

- Verify a non-admin signed-in user is redirected away from `/admin`.
- Verify the first user becomes admin automatically.
- Verify an admin can promote another user and that the promoted user can access `/admin`.
- Verify an admin can list and delete reports.
- Verify no console errors and mobile layout remains usable.

## Out of scope

- A full CMS for ingredients; existing `adminSaveIngredient` covers basic edits.
- Audit logs for admin actions (can be added later if required).
- Per-page permissions beyond admin/user.

## Files expected to change

- `supabase/migrations/`: bootstrap-first-admin migration.
- `src/routes/_authenticated/admin.tsx`: route guard + new sections.
- `src/hooks/useAuth.ts`: expose `isAdmin`.
- `src/components/labellens/site-layout.tsx`: conditional admin link.
- `src/lib/labellens.functions.ts`: add `adminListReports`, `adminDeleteReport`, `adminListAdmins`, `adminPromoteUser`, `adminDemoteUser`.
