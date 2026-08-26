-- Development-only seed data for FYLLE-16.
-- Uses year 2099 deliberately so it cannot be confused with real competition history.

insert into public.seasons (year, status)
values (2099, 'draft')
on conflict (year) do nothing;

with dev_season as (
  select id from public.seasons where year = 2099
)
insert into public.competition_days (season_id, day_number, competition_date, is_open)
select id, 1, date '2099-06-12', false from dev_season
union all
select id, 2, date '2099-06-13', false from dev_season
union all
select id, 3, date '2099-06-14', false from dev_season
on conflict (season_id, day_number) do nothing;

-- Reserve the historical archive years without inventing winners.
-- WP8 will populate the real winning team values through authorized admin input/import.
insert into public.yearly_winners (year, team_id)
select y, null
from generate_series(2011, 2025) as y
on conflict (year) do nothing;
