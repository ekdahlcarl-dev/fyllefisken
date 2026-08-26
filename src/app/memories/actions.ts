"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export async function updateMemory(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const caption = String(formData.get("caption") ?? "").trim().slice(0, 500) || null;
  const credit = String(formData.get("credit") ?? "").trim().slice(0, 120) || null;
  const sortOrder = Math.max(0, Number(formData.get("sort_order") ?? 0) || 0);
  if (!id) return;
  const { error } = await supabase.from("photos").update({ caption, credit, sort_order: sortOrder, updated_at: new Date().toISOString() }).eq("id", id).not("year", "is", null);
  if (error) throw new Error("Minnesbilden kunde inte uppdateras.");
  revalidatePath("/memories");
}

export async function deleteMemory(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { data: photo } = await supabase.from("photos").select("object_path").eq("id", id).not("year", "is", null).maybeSingle();
  if (!photo) return;
  const { error: storageError } = await supabase.storage.from("fyllefisken-photos").remove([photo.object_path]);
  if (storageError) throw new Error("Bildfilen kunde inte tas bort.");
  const { error } = await supabase.from("photos").delete().eq("id", id);
  if (error) throw new Error("Bildmetadata kunde inte tas bort.");
  revalidatePath("/memories");
}
