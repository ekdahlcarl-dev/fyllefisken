import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireMember() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .eq("id", userId)
    .single();

  if (!profile) redirect("/login?error=unauthorized");
  return { supabase, profile };
}

export async function requireAdmin() {
  const context = await requireMember();
  if (context.profile.role !== "admin") redirect("/?error=unauthorized");
  return context;
}
