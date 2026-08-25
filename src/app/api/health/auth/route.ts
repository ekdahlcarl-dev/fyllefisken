import { NextResponse } from "next/server";

export async function GET() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  return NextResponse.json({ supabase: configured ? "configured" : "missing" }, { status: configured ? 200 : 503 });
}
