"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function setPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < 10) redirect("/auth/set-password?error=weak-password");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=expired-invite");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/auth/set-password?error=update-failed");
  redirect("/");
}
