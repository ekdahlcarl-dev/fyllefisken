create schema if not exists private;
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1)), case when new.raw_app_meta_data ->> 'role' = 'admin' then 'admin'::public.member_role else 'member'::public.member_role end);
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure private.handle_new_user();
drop function if exists public.handle_new_user();
drop policy if exists "members can update own profile" on public.profiles;
revoke update on public.profiles from authenticated;
