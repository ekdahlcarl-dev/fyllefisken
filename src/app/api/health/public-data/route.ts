import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("id");
  if (error) return NextResponse.json({ protected: true });
  return NextResponse.json({ protected: (data?.length ?? 0) === 0 });
}
