import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({home:"member",admin:"admin"});}
