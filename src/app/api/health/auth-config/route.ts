import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({selfSignupConfigured:false,inviteCallback:true});}
