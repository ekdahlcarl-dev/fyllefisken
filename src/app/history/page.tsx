import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { getSeasonCompetitionScore } from "@/lib/scoring-server";

export const metadata = { title: "Vinnararkiv" };

export default async function HistoryPage() {
  const { supabase, profile } = await requireMember();
  const currentYear = new Date().getUTCFullYear();
  const [{ data: winners }, { data: teams }, { data: closedSeasons }] =
    await Promise.all([
      supabase
        .from("yearly_winners")
        .select("year, team_id, location")
        .lte("year", currentYear)
        .order("year", { ascending: false }),
      supabase.from("teams").select("id, code, name"),
      supabase
        .from("seasons")
        .select("id, year, location")
        .eq("status", "closed")
        .lte("year", currentYear)
        .order("year", { ascending: false }),
    ]);

  const digitalResults = await Promise.all(
    (closedSeasons ?? []).map(async (season) => ({
      season,
      score: await getSeasonCompetitionScore(season.id),
    })),
  );

  const archiveEnd = Math.max(
    2011,
    currentYear,
    ...(winners ?? []).map((item) => item.year),
    ...(closedSeasons ?? []).map((item) => item.year),
  );
  const winnerByYear = new Map(
    (winners ?? []).map((item) => [item.year, item]),
  );
  const teamById = new Map((teams ?? []).map((item) => [item.id, item]));
  const teamByCode = new Map((teams ?? []).map((item) => [item.code, item]));
  const digitalByYear = new Map(
    digitalResults.map(({ season, score }) => [
      season.year,
      { winner: score.winner, location: season.location },
    ]),
  );
  const years = Array.from(
    { length: archiveEnd - 2011 + 1 },
    (_, index) => archiveEnd - index,
  ).filter((year) => year <= currentYear);

  return (
    <section className="section history-page">
      <div className="container history-shell">
        <header className="history-header">
          <div>
            <p className="eyebrow">Sedan 2011</p>
            <h1>Vinnararkiv</h1>
            <p>
              En vinnare per tävlingsår, nyaste året först. Framtida
              test-/tävlingsår visas inte här.
            </p>
          </div>
          <div className="history-actions">
            {profile.role === "admin" && (
              <Link className="button button-primary" href="/admin/history">
                Redigera arkivet
              </Link>
            )}
            <Link className="button button-light" href="/">
              Startsidan
            </Link>
          </div>
        </header>

        <div className="history-list">
          {years.map((year) => {
            const digitalResult = digitalByYear.get(year);
            const digitalWinner = digitalResult?.winner;
            const digitalTeam =
              digitalWinner === "MAJO" || digitalWinner === "TORSK"
                ? teamByCode.get(digitalWinner)
                : undefined;
            const historical = winnerByYear.get(year);
            const historicalTeam = historical?.team_id
              ? teamById.get(historical.team_id)
              : undefined;
            const team = digitalTeam ?? historicalTeam;
            const digital = digitalByYear.has(year);
            const trueTie = digital && digitalWinner === "TIE";
            const location = digital
              ? digitalResult?.location
              : historical?.location;

            return (
              <article
                className={`card history-row ${team || trueTie ? "" : "history-row-missing"}`}
                key={year}
              >
                <strong className="history-year">{year}</strong>
                <div className="history-winner">
                  <span className="history-team">
                    {team ? team.name : trueTie ? "Oavgjort" : "Vinnare saknas"}
                  </span>
                  <br />
                  <span className="history-kind">{location || "saknas"}</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
