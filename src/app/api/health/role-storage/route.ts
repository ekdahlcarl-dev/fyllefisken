import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({roleStorage:"profiles.role",userMetadataAuthorization:false});}
