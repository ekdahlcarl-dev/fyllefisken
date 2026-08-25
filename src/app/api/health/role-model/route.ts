import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({roles:{member:"standard",admin:"privileged"}});}
