import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import {
  changeDayResultRelease,
  changeDayState,
  changeSeasonState,
  configureDates,
  createSeason,
  updateSeasonLocation,
} from "./actions";

type Params = Promise<{ error?: string; success?: string }>;
type Day = {
  id: string;
  season_id: string;
  day_number: number;
  competition_date: string;
  is_open: boolean;
  opened_at: string | null;
  results_released_at: string | null;
};

const statusLabel = {
  draft: "Utkast",
  open: "Pågående",
  closed: "Avslutad",
} as const;

function Confirmation({ warning }: { warning: string }) {
  return (
    <label className="admin-confirm">
      <input type="checkbox" name="confirmation" value="confirmed" required />{" "}
      <span>{warning}</span>
    </label>
  );
}

export default async function CompetitionAdminPage({
  searchParams,
}: {
  searchParams: Params;
}) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const [{ data: seasons }, { data: days }, { data: audit }] =
    await Promise.all([
      supabase
        .from("seasons")
        .select("id, year, status, location")
        .order("year", { ascending: false }),
      supabase
        .from("competition_days")
        .select(
          "id, season_id, day_number, competition_date, is_open, opened_at, results_released_at",
        )
        .order("day_number"),
      supabase
        .from("competition_lifecycle_audit")
        .select(
          "id, action, season_id, competition_day_id, admin_user_id, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

  return (
    <section className="section">
      <div className="container admin-shell">
        <div className="admin-header">
          <div>
            <p className="eyebrow">Administratör · Tävlingslivscykel</p>
            <h1>Tävlingsår</h1>
            <p>
              Stängning av fångstregistrering och publicering av dagens resultat
              är två separata steg.
            </p>
          </div>
          <div className="results-actions">
            <Link className="button button-light" href="/admin/catches">
              Korrigera fångster
            </Link>
            <Link className="button button-light" href="/admin/members">
              Lagmedlemmar
            </Link>
            <Link className="button button-light" href="/admin">
              Till admin
            </Link>
          </div>
        </div>

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

        <form action={createSeason} className="card admin-create">
          <div>
            <p className="eyebrow">Ny säsong</p>
            <h2>Förbered ett tävlingsår</h2>
            <p className="muted">
              Skapas som utkast med all registrering och alla resultat låsta.
            </p>
          </div>
          <label>
            År
            <input name="year" type="number" min="2011" max="2100" required />
          </label>
          <label>
            Tävlingsplats
            <input
              name="location"
              type="text"
              maxLength={120}
              placeholder="t.ex. Enköping"
            />
          </label>
          {[1, 2, 3].map((number) => (
            <label key={number}>
              Dag {number}
              <input name={`day_${number}`} type="date" required />
            </label>
          ))}
          <button className="button button-primary" type="submit">
            Skapa säsong
          </button>
        </form>

        <div className="admin-season-list">
          {seasons?.map((season) => {
            const seasonDays =
              (days as Day[] | null)?.filter(
                (day) => day.season_id === season.id,
              ) ?? [];
            return (
              <article className="card admin-season" key={season.id}>
                <header className="admin-season-heading">
                  <div>
                    <p className="eyebrow">Tävlingsår</p>
                    <h2>{season.year}</h2>
                    <span className="muted">
                      {season.location || "Plats saknas"}
                    </span>
                  </div>
                  <span className={`status status-${season.status}`}>
                    {statusLabel[season.status as keyof typeof statusLabel]}
                  </span>
                </header>

                <form action={updateSeasonLocation} className="admin-date-form">
                  <input type="hidden" name="season_id" value={season.id} />
                  <label>
                    Tävlingsplats
                    <input
                      name="location"
                      type="text"
                      maxLength={120}
                      defaultValue={season.location ?? ""}
                      placeholder="t.ex. Enköping"
                    />
                  </label>
                  <button className="button button-light" type="submit">
                    Spara plats
                  </button>
                </form>

                {season.status === "draft" && (
                  <form action={configureDates} className="admin-date-form">
                    <input type="hidden" name="season_id" value={season.id} />
                    {seasonDays.map((day) => (
                      <label key={day.id}>
                        Dag {day.day_number}
                        <input
                          name={`day_${day.day_number}`}
                          type="date"
                          defaultValue={day.competition_date}
                          required
                        />
                      </label>
                    ))}
                    <button className="button button-light" type="submit">
                      Spara datum
                    </button>
                  </form>
                )}

                <div className="admin-days">
                  {seasonDays.map((day) => {
                    const released = day.results_released_at !== null;
                    return (
                      <div className="admin-day" key={day.id}>
                        <div>
                          <strong>Dag {day.day_number}</strong>
                          <span>{day.competition_date}</span>
                          <span>
                            Resultat: {released ? "publicerat" : "låst"}
                          </span>
                        </div>
                        <span
                          className={`status ${day.is_open ? "status-open" : "status-closed"}`}
                        >
                          {day.is_open ? "Öppen" : "Stängd"}
                        </span>

                        {season.status !== "closed" && (
                          <form action={changeDayState}>
                            <input type="hidden" name="day_id" value={day.id} />
                            {day.is_open ? (
                              <>
                                <input
                                  type="hidden"
                                  name="operation"
                                  value="close"
                                />
                                <Confirmation warning="Jag bekräftar att registreringen stängs. Resultatet publiceras inte automatiskt." />
                                <button
                                  className="button button-danger"
                                  type="submit"
                                >
                                  Stäng dag
                                </button>
                              </>
                            ) : (
                              <>
                                <input
                                  type="hidden"
                                  name="operation"
                                  value={day.opened_at ? "reopen" : "open"}
                                />
                                {day.opened_at && (
                                  <Confirmation warning="Jag bekräftar att dagen öppnas igen. Ett publicerat resultat låses automatiskt." />
                                )}
                                <button
                                  className="button button-light"
                                  type="submit"
                                >
                                  {day.opened_at ? "Öppna igen" : "Öppna dag"}
                                </button>
                              </>
                            )}
                          </form>
                        )}

                        {!day.is_open && (
                          <form action={changeDayResultRelease}>
                            <input type="hidden" name="day_id" value={day.id} />
                            <input
                              type="hidden"
                              name="operation"
                              value={released ? "unrelease" : "release"}
                            />
                            <Confirmation
                              warning={
                                released
                                  ? "Jag bekräftar att dagens resultat låses igen."
                                  : "Jag bekräftar att dagens resultat blir synligt för båda lagen."
                              }
                            />
                            <button
                              className={
                                released
                                  ? "button button-light"
                                  : "button button-primary"
                              }
                              type="submit"
                            >
                              {released ? "Lås resultat" : "Publicera resultat"}
                            </button>
                          </form>
                        )}
                      </div>
                    );
                  })}
                </div>

                <footer className="admin-season-footer">
                  {season.status === "closed" ? (
                    <form action={changeSeasonState}>
                      <input type="hidden" name="season_id" value={season.id} />
                      <input type="hidden" name="operation" value="reopen" />
                      <p className="notice notice-error">
                        Varning: en avslutad tävling öppnas för ändringar. Alla
                        dagar förblir stängda.
                      </p>
                      <Confirmation warning="Jag bekräftar att den avslutade säsongen öppnas igen." />
                      <button className="button button-danger" type="submit">
                        Öppna säsong igen
                      </button>
                    </form>
                  ) : (
                    <form action={changeSeasonState}>
                      <input type="hidden" name="season_id" value={season.id} />
                      <input type="hidden" name="operation" value="close" />
                      <Confirmation warning="Jag bekräftar att säsongen slutförs och alla dagar stängs. Resultaten publiceras separat." />
                      <button className="button button-danger" type="submit">
                        Slutför säsong
                      </button>
                    </form>
                  )}
                </footer>
              </article>
            );
          })}
        </div>

        <section className="card admin-audit">
          <p className="eyebrow">Revisionslogg</p>
          <h2>Senaste livscykeländringar</h2>
          {audit?.map((entry) => (
            <div key={entry.id}>
              <strong>{entry.action}</strong>
              <span>
                {new Date(entry.created_at).toLocaleString("sv-SE")} · admin{" "}
                {entry.admin_user_id.slice(0, 8)}
              </span>
            </div>
          ))}
          {!audit?.length && (
            <p className="muted">Inga ändringar registrerade ännu.</p>
          )}
        </section>
      </div>
    </section>
  );
}
