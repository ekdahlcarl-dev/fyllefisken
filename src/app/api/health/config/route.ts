import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({supabaseUrl:Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),publishableKey:Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)});}
