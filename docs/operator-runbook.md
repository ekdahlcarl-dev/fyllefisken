# FylleFisken production runbook

## Daily operation

Production: https://fyllefisken.vercel.app

- Use `/admin/competition` to create a season, configure its three days, open/close registration, finalize a season, or explicitly reopen it.
- Use `/catches` to correct your own entry while the day is open. Closed-day mistakes require the administrator to explicitly reopen the season/day first; lifecycle changes are audited.
- Use `/admin/history` for historical winner-only records. Closed digital seasons are derived from the scoring engine and are not overwritten by manual history.

## Member onboarding

FylleFisken is invite-only. Add/invite friends through Supabase Auth; do not enable public sign-up. After the invite is accepted, verify that the user has a `public.profiles` row. The app redirects authenticated users without a profile to `/unauthorized`.

Short member guide to send with an invitation:

1. Open the invitation and set your password.
2. Sign in at https://fyllefisken.vercel.app/login.
3. Use **Registrera fångst** during an open competition day. Length is entered as whole centimeters, 10–150 cm.
4. Use **Live resultat** for daily and overall Big Five scoring.
5. Use **Historik** for previous winners and **Bilder** for memories.

## Scoring source of truth

- Three competition days.
- Each day: longest pike = 1 point; Big Five sum = 1 point.
- Overall: longest pike = 1 point; combined-three-day Big Five = 1 point.
- Category ties split 0.5 / 0.5.
- Maximum total = 8 points.
- If final total points are equal, the team with the single longest pike across the competition wins. If those longest pikes are equal, the result is a true tie.
- Final winner stays hidden until the season is closed and all three days are closed.

## Backup and recovery

Before destructive administration or a major migration, confirm a current database backup exists. Supabase paid projects provide dashboard backups; for environments without retained daily backups, create an off-site logical dump with the current Supabase CLI `db dump` workflow. Storage objects are separate from database backups, so photo objects require their own storage backup strategy.

Recovery procedure:

1. Stop competition writes by closing relevant days/season if the application is still reachable.
2. Identify the last known-good restore point or logical dump.
3. Restore the database from Supabase Dashboard > Database > Backups, or restore the logical dump into a recovery project first when practical.
4. Verify Auth/profile counts, seasons/days, catches, yearly winners, photos metadata, RLS policies, and lifecycle RPCs.
5. Verify Storage photo objects separately.
6. Run the production smoke checklist below before reopening registration.

## Production smoke checklist

- `/login` loads without server error.
- Unauthenticated access to member pages redirects to `/login`.
- Member can sign in and view results/history/photos.
- A whole-centimeter catch can be entered on an open day and corrected/deleted by its creator while open.
- Closed days reject ordinary catch writes.
- Admin can explicitly reopen and the lifecycle audit records the action.
- `/results` matches the scoring regression suite.
- `/history` shows closed digital seasons without overwriting historical winner-only data.
- `/admin/competition` and `/admin/history` reject non-admin members.

## Monitoring

- Vercel: check the latest production deployment is `READY`; review runtime errors for 5xx responses.
- GitHub: `CI` must pass Tests, Typecheck, Lint, Formatting and Build before merge.
- Supabase: run Security Advisors after schema/RLS/function changes and review database logs when writes fail.
- Keep the Supabase migration history aligned with migration filenames committed to `main`.

## Known security setting

Supabase Security Advisor currently warns if leaked-password protection is disabled. Enable leaked-password protection in Auth settings when available for the project plan. This is defense-in-depth; authorization remains enforced by profiles, server guards, grants and RLS.
