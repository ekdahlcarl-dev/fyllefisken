create type if not exists public.member_role as enum ('member', 'admin');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
grant select, update on public.profiles to authenticated;

drop policy if exists "members can read profiles" on public.profiles;
create policy "members can read profiles" on public.profiles for select to authenticated
using (exists (select 1 from public.profiles self where self.id = (select auth.uid())));

drop policy if exists "members can update own profile" on public.profiles;
create policy "members can update own profile" on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
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
      case when new.raw_app_meta_data ->> 'role' = 'admin' then 'admin'::public.member_role else 'member'::public.member_role end
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();
