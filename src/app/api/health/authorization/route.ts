import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({identity:"Supabase Auth",authorization:"profiles + RLS"});}
