import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({member:"read competition data",admin:"member + administration"});}
