"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

function messageUrl(kind: "error" | "success", message: string) {
  return `/admin/history?${kind}=${encodeURIComponent(message)}`;
}

export async function saveHistoricalWinner(formData: FormData) {
  const { supabase } = await requireAdmin();
  const year = Number(formData.get("year"));
  const teamId = Number(formData.get("team_id"));
  const currentYear = new Date().getUTCFullYear();

  if (!Number.isInteger(year) || year < 2011 || year > currentYear) {
    redirect(
      messageUrl("error", `Året måste vara mellan 2011 och ${currentYear}.`),
    );
  }

  if (!Number.isInteger(teamId)) {
    redirect(messageUrl("error", "Välj ett giltigt lag."));
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

  const { error } = await supabase
    .from("yearly_winners")
    .upsert(
      { year, team_id: teamId, season_id: null },
      { onConflict: "year" },
    );

  if (error) {
    redirect(messageUrl("error", "Vinnaren kunde inte sparas. Försök igen."));
  }

  revalidatePath("/history");
  revalidatePath("/admin/history");
  redirect(messageUrl("success", `Vinnaren för ${year} är sparad.`));
}
