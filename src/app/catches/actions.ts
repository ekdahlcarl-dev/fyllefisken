"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";

function asString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function selectionUrl(formData: FormData, params: Record<string, string>) {
  const search = new URLSearchParams();
  for (const key of ["season", "day"]) {
    const value = asString(formData.get(key));
    if (value) search.set(key, value);
  }
  for (const [key, value] of Object.entries(params)) search.set(key, value);
  return `/catches?${search.toString()}`;
}

function validLength(length: number) {
  return Number.isInteger(length) && length >= 10 && length <= 150;
}

export async function addCatch(formData: FormData) {
  const { supabase, profile } = await requireMember();
  const seasonId = asString(formData.get("season"));
  const dayId = asString(formData.get("day"));
  const submissionKey = asString(formData.get("submission_key"));
  const length = Number(asString(formData.get("length_cm")));

  if (!profile.team_id) {
    redirect(selectionUrl(formData, { error: "Du måste tilldelas ett lag av administratören innan du kan registrera fångster." }));
  }

  if (!seasonId || !dayId || !submissionKey || !validLength(length)) {
    redirect(selectionUrl(formData, { error: "Ange längden i hela centimeter (10–150 cm)." }));
  }

  const { error } = await supabase.from("catches").insert({
    season_id: seasonId,
    competition_day_id: dayId,
    team_id: profile.team_id,
    length_cm: length,
    created_by: profile.id,
    submission_key: submissionKey,
  });

  if (error && error.code !== "23505") {
    redirect(selectionUrl(formData, { error: "Fångsten kunde inte sparas. Kontrollera lag och att tävlingsdagen är öppen." }));
  }

  revalidatePath("/catches");
  revalidatePath("/results");
  redirect(selectionUrl(formData, { success: error?.code === "23505" ? "Fångsten var redan registrerad." : "Fångsten är registrerad." }));
}

export async function updateCatch(formData: FormData) {
  const { supabase } = await requireMember();
  const id = asString(formData.get("catch_id"));
  const length = Number(asString(formData.get("length_cm")));
  if (!id || !validLength(length)) {
    redirect(selectionUrl(formData, { error: "Ange längden i hela centimeter (10–150 cm)." }));
  }

  const { error } = await supabase.from("catches").update({ length_cm: length, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect(selectionUrl(formData, { error: "Du saknar behörighet att ändra fångsten, eller dagen är stängd." }));
  revalidatePath("/catches");
  revalidatePath("/results");
  redirect(selectionUrl(formData, { success: "Fångsten är uppdaterad." }));
}

export async function deleteCatch(formData: FormData) {
  const { supabase } = await requireMember();
  const id = asString(formData.get("catch_id"));
  if (!id) redirect(selectionUrl(formData, { error: "Fångsten kunde inte identifieras." }));
  const { error } = await supabase.from("catches").delete().eq("id", id);
  if (error) redirect(selectionUrl(formData, { error: "Du saknar behörighet att ta bort fångsten, eller dagen är stängd." }));
  revalidatePath("/catches");
  revalidatePath("/results");
  redirect(selectionUrl(formData, { success: "Fångsten är borttagen." }));
}
