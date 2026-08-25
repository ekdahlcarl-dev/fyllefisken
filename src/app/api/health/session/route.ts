import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() { const supabase = await createClient(); const { data } = await supabase.auth.getClaims(); return NextResponse.json({ session: data?.claims ? "authenticated" : "anonymous" }); }
