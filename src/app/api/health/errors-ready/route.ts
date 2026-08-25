import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({expiredInvite:true,unauthorized:true});}
