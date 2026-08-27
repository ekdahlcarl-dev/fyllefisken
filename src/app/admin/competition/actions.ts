"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}

function finish(message: string, error = false) {
  revalidatePath("/admin/competition");
  revalidatePath("/catches");
  revalidatePath("/results");
  revalidatePath("/history");
  redirect(
    `/admin/competition?${error ? "error" : "success"}=${encodeURIComponent(message)}`,
  );
}

function confirmed(formData: FormData) {
  if (value(formData, "confirmation") !== "confirmed") {
    finish("Du måste bekräfta åtgärden.", true);
  }
}

export async function createSeason(formData: FormData) {
  const { supabase } = await requireAdmin();
  const year = Number(value(formData, "year"));
  const location = value(formData, "location").trim();
  const dates = [
    value(formData, "day_1"),
    value(formData, "day_2"),
    value(formData, "day_3"),
  ];
  if (!Number.isInteger(year) || dates.some((date) => !date))
    finish("Ange år och datum för alla tre dagar.", true);
  if (location.length > 120)
    finish("Tävlingsplatsen får vara högst 120 tecken.", true);

  const { error } = await supabase.rpc("create_competition_season", {
    competition_year: year,
    competition_location: location,
    day_1: dates[0],
    day_2: dates[1],
    day_3: dates[2],
  });
  if (error)
    finish(
      "Säsongen kunde inte skapas. Kontrollera år, plats och att datumen är unika.",
      true,
    );
  finish(`Säsongen ${year} skapades som utkast.`);
}

export async function updateSeasonLocation(formData: FormData) {
  const { supabase } = await requireAdmin();
  const location = value(formData, "location").trim();
  if (location.length > 120)
    finish("Tävlingsplatsen får vara högst 120 tecken.", true);
  const { error } = await supabase.rpc("set_competition_location", {
    target_season_id: value(formData, "season_id"),
    competition_location: location,
  });
  if (error) finish("Tävlingsplatsen kunde inte sparas.", true);
  finish("Tävlingsplatsen uppdaterades.");
}

export async function configureDates(formData: FormData) {
  const { supabase } = await requireAdmin();
  const seasonId = value(formData, "season_id");
  const dates = [
    value(formData, "day_1"),
    value(formData, "day_2"),
    value(formData, "day_3"),
  ];
  const { error } = await supabase.rpc("configure_competition_dates", {
    target_season_id: seasonId,
    day_1: dates[0],
    day_2: dates[1],
    day_3: dates[2],
  });
  if (error)
    finish(
      "Datumen kunde inte sparas. Bara utkast kan ändras och alla datum måste vara unika.",
      true,
    );
  finish("Tävlingsdatumen uppdaterades.");
}

export async function changeDayState(formData: FormData) {
  const { supabase } = await requireAdmin();
  const action = value(formData, "operation");
  const opening = action === "open" || action === "reopen";
  if (action === "close" || action === "reopen") confirmed(formData);
  const { error } = await supabase.rpc("set_competition_day_open", {
    target_day_id: value(formData, "day_id"),
    should_open: opening,
    is_reopen: action === "reopen",
  });
  if (error)
    finish(
      "Dagstatus kunde inte ändras. Uppdatera sidan och kontrollera säsongens status.",
      true,
    );
  finish(
    opening
      ? action === "reopen"
        ? "Fångstregistreringen öppnades igen och dagens resultat låstes automatiskt."
        : "Fångstregistreringen är öppen för dagen."
      : "Fångstregistreringen är stängd. Resultatet är fortfarande låst tills det publiceras explicit.",
  );
}

export async function changeDayResultRelease(formData: FormData) {
  const { supabase } = await requireAdmin();
  confirmed(formData);
  const release = value(formData, "operation") === "release";
  const { error } = await supabase.rpc("set_competition_day_results_released", {
    target_day_id: value(formData, "day_id"),
    should_release: release,
  });
  if (error)
    finish(
      release
        ? "Resultatet kunde inte publiceras. Kontrollera att registreringen är stängd."
        : "Resultatet kunde inte låsas igen.",
      true,
    );
  finish(
    release
      ? "Dagens resultat är nu synligt för båda lagen."
      : "Dagens resultat är låst igen.",
  );
}

export async function changeSeasonState(formData: FormData) {
  const { supabase } = await requireAdmin();
  confirmed(formData);
  const close = value(formData, "operation") === "close";
  const { error } = await supabase.rpc("set_competition_season_closed", {
    target_season_id: value(formData, "season_id"),
    should_close: close,
  });
  if (error)
    finish(
      "Säsongsstatus kunde inte ändras. Uppdatera sidan och försök igen.",
      true,
    );
  finish(
    close
      ? "Säsongen slutfördes och alla dagar stängdes. Dagresultat publiceras fortfarande separat."
      : "Säsongen öppnades igen. Dagarna är fortsatt stängda tills de öppnas explicit.",
  );
}
