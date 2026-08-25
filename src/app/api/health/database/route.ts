import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(){try{const s=await createClient();const {error}=await s.from("profiles").select("id").limit(1);return NextResponse.json({reachable:!error||error.code!=="PGRST301"});}catch{return NextResponse.json({reachable:false},{status:503});}}
