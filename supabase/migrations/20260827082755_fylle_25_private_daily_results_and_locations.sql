alter table public.profiles
  add column team_id smallint references public.teams(id);

update public.profiles
set team_id = 2
where role = 'admin'::public.member_role and team_id is null;

alter table public.seasons
  add column location text,
  add constraint seasons_location_length check (location is null or char_length(location) between 1 and 120);

alter table public.yearly_winners
  add column location text,
  add constraint yearly_winners_location_length check (location is null or char_length(location) between 1 and 120);

alter table public.competition_days
  add column results_released_at timestamptz;

alter table public.competition_lifecycle_audit
  drop constraint competition_lifecycle_audit_action_check;
alter table public.competition_lifecycle_audit
  add constraint competition_lifecycle_audit_action_check check (action in (
    'season_created', 'dates_changed', 'day_opened', 'day_closed',
    'day_reopened', 'season_closed', 'season_reopened',
    'day_results_released', 'day_results_unreleased'
  ));

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  assigned_team smallint;
begin
  if new.invited_at is not null then
    assigned_team := case
      when new.raw_app_meta_data ->> 'role' = 'admin' then 2
      when (new.raw_app_meta_data ->> 'team_id') in ('1', '2') then (new.raw_app_meta_data ->> 'team_id')::smallint
      else null
    end;

    insert into public.profiles (id, email, display_name, role, team_id)
    values (
      new.id,
      coalesce(new.email, ''),
      coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1)),
      case when new.raw_app_meta_data ->> 'role' = 'admin' then 'admin'::public.member_role else 'member'::public.member_role end,
      assigned_team
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;

revoke all on function public.create_competition_season(integer, date, date, date) from public, anon, authenticated;
drop function public.create_competition_season(integer, date, date, date);

create function public.create_competition_season(
  competition_year integer,
  competition_location text,
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
  clean_location text := nullif(btrim(competition_location), '');
begin
  if competition_year < 2011 or competition_year > 2100 then
    raise exception 'Competition year is outside the supported range';
  end if;
  if clean_location is not null and char_length(clean_location) > 120 then
    raise exception 'Competition location is too long';
  end if;
  if day_1 is null or day_2 is null or day_3 is null or day_1 = day_2 or day_1 = day_3 or day_2 = day_3 then
    raise exception 'Exactly three distinct competition dates are required';
  end if;
  if extract(year from day_1) <> competition_year or extract(year from day_2) <> competition_year or extract(year from day_3) <> competition_year then
    raise exception 'Competition dates must belong to the competition year';
  end if;

  insert into public.seasons (year, status, location)
  values (competition_year, 'draft'::public.season_status, clean_location)
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
    jsonb_build_object('year', competition_year, 'location', clean_location, 'status', 'draft', 'dates', jsonb_build_array(day_1, day_2, day_3))
  );
  return new_season_id;
end;
$$;
revoke all on function public.create_competition_season(integer, text, date, date, date) from public, anon;
grant execute on function public.create_competition_season(integer, text, date, date, date) to authenticated;

create or replace function public.set_competition_location(target_season_id uuid, competition_location text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := private.assert_competition_admin();
  old_location text;
  clean_location text := nullif(btrim(competition_location), '');
begin
  if clean_location is not null and char_length(clean_location) > 120 then
    raise exception 'Competition location is too long';
  end if;
  select location into old_location from public.seasons where id = target_season_id for update;
  if not found then raise exception 'Season not found'; end if;
  update public.seasons set location = clean_location, updated_at = now() where id = target_season_id;
  insert into public.competition_lifecycle_audit
    (admin_user_id, action, season_id, previous_state, new_state)
  values (actor, 'dates_changed', target_season_id,
    jsonb_build_object('location', old_location),
    jsonb_build_object('location', clean_location));
end;
$$;
revoke all on function public.set_competition_location(uuid, text) from public, anon;
grant execute on function public.set_competition_location(uuid, text) to authenticated;

create or replace function public.set_competition_day_results_released(target_day_id uuid, should_release boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := private.assert_competition_admin();
  day_row public.competition_days%rowtype;
  action_name text;
begin
  select * into day_row from public.competition_days where id = target_day_id for update;
  if not found then raise exception 'Competition day not found'; end if;

  if should_release then
    if day_row.is_open then raise exception 'Close catch registration before releasing results'; end if;
    if day_row.results_released_at is not null then raise exception 'Results are already released'; end if;
    update public.competition_days set results_released_at = now(), updated_at = now() where id = target_day_id;
    action_name := 'day_results_released';
  else
    if day_row.results_released_at is null then raise exception 'Results are already private'; end if;
    update public.competition_days set results_released_at = null, updated_at = now() where id = target_day_id;
    action_name := 'day_results_unreleased';
  end if;

  insert into public.competition_lifecycle_audit
    (admin_user_id, action, season_id, competition_day_id, previous_state, new_state)
  values (
    actor, action_name, day_row.season_id, target_day_id,
    jsonb_build_object('results_released', day_row.results_released_at is not null),
    jsonb_build_object('results_released', should_release)
  );
end;
$$;
revoke all on function public.set_competition_day_results_released(uuid, boolean) from public, anon;
grant execute on function public.set_competition_day_results_released(uuid, boolean) to authenticated;

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
        results_released_at = case when should_open then null else results_released_at end,
        updated_at = now()
    where id = target_day_id;

  insert into public.competition_lifecycle_audit
    (admin_user_id, action, season_id, competition_day_id, previous_state, new_state)
  values (actor, audit_action, day_row.season_id, target_day_id,
    jsonb_build_object('is_open', day_row.is_open, 'results_released', day_row.results_released_at is not null, 'season_status', season_row.status),
    jsonb_build_object('is_open', should_open, 'results_released', case when should_open then false else day_row.results_released_at is not null end, 'season_status', case when season_row.status = 'draft' then 'open' else season_row.status::text end));
end;
$$;
revoke all on function public.set_competition_day_open(uuid, boolean, boolean) from public, anon;
grant execute on function public.set_competition_day_open(uuid, boolean, boolean) to authenticated;

drop policy if exists "members can read catches" on public.catches;
create policy "members read own team or released catches"
on public.catches for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.team_id = catches.team_id
  )
  or exists (
    select 1 from public.competition_days d
    where d.id = catches.competition_day_id and d.results_released_at is not null
  )
);

drop policy if exists "members can enter catches on open days" on public.catches;
create policy "members enter catches for assigned team on open days"
on public.catches for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.team_id = catches.team_id
  )
  and exists (
    select 1 from public.competition_days d
    join public.seasons s on s.id = d.season_id
    where d.id = catches.competition_day_id
      and d.season_id = catches.season_id
      and d.is_open
      and s.status = 'open'::public.season_status
  )
);

drop policy if exists "members can read photos" on public.photos;
create policy "members read visible competition photos"
on public.photos for select to authenticated
using (
  year is not null
  or exists (select 1 from public.catches c where c.id = photos.catch_id)
);

drop policy if exists "members can read private competition photos" on storage.objects;
create policy "members can read visible competition photos"
on storage.objects for select to authenticated
using (
  bucket_id = 'fyllefisken-photos'
  and exists (
    select 1 from public.photos p
    where p.object_path = storage.objects.name
  )
);

create or replace function public.admin_list_profiles()
returns table(id uuid, email text, display_name text, role public.member_role, team_id smallint)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.assert_competition_admin();
  return query
    select p.id, p.email, p.display_name, p.role, p.team_id
    from public.profiles p
    order by p.display_name nulls last, p.email;
end;
$$;
revoke all on function public.admin_list_profiles() from public, anon;
grant execute on function public.admin_list_profiles() to authenticated;

create or replace function public.admin_set_profile_team(target_profile_id uuid, target_team_id smallint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role public.member_role;
begin
  perform private.assert_competition_admin();
  if not exists (select 1 from public.teams where id = target_team_id) then
    raise exception 'Team not found';
  end if;
  select role into target_role from public.profiles where id = target_profile_id for update;
  if not found then raise exception 'Profile not found'; end if;
  if target_role = 'admin'::public.member_role and target_team_id <> 2 then
    raise exception 'Administrators belong to Team Torsk for normal competition visibility';
  end if;
  update public.profiles set team_id = target_team_id, updated_at = now() where id = target_profile_id;
end;
$$;
revoke all on function public.admin_set_profile_team(uuid, smallint) from public, anon;
grant execute on function public.admin_set_profile_team(uuid, smallint) to authenticated;

create or replace function public.admin_list_catches(target_season_id uuid, target_day_id uuid default null)
returns table(
  id uuid,
  competition_day_id uuid,
  day_number smallint,
  team_id smallint,
  team_code text,
  length_cm numeric,
  created_by uuid,
  created_by_name text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.assert_competition_admin();
  return query
    select c.id, c.competition_day_id, d.day_number, c.team_id, t.code, c.length_cm,
      c.created_by, p.display_name, c.created_at, c.updated_at
    from public.catches c
    join public.competition_days d on d.id = c.competition_day_id
    join public.teams t on t.id = c.team_id
    join public.profiles p on p.id = c.created_by
    where c.season_id = target_season_id
      and (target_day_id is null or c.competition_day_id = target_day_id)
    order by d.day_number, c.created_at desc;
end;
$$;
revoke all on function public.admin_list_catches(uuid, uuid) from public, anon;
grant execute on function public.admin_list_catches(uuid, uuid) to authenticated;

create or replace function public.admin_update_catch(target_catch_id uuid, new_length_cm integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.assert_competition_admin();
  if new_length_cm < 10 or new_length_cm > 150 then raise exception 'Invalid catch length'; end if;
  if not exists (
    select 1 from public.catches c
    join public.competition_days d on d.id = c.competition_day_id
    join public.seasons s on s.id = c.season_id
    where c.id = target_catch_id and d.is_open and s.status = 'open'::public.season_status
  ) then raise exception 'Reopen the competition day before correcting catches'; end if;
  update public.catches set length_cm = new_length_cm, updated_at = now() where id = target_catch_id;
end;
$$;
revoke all on function public.admin_update_catch(uuid, integer) from public, anon;
grant execute on function public.admin_update_catch(uuid, integer) to authenticated;

create or replace function public.admin_delete_catch(target_catch_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.assert_competition_admin();
  if not exists (
    select 1 from public.catches c
    join public.competition_days d on d.id = c.competition_day_id
    join public.seasons s on s.id = c.season_id
    where c.id = target_catch_id and d.is_open and s.status = 'open'::public.season_status
  ) then raise exception 'Reopen the competition day before deleting catches'; end if;
  delete from public.catches where id = target_catch_id;
end;
$$;
revoke all on function public.admin_delete_catch(uuid) from public, anon;
grant execute on function public.admin_delete_catch(uuid) to authenticated;
