import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminDeleteCatch, adminUpdateCatch } from "./actions";

type SearchParams = Promise<{
  season?: string;
  day?: string;
  error?: string;
  success?: string;
}>;

type AdminCatch = {
  id: string;
  competition_day_id: string;
  day_number: number;
  team_id: number;
  team_code: string;
  length_cm: number;
  created_by: string;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
};

export default async function AdminCatchesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, year, status, location")
    .order("year", { ascending: false });
  const selectedSeason = params.season ?? seasons?.[0]?.id ?? "";
  const { data: days } = selectedSeason
    ? await supabase
        .from("competition_days")
        .select(
          "id, day_number, competition_date, is_open, results_released_at",
        )
        .eq("season_id", selectedSeason)
        .order("day_number")
    : { data: [] };
  const selectedDay =
    params.day && days?.some((day) => day.id === params.day)
      ? params.day
      : (days?.[0]?.id ?? "");
  const { data: catches } = selectedSeason
    ? await supabase.rpc("admin_list_catches", {
        target_season_id: selectedSeason,
        target_day_id: selectedDay || null,
      })
    : { data: [] };
  const activeDay = days?.find((day) => day.id === selectedDay);

  return (
    <section className="section">
      <div className="container admin-shell">
        <div className="admin-header">
          <div>
            <p className="eyebrow">Administratör · Underhåll</p>
            <h1>Korrigera fångster</h1>
            <p>
              Den här vyn kan se båda lagen. Vanliga tävlings- och resultatvyer
              följer fortfarande administratörens TORSK-behörighet.
            </p>
          </div>
          <Link className="button button-light" href="/admin/competition">
            Till tävlingsadmin
          </Link>
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

        <form method="get" className="catch-filters card">
          <label>
            Säsong
            <select name="season" defaultValue={selectedSeason}>
              {seasons?.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.year}
                  {season.location ? ` · ${season.location}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            Dag
            <select name="day" defaultValue={selectedDay}>
              {days?.map((day) => (
                <option key={day.id} value={day.id}>
                  Dag {day.day_number} · {day.competition_date}
                </option>
              ))}
            </select>
          </label>
          <button className="button button-primary" type="submit">
            Visa
          </button>
        </form>

        {activeDay && !activeDay.is_open && (
          <p className="notice notice-error">
            Dagen är stängd. Öppna dagen igen i tävlingsadministrationen innan
            du ändrar eller tar bort fångster. Ett publicerat resultat låses då
            automatiskt.
          </p>
        )}

        <div className="catch-list">
          {(catches as AdminCatch[] | null)?.map((fish) => (
            <article className="catch-row card" key={fish.id}>
              <div className="catch-length">
                <strong>
                  {fish.team_code} · {Number(fish.length_cm).toFixed(0)} cm
                </strong>
                <span>
                  Dag {fish.day_number} · {fish.created_by_name || "Medlem"} ·{" "}
                  {new Date(fish.created_at).toLocaleString("sv-SE")}
                </span>
              </div>
              <div className="catch-actions">
                <form action={adminUpdateCatch}>
                  <input type="hidden" name="season" value={selectedSeason} />
                  <input type="hidden" name="day" value={selectedDay} />
                  <input type="hidden" name="catch_id" value={fish.id} />
                  <input
                    className="catch-edit-input"
                    name="length_cm"
                    type="number"
                    min="10"
                    max="150"
                    step="1"
                    defaultValue={Number(fish.length_cm)}
                    aria-label={`Ny längd för ${fish.team_code}`}
                  />
                  <button className="button button-light" type="submit">
                    Ändra
                  </button>
                </form>
                <form action={adminDeleteCatch}>
                  <input type="hidden" name="season" value={selectedSeason} />
                  <input type="hidden" name="day" value={selectedDay} />
                  <input type="hidden" name="catch_id" value={fish.id} />
                  <button className="button button-danger" type="submit">
                    Ta bort
                  </button>
                </form>
              </div>
            </article>
          ))}
          {!catches?.length && (
            <div className="card empty-state">
              Inga fångster registrerade för vald dag.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
