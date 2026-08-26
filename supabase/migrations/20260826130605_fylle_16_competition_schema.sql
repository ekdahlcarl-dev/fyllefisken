create type public.season_status as enum ('draft', 'open', 'closed');

create table public.teams (
  id smallint primary key,
  code text not null unique,
  name text not null unique,
  constraint teams_fixed_identity check (
    (id = 1 and code = 'MAJO' and name = 'Team MAJO') or
    (id = 2 and code = 'TORSK' and name = 'Team Torsk')
  )
);

insert into public.teams (id, code, name)
values
  (1, 'MAJO', 'Team MAJO'),
  (2, 'TORSK', 'Team Torsk');

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  year integer not null unique check (year >= 2011 and year <= 2100),
  status public.season_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.competition_days (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  day_number smallint not null check (day_number between 1 and 3),
  competition_date date not null,
  is_open boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, day_number),
  unique (season_id, competition_date),
  unique (id, season_id)
);

create table public.catches (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  competition_day_id uuid not null,
  team_id smallint not null references public.teams(id),
  length_cm numeric(4,1) not null check (length_cm between 10.0 and 150.0),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catches_day_belongs_to_season
    foreign key (competition_day_id, season_id)
    references public.competition_days(id, season_id)
    on delete cascade
);

create table public.yearly_winners (
  year integer primary key check (year >= 2011 and year <= 2100),
  team_id smallint references public.teams(id),
  season_id uuid unique references public.seasons(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index competition_days_season_idx on public.competition_days(season_id, day_number);
create index catches_season_day_idx on public.catches(season_id, competition_day_id);
create index catches_team_idx on public.catches(team_id);
create index catches_creator_idx on public.catches(created_by);
create index catches_length_idx on public.catches(season_id, length_cm desc);
create index yearly_winners_team_idx on public.yearly_winners(team_id);

alter table public.teams enable row level security;
alter table public.seasons enable row level security;
alter table public.competition_days enable row level security;
alter table public.catches enable row level security;
alter table public.yearly_winners enable row level security;

revoke all on table public.teams, public.seasons, public.competition_days, public.catches, public.yearly_winners from anon, authenticated;
grant select on table public.teams, public.seasons, public.competition_days, public.catches, public.yearly_winners to authenticated;
grant insert, update, delete on table public.catches to authenticated;
grant insert, update, delete on table public.seasons, public.competition_days, public.yearly_winners to authenticated;

create policy "members can read teams"
on public.teams for select to authenticated
using ((select auth.uid()) is not null);

create policy "members can read seasons"
on public.seasons for select to authenticated
using ((select auth.uid()) is not null);

create policy "admins can insert seasons"
on public.seasons for insert to authenticated
with check (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
));

create policy "admins can update seasons"
on public.seasons for update to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
));

create policy "admins can delete seasons"
on public.seasons for delete to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
));

create policy "members can read competition days"
on public.competition_days for select to authenticated
using ((select auth.uid()) is not null);

create policy "admins can insert competition days"
on public.competition_days for insert to authenticated
with check (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
));

create policy "admins can update competition days"
on public.competition_days for update to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
));

create policy "admins can delete competition days"
on public.competition_days for delete to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
));

create policy "members can read catches"
on public.catches for select to authenticated
using ((select auth.uid()) is not null);

create policy "members can enter catches on open days"
on public.catches for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.competition_days d
    join public.seasons s on s.id = d.season_id
    where d.id = competition_day_id
      and d.season_id = season_id
      and d.is_open
      and s.status = 'open'
  )
);

create policy "owners or admins can update catches on open days"
on public.catches for update to authenticated
using (
  created_by = (select auth.uid())
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
)
with check (
  (
    created_by = (select auth.uid())
    and exists (
      select 1
      from public.competition_days d
      join public.seasons s on s.id = d.season_id
      where d.id = competition_day_id
        and d.season_id = season_id
        and d.is_open
        and s.status = 'open'
    )
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

create policy "owners or admins can delete catches"
on public.catches for delete to authenticated
using (
  (
    created_by = (select auth.uid())
    and exists (
      select 1
      from public.competition_days d
      join public.seasons s on s.id = d.season_id
      where d.id = competition_day_id
        and d.season_id = season_id
        and d.is_open
        and s.status = 'open'
    )
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

create policy "members can read yearly winners"
on public.yearly_winners for select to authenticated
using ((select auth.uid()) is not null);

create policy "admins can insert yearly winners"
on public.yearly_winners for insert to authenticated
with check (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
));

create policy "admins can update yearly winners"
on public.yearly_winners for update to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
));

create policy "admins can delete yearly winners"
on public.yearly_winners for delete to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
));

create view public.catch_totals
with (security_invoker = true)
as
select
  c.season_id,
  c.competition_day_id,
  c.team_id,
  count(*)::integer as catch_count,
  sum(c.length_cm)::numeric(10,1) as total_length_cm,
  max(c.length_cm)::numeric(4,1) as longest_pike_cm
from public.catches c
group by c.season_id, c.competition_day_id, c.team_id;

revoke all on table public.catch_totals from anon, authenticated;
grant select on table public.catch_totals to authenticated;
