export type TeamId = 1 | 2;

export function canViewCatch(
  viewerTeamId: TeamId | null,
  catchTeamId: TeamId,
  resultsReleased: boolean,
) {
  return resultsReleased || viewerTeamId === catchTeamId;
}

export function visibleArchiveYears(currentYear: number, startYear = 2011) {
  if (!Number.isInteger(currentYear) || currentYear < startYear) return [];
  return Array.from(
    { length: currentYear - startYear + 1 },
    (_, index) => currentYear - index,
  );
}

export function releasedDayIds<
  T extends { id: string; results_released_at: string | null },
>(days: T[]) {
  return new Set(
    days
      .filter((day) => day.results_released_at !== null)
      .map((day) => day.id),
  );
}
