import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ publicSignupUi: false, inviteOnly: true });
}
