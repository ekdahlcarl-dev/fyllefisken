import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return NextResponse.json({ admin: false }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", id).single();
  if (profile?.role !== "admin") return NextResponse.json({ admin: false }, { status: 403 });
  return NextResponse.json({ admin: true });
}
