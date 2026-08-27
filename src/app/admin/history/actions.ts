"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

function messageUrl(kind: "error" | "success", message: string) {
  return `/admin/history?${kind}=${encodeURIComponent(message)}`;
}

function locationValue(formData: FormData) {
  const entry = formData.get("location");
  return typeof entry === "string" ? entry.trim() : "";
}

export async function saveHistoricalWinner(formData: FormData) {
  const { supabase } = await requireAdmin();
  const year = Number(formData.get("year"));
  const teamId = Number(formData.get("team_id"));
  const location = locationValue(formData);
  const currentYear = new Date().getUTCFullYear();

  if (!Number.isInteger(year) || year < 2011 || year > currentYear) {
    redirect(
      messageUrl("error", `Året måste vara mellan 2011 och ${currentYear}.`),
    );
  }
  if (!Number.isInteger(teamId)) {
    redirect(messageUrl("error", "Välj ett giltigt lag."));
  }
  if (location.length > 120) {
    redirect(messageUrl("error", "Tävlingsplatsen får vara högst 120 tecken."));
  }

  const [{ data: team }, { data: closedSeason }] = await Promise.all([
    supabase.from("teams").select("id").eq("id", teamId).maybeSingle(),
    supabase
      .from("seasons")
      .select("id")
      .eq("year", year)
      .eq("status", "closed")
      .maybeSingle(),
  ]);

  if (!team) {
    redirect(messageUrl("error", "Det valda laget finns inte."));
  }
  if (closedSeason) {
    redirect(
      messageUrl(
        "error",
        "Digitala slutresultat kan inte ändras i historikverktyget.",
      ),
    );
  }

  const { error } = await supabase.from("yearly_winners").upsert(
    {
      year,
      team_id: teamId,
      season_id: null,
      location: location || null,
    },
    { onConflict: "year" },
  );

  if (error) {
    redirect(messageUrl("error", "Historiken kunde inte sparas. Försök igen."));
  }

  revalidatePath("/history");
  revalidatePath("/admin/history");
  redirect(messageUrl("success", `Historiken för ${year} är sparad.`));
}

export async function saveDigitalLocation(formData: FormData) {
  const { supabase } = await requireAdmin();
  const seasonId = String(formData.get("season_id") ?? "");
  const year = Number(formData.get("year"));
  const location = locationValue(formData);
  if (!seasonId || location.length > 120) {
    redirect(messageUrl("error", "Tävlingsplatsen kunde inte sparas."));
  }

  const { error } = await supabase.rpc("set_competition_location", {
    target_season_id: seasonId,
    competition_location: location,
  });
  if (error) {
    redirect(messageUrl("error", "Tävlingsplatsen kunde inte sparas."));
  }

  revalidatePath("/history");
  revalidatePath("/admin/history");
  revalidatePath("/results");
  redirect(messageUrl("success", `Tävlingsplatsen för ${year} är sparad.`));
}
