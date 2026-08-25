# Authentication and permissions

FylleFisken uses Supabase email/password authentication with invitation-only account creation.

## Roles

- `member`: may view competition data and, in later work packages, create catches and correct their own catches while a day is open.
- `admin`: has member access plus administrative routes and future season/invitation/locked-data management.

Authorization is enforced in two places: Next.js server-side guards (`requireMember` / `requireAdmin`) and Supabase grants/RLS. UI visibility is not treated as an authorization boundary.

## Invite flow

1. An administrator creates an invitation in Supabase Auth.
2. The invite email must point to `/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/auth/set-password`.
3. The server exchanges the token for a cookie-backed session.
4. The invited user chooses a password and is redirected to the protected application.

Public self-registration must be disabled in the hosted Supabase Auth provider settings. The application intentionally exposes no sign-up action.

## Environment

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in local, Vercel Preview and Vercel Production environments. Never expose a Supabase secret/service-role key to the browser.
