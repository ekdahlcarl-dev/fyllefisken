import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { getSeasonCompetitionScore } from "@/lib/scoring-server";
import type { CategoryPoints, TeamCode, TeamMetrics } from "@/lib/scoring";

type SearchParams = Promise<{ season?: string }>;
const teams: TeamCode[] = ["MAJO", "TORSK"];

function cm(value: number | null) {
  return value === null ? "–" : `${value.toFixed(0)} cm`;
}

function pointText(points: CategoryPoints, team: TeamCode) {
  const value = points[team];
  if (value === 1) return "+1 poäng";
  if (value === 0.5) return "+0,5 poäng · delad";
  return "0 poäng";
}

function Metric({
  label,
  metrics,
  kind,
}: {
  label: string;
  metrics: Record<TeamCode, TeamMetrics>;
  kind: "longest" | "bigFive";
}) {
  const value = (team: TeamCode) =>
    kind === "longest"
      ? cm(metrics[team].longestCm)
      : cm(metrics[team].bigFiveTotalCm);
  return (
    <div className="result-metric">
      <span>{label}</span>
      {teams.map((team) => (
        <strong key={team}>
          {team}: {value(team)}
        </strong>
      ))}
    </div>
  );
}

function PointRow({ label, points }: { label: string; points: CategoryPoints }) {
  return (
    <div className="point-row">
      <span>{label}</span>
      {teams.map((team) => (
        <strong key={team}>
          {team} {pointText(points, team)}
        </strong>
      ))}
    </div>
  );
}

function BigFive({ metrics }: { metrics: Record<TeamCode, TeamMetrics> }) {
  return (
    <div className="big-five-grid">
      {teams.map((team) => (
        <div key={team}>
          <b>{team} · fem längsta</b>
          <div className="fish-chips">
            {metrics[team].topFiveLengths.map((length, index) => (
              <span key={`${length}-${index}`}>{length.toFixed(0)} cm</span>
            ))}
            {metrics[team].topFiveLengths.length === 0 && <span>Inga ännu</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { supabase } = await requireMember();
  const params = await searchParams;
  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, year, status, location")
    .order("year", { ascending: false });
  const seasonId = params.season ?? seasons?.[0]?.id ?? "";
  const season = seasons?.find((item) => item.id === seasonId);
  const [{ data: days }, score] = seasonId
    ? await Promise.all([
        supabase
          .from("competition_days")
          .select("day_number, results_released_at")
          .eq("season_id", seasonId)
          .order("day_number"),
        getSeasonCompetitionScore(seasonId),
      ])
    : [{ data: [] }, null];
  const releasedDays = new Set(
    (days ?? [])
      .filter((day) => day.results_released_at !== null)
      .map((day) => Number(day.day_number)),
  );

  return (
    <section className="section results-page">
      <div className="container results-shell">
        <header className="results-header">
          <div>
            <p className="eyebrow">Resultat</p>
            <h1>MAJO mot Torsk</h1>
            <p>
              Dagens resultat visas först när administratören har låst upp det.
            </p>
            {season?.location && <p className="muted">Plats: {season.location}</p>}
          </div>
          <div className="results-actions">
            <Link className="button button-light" href="/catches">
              Registrera fångst
            </Link>
            <Link className="button button-light" href="/">
              Startsidan
            </Link>
          </div>
        </header>

        {seasons?.length ? (
          <form method="get" className="season-picker card">
            <label>
              År
              <select name="season" defaultValue={seasonId}>
                {seasons.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.year}
                    {item.location ? ` · ${item.location}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <button className="button button-primary" type="submit">
              Visa resultat
            </button>
          </form>
        ) : null}

        {!score ? (
          <div className="card empty-state">Ingen tävlingssäsong finns ännu.</div>
        ) : (
          <>
            <div className="scoreboard card">
              <div>
                <span>MAJO</span>
                <strong>{score.points.MAJO}</strong>
              </div>
              <div className="scoreboard-vs">
                PUBLICERADE POÄNG
                <br />
                <small>av 8</small>
              </div>
              <div>
                <span>TORSK</span>
                <strong>{score.points.TORSK}</strong>
              </div>
            </div>

            <div className="day-grid">
              {score.days.map((day) => {
                const released = releasedDays.has(day.dayNumber);
                return (
                  <article className="card result-card" key={day.dayNumber}>
                    <p className="eyebrow">Dag {day.dayNumber}</p>
                    <h2>Dag {day.dayNumber}</h2>
                    {!released ? (
                      <div className="empty-state">
                        <strong>Resultatet är låst</strong>
                        <p>
                          Motståndarlagets fångster och alla härledda resultat är
                          dolda tills administratören publicerar dagen.
                        </p>
                      </div>
                    ) : (
                      <>
                        <Metric
                          label="Längsta gädda"
                          metrics={day.teams}
                          kind="longest"
                        />
                        <Metric
                          label="Big Five · summan av fem längsta"
                          metrics={day.teams}
                          kind="bigFive"
                        />
                        <BigFive metrics={day.teams} />
                        <div className="points-box">
                          <PointRow
                            label="Längsta gädda"
                            points={day.longestPoints}
                          />
                          <PointRow label="Big Five" points={day.bigFivePoints} />
                        </div>
                      </>
                    )}
                  </article>
                );
              })}
            </div>

            <article className="card overall-card">
              <p className="eyebrow">Publicerade dagar</p>
              <h2>Totalställning</h2>
              <Metric
                label="Längsta gädda"
                metrics={score.overall.teams}
                kind="longest"
              />
              <Metric
                label="Tre-dagars Big Five · fem längsta totalt"
                metrics={score.overall.teams}
                kind="bigFive"
              />
              <BigFive metrics={score.overall.teams} />
              <div className="points-box">
                <PointRow
                  label="Längsta gädda totalt"
                  points={score.overall.longestPoints}
                />
                <PointRow
                  label="Tre-dagars Big Five"
                  points={score.overall.bigFivePoints}
                />
              </div>
            </article>

            <article className="card winner-card">
              <p className="eyebrow">Avgörande</p>
              {score.winner === null ? (
                <>
                  <h2>Vinnaren visas när tävlingen är avslutad</h2>
                  <p>
                    Säsongen måste vara stängd och resultaten för alla tre dagar
                    måste vara publicerade.
                  </p>
                </>
              ) : score.winner === "TIE" ? (
                <>
                  <h2>Oavgjort</h2>
                  <p>
                    Poängen är lika och lagens längsta gädda är lika lång.
                  </p>
                </>
              ) : (
                <>
                  <h2>{score.winner} vinner!</h2>
                  <p>
                    {score.points.MAJO === score.points.TORSK
                      ? "Poängen var lika. Enligt tävlingsregeln vann laget med den längsta gäddan under hela tävlingen."
                      : `Slutresultat: MAJO ${score.points.MAJO} – ${score.points.TORSK} TORSK.`}
                  </p>
                </>
              )}
            </article>

            {season?.status !== "closed" && (
              <p className="results-live-note">
                Endast dagar som administratören har publicerat ingår i
                resultattavlan.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
