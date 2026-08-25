import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({verification:"verifyOtp token_hash"});}
