import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { saveDigitalLocation, saveHistoricalWinner } from "./actions";

type SearchParams = Promise<{ error?: string; success?: string }>;

export const metadata = { title: "Redigera vinnararkiv" };

export default async function AdminHistoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const [{ data: teams }, { data: winners }, { data: closedSeasons }] =
    await Promise.all([
      supabase.from("teams").select("id, name").order("id"),
      supabase
        .from("yearly_winners")
        .select("year, team_id, location")
        .order("year", { ascending: false }),
      supabase
        .from("seasons")
        .select("id, year, location")
        .eq("status", "closed"),
    ]);

  const currentYear = new Date().getUTCFullYear();
  const winnerByYear = new Map(
    (winners ?? []).map((item) => [item.year, item]),
  );
  const closedByYear = new Map(
    (closedSeasons ?? [])
      .filter((season) => season.year <= currentYear)
      .map((season) => [season.year, season]),
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
            <p>
              Lägg till eller korrigera historiska vinnare och tävlingsplatser.
            </p>
          </div>
          <div className="history-actions">
            <Link className="button button-light" href="/admin">
              Till admin
            </Link>
            <Link className="button button-light" href="/history">
              Visa arkivet
            </Link>
          </div>
        </header>

        {params.error && (
          <p className="notice notice-error" role="alert">
            {params.error}
          </p>
        )}
        {params.success && (
          <p className="notice notice-success" role="status">
            {params.success}
          </p>
        )}

        <div className="admin-history-list">
          {years.map((year) => {
            const winner = winnerByYear.get(year);
            const closedSeason = closedByYear.get(year);

            if (closedSeason) {
              return (
                <form
                  action={saveDigitalLocation}
                  className="card admin-history-row"
                  key={year}
                >
                  <input name="year" type="hidden" value={year} />
                  <input
                    name="season_id"
                    type="hidden"
                    value={closedSeason.id}
                  />
                  <strong>{year}</strong>
                  <div>
                    <span>Digitalt slutresultat · vinnaren är låst</span>
                    <label>
                      <span className="sr-only">Tävlingsplats {year}</span>
                      <input
                        name="location"
                        type="text"
                        maxLength={120}
                        defaultValue={closedSeason.location ?? ""}
                        placeholder="Tävlingsplats, t.ex. Enköping"
                      />
                    </label>
                  </div>
                  <button className="button button-primary" type="submit">
                    Spara plats
                  </button>
                </form>
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
                <div>
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
                  <label>
                    <span className="sr-only">Tävlingsplats {year}</span>
                    <input
                      name="location"
                      type="text"
                      maxLength={120}
                      defaultValue={winner?.location ?? ""}
                      placeholder="Tävlingsplats, t.ex. Enköping"
                    />
                  </label>
                </div>
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
