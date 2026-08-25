import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({anonymous:"none",member:"member data",admin:"admin routes"});}
