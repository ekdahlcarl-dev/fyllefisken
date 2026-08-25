# Invite-only authentication

FylleFisken uses Supabase Auth with cookie-based SSR sessions. Competition pages require both a valid authenticated identity and a corresponding `profiles` row.

Only users created through the Supabase invitation flow receive a profile automatically. Public signup is not exposed in the application, and the database trigger ignores non-invited auth users. Disable **Allow new users to sign up** in Supabase Auth settings as an additional platform-level control.

Required Vercel variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Never expose a Supabase secret/service-role key in `NEXT_PUBLIC_*` variables.

Roles are `member` and `admin`. Authorization is enforced server-side by `requireMember` / `requireAdmin` and at the database layer with RLS.
