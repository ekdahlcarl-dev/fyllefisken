import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { calculateMarathonStandings, type MarathonTeam } from "@/lib/marathon";
import { getSeasonCompetitionScore } from "@/lib/scoring-server";
import { signOut } from "./login/actions";

const competitions = [
  {
    date: "5 september",
    title: "Höstgäddan 2026",
    place: "Mälaren",
    time: "08:00",
  },
  {
    date: "3 oktober",
    title: "Abborrjakten",
    place: "Stockholms skärgård",
    time: "09:00",
  },
  {
    date: "28 november",
    title: "FylleFisken Final",
    place: "Hemlig plats",
    time: "08:00",
  },
];

export default async function HomePage() {
  const { supabase, profile } = await requireMember();
  const [{ data: winners }, { data: teams }, { data: closedSeasons }] = await Promise.all([
    supabase.from("yearly_winners").select("year, team_id"),
    supabase.from("teams").select("id, code"),
    supabase.from("seasons").select("id, year").eq("status", "closed"),
  ]);

  const teamCodeById = new Map((teams ?? []).map((team) => [team.id, team.code]));
  const historical = (winners ?? []).map((winner) => {
    const code = winner.team_id ? teamCodeById.get(winner.team_id) : null;
    return {
      year: winner.year,
      team: code === "MAJO" || code === "TORSK" ? (code as MarathonTeam) : null,
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
          <p className="eyebrow">Fiske · Vänner · Prestige</p>
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
              <Link className="button button-secondary" href="/admin/competition">
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

      <section className="section marathon-section" aria-labelledby="marathon-heading">
        <div className="container">
          <p className="eyebrow">Sedan 2011</p>
          <h2 id="marathon-heading">Maratontabellen</h2>
          <div className="card marathon-card">
            <div className="marathon-score" aria-label={`MAJO ${marathon.majo}, TORSK ${marathon.torsk}`}>
              <div><span>MAJO</span><strong>{marathon.majo}</strong></div>
              <span className="marathon-divider">–</span>
              <div><span>TORSK</span><strong>{marathon.torsk}</strong></div>
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
          <div className="card-grid">
            {competitions.map((competition) => (
              <article className="card" key={competition.title}>
                <p className="card-date">{competition.date}</p>
                <h3>{competition.title}</h3>
                <p>
                  {competition.place} · {competition.time}
                </p>
              </article>
            ))}
          </div>
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
              totalställning direkt från registrerade fångster.
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
