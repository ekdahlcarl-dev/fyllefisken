import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({callback:"token_hash verifyOtp"});}
