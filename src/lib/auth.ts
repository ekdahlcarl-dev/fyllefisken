import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, role, team_id")
    .eq("id", userId)
    .single();

  if (!profile) redirect("/unauthorized");
  return { supabase, profile };
}

export async function requireAdmin() {
  const context = await requireMember();
  if (context.profile.role !== "admin") redirect("/unauthorized");
  return context;
}
