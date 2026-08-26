-- FYLLE-21: audited, administrator-only competition lifecycle management.

create table public.competition_lifecycle_audit (
  id bigint generated always as identity primary key,
  admin_user_id uuid not null references public.profiles(id) on delete restrict,
  action text not null check (action in (
    'season_created', 'dates_changed', 'day_opened', 'day_closed',
    'day_reopened', 'season_closed', 'season_reopened'
  )),
  season_id uuid not null references public.seasons(id) on delete restrict,
  competition_day_id uuid references public.competition_days(id) on delete restrict,
  previous_state jsonb,
  new_state jsonb not null,
  created_at timestamptz not null default now()
);

create index competition_lifecycle_audit_season_idx
  on public.competition_lifecycle_audit (season_id, created_at desc);

alter table public.competition_lifecycle_audit enable row level security;
revoke all on table public.competition_lifecycle_audit from anon, authenticated;
grant select on table public.competition_lifecycle_audit to authenticated;

alter table public.competition_days add column opened_at timestamptz;
update public.competition_days set opened_at = updated_at where is_open;

create policy "admins can read competition lifecycle audit"
on public.competition_lifecycle_audit for select to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'::public.member_role
));

-- Lifecycle writes must go through the functions below so authorization, state
-- validation, and the audit entry happen in one transaction.
revoke insert, update, delete on table public.seasons, public.competition_days from authenticated;

create or replace function private.assert_competition_admin()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null or not exists (
    select 1 from public.profiles where id = actor and role = 'admin'::public.member_role
  ) then
    raise exception 'Administrator authorization required' using errcode = '42501';
  end if;
  return actor;
end;
$$;

revoke all on function private.assert_competition_admin() from public, anon, authenticated;

create or replace function public.create_competition_season(
  competition_year integer,
  day_1 date,
  day_2 date,
  day_3 date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := private.assert_competition_admin();
  new_season_id uuid;
begin
  if competition_year < 2011 or competition_year > 2100 then
    raise exception 'Competition year is outside the supported range';
  end if;
  if day_1 is null or day_2 is null or day_3 is null or day_1 = day_2 or day_1 = day_3 or day_2 = day_3 then
    raise exception 'Exactly three distinct competition dates are required';
  end if;
  if extract(year from day_1) <> competition_year or extract(year from day_2) <> competition_year or extract(year from day_3) <> competition_year then
    raise exception 'Competition dates must belong to the competition year';
  end if;

  insert into public.seasons (year, status)
  values (competition_year, 'draft'::public.season_status)
  returning id into new_season_id;

  insert into public.competition_days (season_id, day_number, competition_date, is_open)
  values
    (new_season_id, 1, day_1, false),
    (new_season_id, 2, day_2, false),
    (new_season_id, 3, day_3, false);

  insert into public.competition_lifecycle_audit
    (admin_user_id, action, season_id, previous_state, new_state)
  values (
    actor, 'season_created', new_season_id, null,
    jsonb_build_object('year', competition_year, 'status', 'draft', 'dates', jsonb_build_array(day_1, day_2, day_3))
  );
  return new_season_id;
end;
$$;

create or replace function public.configure_competition_dates(
  target_season_id uuid,
  day_1 date,
  day_2 date,
  day_3 date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := private.assert_competition_admin();
  current_status public.season_status;
  competition_year integer;
  old_dates jsonb;
begin
  select status, year into current_status, competition_year from public.seasons where id = target_season_id for update;
  if not found then raise exception 'Season not found'; end if;
  if current_status <> 'draft'::public.season_status then
    raise exception 'Dates can only be changed while the season is in draft';
  end if;
  if day_1 is null or day_2 is null or day_3 is null or day_1 = day_2 or day_1 = day_3 or day_2 = day_3 then
    raise exception 'Exactly three distinct competition dates are required';
  end if;
  if extract(year from day_1) <> competition_year or extract(year from day_2) <> competition_year or extract(year from day_3) <> competition_year then
    raise exception 'Competition dates must belong to the competition year';
  end if;
  select jsonb_agg(competition_date order by day_number) into old_dates
  from public.competition_days where season_id = target_season_id;
  if jsonb_array_length(coalesce(old_dates, '[]'::jsonb)) <> 3 then
    raise exception 'Season must have exactly three competition days';
  end if;

  -- Move through season-scoped sentinel dates so swapping two dates does not
  -- trip the existing immediate unique constraint midway through the update.
  update public.competition_days
  set competition_date = date '1900-01-01' + day_number,
      updated_at = now()
  where season_id = target_season_id;

  update public.competition_days d
  set competition_date = v.competition_date, updated_at = now()
  from (values (1::smallint, day_1), (2::smallint, day_2), (3::smallint, day_3)) v(day_number, competition_date)
  where d.season_id = target_season_id and d.day_number = v.day_number;

  insert into public.competition_lifecycle_audit
    (admin_user_id, action, season_id, previous_state, new_state)
  values (actor, 'dates_changed', target_season_id,
    jsonb_build_object('dates', old_dates),
    jsonb_build_object('dates', jsonb_build_array(day_1, day_2, day_3)));
end;
$$;

create or replace function public.set_competition_day_open(
  target_day_id uuid,
  should_open boolean,
  is_reopen boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := private.assert_competition_admin();
  day_row public.competition_days%rowtype;
  season_row public.seasons%rowtype;
  audit_action text;
begin
  select * into day_row from public.competition_days where id = target_day_id for update;
  if not found then raise exception 'Competition day not found'; end if;
  select * into season_row from public.seasons where id = day_row.season_id for update;

  if should_open then
    if season_row.status = 'closed'::public.season_status then
      raise exception 'Reopen the closed season before reopening a day';
    end if;
    if day_row.is_open then raise exception 'Competition day is already open'; end if;
    if is_reopen <> (day_row.opened_at is not null) then
      raise exception 'Opening mode does not match the competition day history';
    end if;
    update public.seasons set status = 'open'::public.season_status, updated_at = now()
      where id = day_row.season_id and status = 'draft'::public.season_status;
    audit_action := case when is_reopen then 'day_reopened' else 'day_opened' end;
  else
    if not day_row.is_open then raise exception 'Competition day is already closed'; end if;
    audit_action := 'day_closed';
  end if;

  update public.competition_days
    set is_open = should_open,
        opened_at = case when should_open then coalesce(opened_at, now()) else opened_at end,
        updated_at = now()
    where id = target_day_id;
  insert into public.competition_lifecycle_audit
    (admin_user_id, action, season_id, competition_day_id, previous_state, new_state)
  values (actor, audit_action, day_row.season_id, target_day_id,
    jsonb_build_object('is_open', day_row.is_open, 'season_status', season_row.status),
    jsonb_build_object('is_open', should_open, 'season_status', case when season_row.status = 'draft' then 'open' else season_row.status::text end));
end;
$$;

create or replace function public.set_competition_season_closed(
  target_season_id uuid,
  should_close boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := private.assert_competition_admin();
  season_row public.seasons%rowtype;
  old_days jsonb;
begin
  select * into season_row from public.seasons where id = target_season_id for update;
  if not found then raise exception 'Season not found'; end if;
  if should_close and season_row.status = 'closed'::public.season_status then raise exception 'Season is already closed'; end if;
  if not should_close and season_row.status <> 'closed'::public.season_status then raise exception 'Only a closed season can be reopened'; end if;
  select jsonb_agg(jsonb_build_object('id', id, 'day_number', day_number, 'is_open', is_open) order by day_number)
    into old_days from public.competition_days where season_id = target_season_id;

  if should_close then
    update public.competition_days set is_open = false, updated_at = now() where season_id = target_season_id;
    update public.seasons set status = 'closed'::public.season_status, updated_at = now() where id = target_season_id;
  else
    -- Reopening a season never silently opens registration days.
    update public.seasons set status = 'open'::public.season_status, updated_at = now() where id = target_season_id;
  end if;

  insert into public.competition_lifecycle_audit
    (admin_user_id, action, season_id, previous_state, new_state)
  values (actor, case when should_close then 'season_closed' else 'season_reopened' end, target_season_id,
    jsonb_build_object('status', season_row.status, 'days', old_days),
    jsonb_build_object('status', case when should_close then 'closed' else 'open' end,
      'all_days_open', false));
end;
$$;

revoke all on function public.create_competition_season(integer, date, date, date) from public, anon;
revoke all on function public.configure_competition_dates(uuid, date, date, date) from public, anon;
revoke all on function public.set_competition_day_open(uuid, boolean, boolean) from public, anon;
revoke all on function public.set_competition_season_closed(uuid, boolean) from public, anon;
grant execute on function public.create_competition_season(integer, date, date, date) to authenticated;
grant execute on function public.configure_competition_dates(uuid, date, date, date) to authenticated;
grant execute on function public.set_competition_day_open(uuid, boolean, boolean) to authenticated;
grant execute on function public.set_competition_season_closed(uuid, boolean) to authenticated;

-- Catch editing is an ordinary competition write even when performed by an
-- administrator. Closed lifecycle entities therefore cannot be bypassed.
drop policy if exists "owners or admins can update catches on open days" on public.catches;
create policy "owners can update own catches on open days"
on public.catches for update to authenticated
using (
  created_by = (select auth.uid()) and exists (
    select 1 from public.competition_days d join public.seasons s on s.id = d.season_id
    where d.id = catches.competition_day_id and d.season_id = catches.season_id
      and d.is_open and s.status = 'open'::public.season_status
  )
)
with check (
  created_by = (select auth.uid()) and exists (
    select 1 from public.competition_days d join public.seasons s on s.id = d.season_id
    where d.id = catches.competition_day_id and d.season_id = catches.season_id
      and d.is_open and s.status = 'open'::public.season_status
  )
);

drop policy if exists "owners or admins can delete catches" on public.catches;
create policy "owners can delete own catches on open days"
on public.catches for delete to authenticated
using (
  created_by = (select auth.uid()) and exists (
    select 1 from public.competition_days d join public.seasons s on s.id = d.season_id
    where d.id = catches.competition_day_id and d.season_id = catches.season_id
      and d.is_open and s.status = 'open'::public.season_status
  )
);
