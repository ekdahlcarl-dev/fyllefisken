import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({publicKeyType:"publishable",serviceRoleCommitted:false});}
