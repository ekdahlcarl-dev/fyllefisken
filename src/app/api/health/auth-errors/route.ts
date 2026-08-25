import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({loginFailure:"friendly",expiredInvite:"friendly",unauthorized:"friendly"});}
