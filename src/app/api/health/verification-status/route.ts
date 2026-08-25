import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({database:"done",pipeline:"pending"});}
