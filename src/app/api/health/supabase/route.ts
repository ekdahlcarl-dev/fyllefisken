import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    if (error && error.code !== "PGRST116") return NextResponse.json({ supabase: "unavailable" }, { status: 503 });
    return NextResponse.json({ supabase: "ok" });
  } catch {
    return NextResponse.json({ supabase: "unavailable" }, { status: 503 });
  }
}
