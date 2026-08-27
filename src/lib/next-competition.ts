export type CompetitionDayDate = {
  competition_date: string | null;
};

export function nextCompetitionYear(currentYear: number) {
  return currentYear + 1;
}

export function formatCompetitionDateSpan(days: CompetitionDayDate[]) {
  const dates = days
    .map((day) => day.competition_date)
    .filter((date): date is string => Boolean(date))
    .sort();

  if (dates.length === 0) return null;
  if (dates[0] === dates[dates.length - 1]) return dates[0];
  return `${dates[0]} - ${dates[dates.length - 1]}`;
}
