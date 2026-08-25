import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.json({ protected: false }, { status: 503 });
  const anonymous = createServerClient(url, key, { cookies: { getAll: () => [], setAll: () => undefined } });
  const { data, error } = await anonymous.from("profiles").select("id");
  return NextResponse.json({ protected: Boolean(error) || (data?.length ?? 0) === 0 });
}
