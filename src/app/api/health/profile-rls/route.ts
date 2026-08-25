import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({table:"profiles",rls:true,anonymousAccess:false});}
