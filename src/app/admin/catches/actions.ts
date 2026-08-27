"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

function baseUrl(formData: FormData) {
  const search = new URLSearchParams();
  for (const key of ["season", "day"]) {
    const value = String(formData.get(key) ?? "");
    if (value) search.set(key, value);
  }
  return `/admin/catches?${search.toString()}`;
}

export async function adminUpdateCatch(formData: FormData) {
  const { supabase } = await requireAdmin();
  const catchId = String(formData.get("catch_id") ?? "");
  const length = Number(formData.get("length_cm"));
  if (!catchId || !Number.isInteger(length) || length < 10 || length > 150) {
    redirect(`${baseUrl(formData)}&error=${encodeURIComponent("Ogiltig längd.")}`);
  }
  const { error } = await supabase.rpc("admin_update_catch", {
    target_catch_id: catchId,
    new_length_cm: length,
  });
  if (error) {
    redirect(
      `${baseUrl(formData)}&error=${encodeURIComponent("Fångsten kunde inte ändras. Öppna dagen igen först.")}`,
    );
  }
  revalidatePath("/admin/catches");
  revalidatePath("/results");
  revalidatePath("/catches");
  redirect(`${baseUrl(formData)}&success=${encodeURIComponent("Fångsten uppdaterades.")}`);
}

export async function adminDeleteCatch(formData: FormData) {
  const { supabase } = await requireAdmin();
  const catchId = String(formData.get("catch_id") ?? "");
  if (!catchId) redirect(baseUrl(formData));
  const { error } = await supabase.rpc("admin_delete_catch", {
    target_catch_id: catchId,
  });
  if (error) {
    redirect(
      `${baseUrl(formData)}&error=${encodeURIComponent("Fångsten kunde inte tas bort. Öppna dagen igen först.")}`,
    );
  }
  revalidatePath("/admin/catches");
  revalidatePath("/results");
  revalidatePath("/catches");
  redirect(`${baseUrl(formData)}&success=${encodeURIComponent("Fångsten togs bort.")}`);
}
