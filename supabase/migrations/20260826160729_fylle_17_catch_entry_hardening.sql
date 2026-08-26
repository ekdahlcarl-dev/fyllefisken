alter table public.catches add column if not exists submission_key uuid;

create unique index if not exists catches_creator_submission_key_uidx
  on public.catches (created_by, submission_key)
  where submission_key is not null;

drop policy if exists "members can enter catches on open days" on public.catches;
create policy "members can enter catches on open days"
on public.catches for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.competition_days d
    join public.seasons s on s.id = d.season_id
    where d.id = catches.competition_day_id
      and d.season_id = catches.season_id
      and d.is_open
      and s.status = 'open'::public.season_status
  )
);

drop policy if exists "owners or admins can update catches on open days" on public.catches;
create policy "owners or admins can update catches on open days"
on public.catches for update
to authenticated
using (
  created_by = (select auth.uid())
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'::public.member_role
  )
)
with check (
  (
    created_by = (select auth.uid())
    and exists (
      select 1
      from public.competition_days d
      join public.seasons s on s.id = d.season_id
      where d.id = catches.competition_day_id
        and d.season_id = catches.season_id
        and d.is_open
        and s.status = 'open'::public.season_status
    )
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'::public.member_role
  )
);

drop policy if exists "owners or admins can delete catches" on public.catches;
create policy "owners or admins can delete catches"
on public.catches for delete
to authenticated
using (
  (
    created_by = (select auth.uid())
    and exists (
      select 1
      from public.competition_days d
      join public.seasons s on s.id = d.season_id
      where d.id = catches.competition_day_id
        and d.season_id = catches.season_id
        and d.is_open
        and s.status = 'open'::public.season_status
    )
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'::public.member_role
  )
);