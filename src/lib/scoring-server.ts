import { createClient } from "@/lib/supabase/server";
import {
  calculateCompetitionScore,
  type CompetitionDayNumber,
  type CompetitionScore,
  type ScoringCatch,
  type TeamCode,
} from "@/lib/scoring";

export async function getSeasonCompetitionScore(
  seasonId: string,
): Promise<CompetitionScore> {
  const supabase = await createClient();

  const [seasonResult, daysResult, teamsResult, catchesResult] =
    await Promise.all([
      supabase.from("seasons").select("id, status").eq("id", seasonId).single(),
      supabase
        .from("competition_days")
        .select("id, day_number, is_open")
        .eq("season_id", seasonId)
        .order("day_number"),
      supabase.from("teams").select("id, code").order("id"),
      supabase
        .from("catches")
        .select("competition_day_id, team_id, length_cm")
        .eq("season_id", seasonId),
    ]);

  if (seasonResult.error) throw seasonResult.error;
  if (daysResult.error) throw daysResult.error;
  if (teamsResult.error) throw teamsResult.error;
  if (catchesResult.error) throw catchesResult.error;

  const dayById = new Map(
    (daysResult.data ?? []).map((day) => [
      day.id,
      day.day_number as CompetitionDayNumber,
    ]),
  );
  const teamById = new Map(
    (teamsResult.data ?? []).map((team) => [team.id, team.code as TeamCode]),
  );

  const catches: ScoringCatch[] = (catchesResult.data ?? []).map((row) => {
    const dayNumber = dayById.get(row.competition_day_id);
    const team = teamById.get(row.team_id);

    if (!dayNumber) {
      throw new Error(`Unknown competition day: ${row.competition_day_id}`);
    }
    if (team !== "MAJO" && team !== "TORSK") {
      throw new Error(`Unknown competition team: ${String(team)}`);
    }

    return {
      dayNumber,
      team,
      lengthCm: Number(row.length_cm),
    };
  });

  const competitionComplete =
    seasonResult.data.status === "closed" &&
    (daysResult.data ?? []).length === 3 &&
    (daysResult.data ?? []).every((day) => day.is_open === false);

  return calculateCompetitionScore(catches, competitionComplete);
}
