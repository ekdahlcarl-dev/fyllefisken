import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({rls:"enabled",roleSource:"profiles.role"});}
