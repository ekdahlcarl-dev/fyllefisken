import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({profilesTable:true,rls:true});}
