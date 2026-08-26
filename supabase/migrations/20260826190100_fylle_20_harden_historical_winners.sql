-- FYLLE-20: historical winner validation. Keep manual history independent from digital season lifecycle.
drop policy "admins can insert yearly winners" on public.yearly_winners;
create policy "admins can insert yearly winners" on public.yearly_winners
for insert to authenticated with check (
  team_id is not null and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

drop policy "admins can update yearly winners" on public.yearly_winners;
create policy "admins can update yearly winners" on public.yearly_winners
for update to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
))
with check (
  team_id is not null and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

create function public.validate_yearly_winner()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.year > extract(year from current_date)::integer then
    raise exception 'A winner cannot be recorded for a future year';
  end if;
  if new.season_id is not null and not exists (
    select 1 from public.seasons s
    where s.id = new.season_id and s.year = new.year and s.status = 'closed'
  ) then
    raise exception 'A digital winner must belong to the closed season for that year';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.validate_yearly_winner() from public, anon, authenticated;
create trigger validate_yearly_winner_before_write
before insert or update on public.yearly_winners
for each row execute function public.validate_yearly_winner();
