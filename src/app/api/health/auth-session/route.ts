import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({refresh:"proxy",validation:"getClaims"});}
