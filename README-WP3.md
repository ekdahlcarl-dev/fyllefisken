# WP3 deployment checklist

Set these Vercel variables for Preview and Production:

- `NEXT_PUBLIC_SUPABASE_URL=https://urlmipmqbcxwniieqatr.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<Supabase publishable key>`

In Supabase Auth settings disable public signup and configure production/preview redirect URLs. Members must be invited through the admin invite flow. Never add a service-role or secret key to `NEXT_PUBLIC_*` variables.
