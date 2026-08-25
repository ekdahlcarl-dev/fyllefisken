import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({minimumLength:10,activation:"invited session"});}
