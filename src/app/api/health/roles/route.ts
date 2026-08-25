import { NextResponse } from "next/server";
import { MEMBER_ROLES } from "@/lib/roles";

export async function GET() { return NextResponse.json({ roles: MEMBER_ROLES }); }
