import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({sessionTransport:"http cookies via @supabase/ssr"});}
