create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  catch_id uuid references public.catches(id) on delete cascade,
  year integer check (year between 2011 and 2100),
  object_path text not null unique,
  caption text check (char_length(caption) <= 500),
  credit text check (char_length(credit) <= 120),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint photos_exactly_one_parent check ((catch_id is not null) <> (year is not null))
);

create index if not exists photos_catch_idx on public.photos(catch_id, sort_order, created_at);
create index if not exists photos_year_idx on public.photos(year desc, sort_order, created_at);
alter table public.photos enable row level security;
revoke all on table public.photos from anon, authenticated;
grant select, insert, update, delete on table public.photos to authenticated;

create policy "members can read photos" on public.photos for select to authenticated using ((select auth.uid()) is not null);
create policy "authorized users can insert photos" on public.photos for insert to authenticated with check (
  created_by = (select auth.uid()) and object_path like (select auth.uid())::text || '/%' and (
    (catch_id is not null and exists (select 1 from public.catches c where c.id = catch_id and (c.created_by = (select auth.uid()) or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))))
    or (year is not null and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  )
);
create policy "authorized users can update photos" on public.photos for update to authenticated
using (created_by = (select auth.uid()) or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
with check (object_path like created_by::text || '/%' and ((catch_id is not null and exists (select 1 from public.catches c where c.id = catch_id and (c.created_by = (select auth.uid()) or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')))) or (year is not null and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))));
create policy "authorized users can delete photos" on public.photos for delete to authenticated using (created_by = (select auth.uid()) or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fyllefisken-photos', 'fyllefisken-photos', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "members can read private competition photos" on storage.objects for select to authenticated using (bucket_id = 'fyllefisken-photos' and (select auth.uid()) is not null);
create policy "members upload to own photo folder" on storage.objects for insert to authenticated with check (bucket_id = 'fyllefisken-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owners or admins delete competition photos" on storage.objects for delete to authenticated using (bucket_id = 'fyllefisken-photos' and (owner_id = (select auth.uid())::text or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')));
