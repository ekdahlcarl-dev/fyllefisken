import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { saveHistoricalWinner } from "./actions";
type SearchParams = Promise<{ error?: string; success?: string }>;
export const metadata = { title: "Redigera vinnararkiv" };

export default async function AdminHistoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const [{ data: teams }, { data: winners }] = await Promise.all([
    supabase.from("teams").select("id, name").order("id"),
    supabase
      .from("yearly_winners")
      .select("year, team_id, season_id")
      .order("year", { ascending: false }),
  ]);
  const currentYear = new Date().getUTCFullYear();
  const winnerByYear = new Map(
    (winners ?? []).map((item) => [item.year, item]),
  );
  const years = Array.from(
    { length: currentYear - 2011 + 1 },
    (_, index) => currentYear - index,
  );
  return (
    <section className="section history-page">
      <div className="container history-shell">
        <header className="history-header">
          <div>
            <p className="eyebrow">Administratör</p>
            <h1>Redigera vinnararkiv</h1>
            <p>Lägg till eller korrigera historiska vinnaruppgifter.</p>
          </div>
          <Link className="button button-light" href="/history">
            Visa arkivet
          </Link>
        </header>
        {params.error && <p className="notice notice-error">{params.error}</p>}
        {params.success && (
          <p className="notice notice-success">{params.success}</p>
        )}
        <div className="admin-history-list">
          {years.map((year) => {
            const winner = winnerByYear.get(year);
            if (winner?.season_id) {
              const team = teams?.find((item) => item.id === winner.team_id);
              return (
                <div className="card admin-history-row" key={year}>
                  <strong>{year}</strong>
                  <span>{team?.name ?? "Okänt lag"}</span>
                  <span className="history-badge is-digital">
                    Digitalt resultat · låst
                  </span>
                </div>
              );
            }
            return (
              <form
                action={saveHistoricalWinner}
                className="card admin-history-row"
                key={year}
              >
                <input name="year" type="hidden" value={year} />
                <strong>{year}</strong>
                <label>
                  <span className="sr-only">Vinnande lag {year}</span>
                  <select
                    name="team_id"
                    defaultValue={winner?.team_id ?? ""}
                    required
                  >
                    <option disabled value="">
                      Välj vinnare
                    </option>
                    {teams?.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="button button-primary" type="submit">
                  Spara
                </button>
              </form>
            );
          })}
        </div>
      </div>
    </section>
  );
}
