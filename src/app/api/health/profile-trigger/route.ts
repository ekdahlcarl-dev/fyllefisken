import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({newUserProfileTrigger:true,defaultRole:"member"});}
