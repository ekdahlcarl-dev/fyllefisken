import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ serviceRoleExposed: Boolean(process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) });
}
