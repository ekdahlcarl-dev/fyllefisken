"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export async function assignMemberTeam(formData: FormData) {
  const { supabase } = await requireAdmin();
  const profileId = String(formData.get("profile_id") ?? "");
  const teamId = Number(formData.get("team_id"));
  if (!profileId || !Number.isInteger(teamId)) {
    redirect("/admin/members?error=Ogiltig%20lagtilldelning");
  }

  const { error } = await supabase.rpc("admin_set_profile_team", {
    target_profile_id: profileId,
    target_team_id: teamId,
  });
  if (error) {
    redirect(
      `/admin/members?error=${encodeURIComponent("Laget kunde inte sparas. Administratörer måste tillhöra TORSK.")}`,
    );
  }

  revalidatePath("/admin/members");
  revalidatePath("/catches");
  revalidatePath("/results");
  redirect("/admin/members?success=Lag%20uppdaterat");
}
