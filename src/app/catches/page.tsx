import { randomUUID } from "node:crypto";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { CatchPhotos } from "@/components/catch-photos";
import { addCatch, deleteCatch, updateCatch } from "./actions";

type SearchParams = Promise<{ season?: string; day?: string; team?: string; error?: string; success?: string }>;

export default async function CatchesPage({ searchParams }: { searchParams: SearchParams }) {
  const { supabase, profile } = await requireMember();
  const params = await searchParams;

  const [{ data: seasons }, { data: teams }] = await Promise.all([
    supabase.from("seasons").select("id, year, status").order("year", { ascending: false }),
    supabase.from("teams").select("id, code, name").order("id"),
  ]);

  const selectedSeason = params.season ?? seasons?.[0]?.id ?? "";
  const { data: days } = selectedSeason
    ? await supabase.from("competition_days").select("id, season_id, day_number, competition_date, is_open").eq("season_id", selectedSeason).order("day_number")
    : { data: [] };
  const selectedDay = params.day && days?.some((d) => d.id === params.day) ? params.day : days?.[0]?.id ?? "";
  const selectedTeam = params.team ?? String(teams?.[0]?.id ?? "");
  const activeSeason = seasons?.find((s) => s.id === selectedSeason);
  const activeDay = days?.find((d) => d.id === selectedDay);
  const canEnter = activeSeason?.status === "open" && activeDay?.is_open === true;

  const { data: catches } = selectedSeason && selectedDay && selectedTeam
    ? await supabase.from("catches").select("id, length_cm, created_by, created_at").eq("season_id", selectedSeason).eq("competition_day_id", selectedDay).eq("team_id", Number(selectedTeam)).order("created_at", { ascending: false })
    : { data: [] };

  const catchIds = (catches ?? []).map((fish) => fish.id);
  const { data: photoRows } = catchIds.length
    ? await supabase.from("photos").select("id, catch_id, object_path, created_by").in("catch_id", catchIds).order("created_at")
    : { data: [] };
  const signedPhotos = await Promise.all((photoRows ?? []).map(async (photo) => {
    const { data } = await supabase.storage.from("fyllefisken-photos").createSignedUrl(photo.object_path, 3600);
    return { ...photo, url: data?.signedUrl ?? null };
  }));

  const hiddenSelection = <><input type="hidden" name="season" value={selectedSeason} /><input type="hidden" name="day" value={selectedDay} /><input type="hidden" name="team" value={selectedTeam} /></>;

  return (
    <section className="section"><div className="container catch-shell">
      <div className="catch-header"><div><p className="eyebrow">Fångstregistrering</p><h1>Registrera gädda</h1><p>Snabb inmatning för mobilen. Inloggad som {profile.display_name ?? "medlem"}.</p></div><div className="results-actions"><Link className="button button-light" href="/memories">Minnen</Link><Link className="button button-light" href="/">Till startsidan</Link></div></div>
      {params.error && <p className="notice notice-error" role="alert">{params.error}</p>}{params.success && <p className="notice notice-success" role="status">{params.success}</p>}
      <form method="get" className="catch-filters card">
        <label>År<select name="season" defaultValue={selectedSeason}>{seasons?.map((s) => <option key={s.id} value={s.id}>{s.year}</option>)}</select></label>
        <label>Dag<select name="day" defaultValue={selectedDay}>{days?.map((d) => <option key={d.id} value={d.id}>Dag {d.day_number} · {d.competition_date}{d.is_open ? " · öppen" : " · stängd"}</option>)}</select></label>
        <label>Lag<select name="team" defaultValue={selectedTeam}>{teams?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <button className="button button-primary" type="submit">Visa</button>
      </form>
      {!seasons?.length ? <div className="card"><h2>Ingen säsong ännu</h2><p>En administratör behöver skapa en säsong innan fångster kan registreras.</p></div> : <>
        <div className="catch-entry card"><div><p className="eyebrow">Ny fångst</p><h2>{canEnter ? "Längd i hela centimeter" : "Tävlingsdagen är stängd"}</h2></div>
          <form action={addCatch} className="catch-add-form">{hiddenSelection}<input type="hidden" name="submission_key" value={randomUUID()} /><label className="sr-only" htmlFor="length_cm">Längd i hela centimeter</label><input id="length_cm" name="length_cm" type="number" inputMode="numeric" min="10" max="150" step="1" placeholder="t.ex. 87" required disabled={!canEnter} /><button className="button button-primary catch-submit" type="submit" disabled={!canEnter}>Registrera</button></form>
          <p className="muted">Foto är frivilligt och läggs till efter att fångsten registrerats, så en misslyckad bilduppladdning påverkar aldrig fångsten.</p>
          {!canEnter && <p className="muted">Fångster kan registreras när både säsongen och vald tävlingsdag är öppna.</p>}
        </div>
        <div className="catch-list-section"><div className="catch-list-title"><div><p className="eyebrow">Dagens fångster</p><h2>{catches?.length ?? 0} registrerade</h2></div></div><div className="catch-list">
          {catches?.map((fish, index) => { const editable = (fish.created_by === profile.id || profile.role === "admin") && canEnter; const photos = signedPhotos.filter((photo) => photo.catch_id === fish.id).map((photo) => ({ id: photo.id, objectPath: photo.object_path, url: photo.url })); return <article className="catch-row card" key={fish.id}><div className="catch-rank">#{catches.length - index}</div><div className="catch-length"><strong>{Number(fish.length_cm).toFixed(0)} cm</strong><span>{new Date(fish.created_at).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}</span><CatchPhotos catchId={fish.id} userId={profile.id} canManage={editable} photos={photos}/></div>{editable && <div className="catch-actions"><form action={updateCatch}>{hiddenSelection}<input type="hidden" name="catch_id" value={fish.id} /><input className="catch-edit-input" name="length_cm" type="number" min="10" max="150" step="1" defaultValue={Number(fish.length_cm)} aria-label="Ny längd i hela centimeter" /><button className="button button-light" type="submit">Ändra</button></form><form action={deleteCatch}>{hiddenSelection}<input type="hidden" name="catch_id" value={fish.id} /><button className="button button-danger" type="submit">Ta bort</button></form></div>}</article>; })}
          {!catches?.length && <div className="card empty-state">Inga fångster registrerade för det här laget och dagen ännu.</div>}
        </div></div>
      </>}
    </div></section>
  );
}
