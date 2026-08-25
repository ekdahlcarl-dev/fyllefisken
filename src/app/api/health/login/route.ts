import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({publicRoute:"/login",signup:false});}
