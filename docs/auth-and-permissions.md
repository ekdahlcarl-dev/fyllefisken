# Invite-only authentication

FylleFisken uses Supabase Auth. Public self-registration is intentionally not implemented. New members are created through the Supabase admin invite flow (`inviteUserByEmail`) and receive the `member` role by default. Admin authorization belongs in `app_metadata` / the protected `profiles.role`, never user-editable metadata.

## Required environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The service-role/secret key must never be exposed to the browser or committed.

## Supabase dashboard

Disable **Allow new users to sign up** so password signup cannot be used outside the admin invite flow. Configure the Site URL and redirect URLs for production and preview. Invite emails should redirect through `/auth/confirm?next=/auth/set-password`.

## Authorization

The application validates the authenticated identity server-side before rendering competition data. The `profiles` table has RLS enabled; anonymous access is revoked. Roles are `member` and `admin`.
