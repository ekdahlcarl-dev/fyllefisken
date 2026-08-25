create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.invited_at is not null then
    insert into public.profiles (id, email, display_name, role)
    values (
      new.id,
      coalesce(new.email, ''),
      coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1)),
      case
        when new.raw_app_meta_data ->> 'role' = 'admin' then 'admin'::public.member_role
        else 'member'::public.member_role
      end
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure private.handle_new_user();

drop function if exists public.handle_new_user();

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;

drop policy if exists "members can read profiles" on public.profiles;
drop policy if exists "members can update own profile" on public.profiles;
drop policy if exists "members can read own profile" on public.profiles;

create policy "members can read own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);
