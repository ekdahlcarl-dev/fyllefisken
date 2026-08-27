import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { calculateMarathonStandings, type MarathonTeam } from "@/lib/marathon";
import {
  formatCompetitionDateSpan,
  nextCompetitionYear,
} from "@/lib/next-competition";
import { getSeasonCompetitionScore } from "@/lib/scoring-server";
import { signOut } from "./login/actions";

export default async function HomePage() {
  const { supabase, profile } = await requireMember();
  const currentYear = new Date().getUTCFullYear();
  const upcomingYear = nextCompetitionYear(currentYear);
  const [
    { data: winners },
    { data: teams },
    { data: closedSeasons },
    { data: upcomingSeason },
  ] = await Promise.all([
    supabase
      .from("yearly_winners")
      .select("year, team_id")
      .lte("year", currentYear),
    supabase.from("teams").select("id, code"),
    supabase
      .from("seasons")
      .select("id, year")
      .eq("status", "closed")
      .lte("year", currentYear),
    supabase
      .from("seasons")
      .select("id, year, location")
      .eq("year", upcomingYear)
      .maybeSingle(),
  ]);

  const { data: upcomingDays } = upcomingSeason
    ? await supabase
        .from("competition_days")
        .select("competition_date")
        .eq("season_id", upcomingSeason.id)
        .order("competition_date", { ascending: true })
    : { data: [] };
  const upcomingDateSpan = formatCompetitionDateSpan(upcomingDays ?? []);

  const teamCodeById = new Map(
    (teams ?? []).map((team) => [team.id, team.code]),
  );
  const historical = (winners ?? []).map((winner) => {
    const code = winner.team_id ? teamCodeById.get(winner.team_id) : null;
    return {
      year: winner.year,
      team:
        code === "MAJO" || code === "TORSK" ? (code as MarathonTeam) : null,
    };
  });
  const digital = await Promise.all(
    (closedSeasons ?? []).map(async (season) => ({
      year: season.year,
      winner: (await getSeasonCompetitionScore(season.id)).winner,
    })),
  );
  const marathon = calculateMarathonStandings(historical, digital);

  return (
    <>
      <section className="hero">
        <div className="container hero-content">
          <p className="eyebrow">FYLLA FROSSERI KNIVAR</p>
          <h1>Välkommen {profile.display_name ?? "fiskare"}</h1>
          <p className="hero-copy">
            Privat samlingsplats för FylleFiskens medlemmar.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/results">
              Live resultat
            </Link>
            <Link className="button button-secondary" href="/catches">
              Registrera fångst
            </Link>
            {profile.role === "admin" && (
              <Link
                className="button button-secondary"
                href="/admin/competition"
              >
                Administrera tävling
              </Link>
            )}
            <form action={signOut}>
              <button className="button button-secondary" type="submit">
                Logga ut
              </button>
            </form>
          </div>
        </div>
      </section>

      <section
        className="section marathon-section"
        aria-labelledby="marathon-heading"
      >
        <div className="container">
          <p className="eyebrow">Sedan 2011</p>
          <h2 id="marathon-heading">Maratontabellen</h2>
          <div className="card marathon-card">
            <div
              className="marathon-score"
              aria-label={`${marathon.left.team} ${marathon.left.wins}, ${marathon.right.team} ${marathon.right.wins}`}
            >
              <div>
                <span>{marathon.left.team}</span>
                <strong>{marathon.left.wins}</strong>
              </div>
              <span className="marathon-divider">–</span>
              <div>
                <span>{marathon.right.team}</span>
                <strong>{marathon.right.wins}</strong>
              </div>
            </div>
            <p className="marathon-message">{marathon.message}</p>
            <Link className="button button-light" href="/history">
              Se vinnararkivet
            </Link>
          </div>
        </div>
      </section>

      <section className="section" id="competitions">
        <div className="container">
          <p className="eyebrow">Kommande bataljer</p>
          <h2>Tävlingar</h2>
          {upcomingSeason ? (
            <div className="card-grid">
              <article className="card">
                <p className="card-date">
                  {upcomingDateSpan ?? "Datum ej fastställt"}
                </p>
                <h3>FylleFisken {upcomingSeason.year}</h3>
                <p>{upcomingSeason.location || "Plats ej fastställd"}</p>
              </article>
            </div>
          ) : (
            <div className="card empty-state">
              Ingen tävling är planerad för {upcomingYear} ännu.
            </div>
          )}
        </div>
      </section>

      <section className="section section-muted" id="results">
        <div className="container">
          <p className="eyebrow">MAJO mot Torsk</p>
          <h2>Live resultat</h2>
          <div className="card">
            <h3>Följ tävlingen fisk för fisk</h3>
            <p>
              Se daglig Big Five, längsta gädda, poängfördelning och
              totalställning efter att administratören har publicerat dagens
              resultat.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/results">
                Öppna resultattavlan
              </Link>
            </div>
          </div>
          {profile.role === "admin" && (
            <p className="eyebrow">Administratörsbehörighet aktiv</p>
          )}
        </div>
      </section>
    </>
  );
}
