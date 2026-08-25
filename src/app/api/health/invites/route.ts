import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({callback:"/auth/confirm",passwordSetup:"/auth/set-password"});}
