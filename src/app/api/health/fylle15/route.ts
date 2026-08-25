import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({anonymousCompetitionData:false,inviteOnly:true,roles:["member","admin"],serverAuthorization:true,databaseRls:true});}
