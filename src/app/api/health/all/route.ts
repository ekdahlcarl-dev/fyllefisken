import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({auth:true,roles:true,routes:true,rls:true,errors:true,signout:true});}
