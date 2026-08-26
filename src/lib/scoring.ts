export type TeamCode = "MAJO" | "TORSK";
export type CompetitionDayNumber = 1 | 2 | 3;

export type ScoringCatch = {
  team: TeamCode;
  dayNumber: CompetitionDayNumber;
  lengthCm: number;
};

export type TeamMetrics = {
  catchCount: number;
  longestCm: number | null;
  topFiveLengths: number[];
  bigFiveTotalCm: number;
  totalLengthCm: number;
};

export type CategoryPoints = Record<TeamCode, number>;

export type DailyScore = {
  dayNumber: CompetitionDayNumber;
  teams: Record<TeamCode, TeamMetrics>;
  longestPoints: CategoryPoints;
  bigFivePoints: CategoryPoints;
};

export type CompetitionWinner = TeamCode | "TIE" | null;

export type CompetitionScore = {
  days: DailyScore[];
  overall: {
    teams: Record<TeamCode, TeamMetrics>;
    longestPoints: CategoryPoints;
    bigFivePoints: CategoryPoints;
  };
  points: CategoryPoints;
  winner: CompetitionWinner;
};

const TEAMS: TeamCode[] = ["MAJO", "TORSK"];
const DAYS: CompetitionDayNumber[] = [1, 2, 3];

function roundOne(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function summarize(lengths: number[]): TeamMetrics {
  const sorted = [...lengths].sort((a, b) => b - a);
  const topFiveLengths = sorted.slice(0, 5);
  return {
    catchCount: sorted.length,
    longestCm: sorted[0] ?? null,
    topFiveLengths,
    bigFiveTotalCm: roundOne(topFiveLengths.reduce((total, length) => total + length, 0)),
    totalLengthCm: roundOne(sorted.reduce((total, length) => total + length, 0)),
  };
}

function categoryPoints(a: number, b: number): CategoryPoints {
  if (a === b) return { MAJO: 0.5, TORSK: 0.5 };
  return a > b ? { MAJO: 1, TORSK: 0 } : { MAJO: 0, TORSK: 1 };
}

function longestCategoryPoints(a: number | null, b: number | null): CategoryPoints {
  return categoryPoints(a ?? 0, b ?? 0);
}

function validateCatch(catchRow: ScoringCatch): void {
  if (!TEAMS.includes(catchRow.team)) throw new Error(`Unknown team: ${catchRow.team}`);
  if (!DAYS.includes(catchRow.dayNumber)) throw new Error(`Invalid competition day: ${catchRow.dayNumber}`);
  if (!Number.isFinite(catchRow.lengthCm) || catchRow.lengthCm < 10 || catchRow.lengthCm > 150) throw new Error(`Invalid pike length: ${catchRow.lengthCm}`);
}

export function calculateCompetitionScore(catches: ScoringCatch[], competitionComplete: boolean): CompetitionScore {
  catches.forEach(validateCatch);
  const lengthsFor = (team: TeamCode, dayNumber?: CompetitionDayNumber): number[] => catches.filter((catchRow) => catchRow.team === team && (dayNumber === undefined || catchRow.dayNumber === dayNumber)).map((catchRow) => catchRow.lengthCm);

  const days = DAYS.map((dayNumber): DailyScore => {
    const teams = { MAJO: summarize(lengthsFor("MAJO", dayNumber)), TORSK: summarize(lengthsFor("TORSK", dayNumber)) };
    return {
      dayNumber,
      teams,
      longestPoints: longestCategoryPoints(teams.MAJO.longestCm, teams.TORSK.longestCm),
      bigFivePoints: categoryPoints(teams.MAJO.bigFiveTotalCm, teams.TORSK.bigFiveTotalCm),
    };
  });

  const overallTeams = { MAJO: summarize(lengthsFor("MAJO")), TORSK: summarize(lengthsFor("TORSK")) };
  const overallLongestPoints = longestCategoryPoints(overallTeams.MAJO.longestCm, overallTeams.TORSK.longestCm);
  const overallBigFivePoints = categoryPoints(overallTeams.MAJO.bigFiveTotalCm, overallTeams.TORSK.bigFiveTotalCm);

  const points = TEAMS.reduce<CategoryPoints>((totals, team) => {
    totals[team] = roundOne(days.reduce((sum, day) => sum + day.longestPoints[team] + day.bigFivePoints[team], 0) + overallLongestPoints[team] + overallBigFivePoints[team]);
    return totals;
  }, { MAJO: 0, TORSK: 0 });

  let winner: CompetitionWinner = null;
  if (competitionComplete) {
    if (points.MAJO > points.TORSK) winner = "MAJO";
    else if (points.TORSK > points.MAJO) winner = "TORSK";
    else if ((overallTeams.MAJO.longestCm ?? -1) > (overallTeams.TORSK.longestCm ?? -1)) winner = "MAJO";
    else if ((overallTeams.TORSK.longestCm ?? -1) > (overallTeams.MAJO.longestCm ?? -1)) winner = "TORSK";
    else winner = "TIE";
  }

  return { days, overall: { teams: overallTeams, longestPoints: overallLongestPoints, bigFivePoints: overallBigFivePoints }, points, winner };
}
