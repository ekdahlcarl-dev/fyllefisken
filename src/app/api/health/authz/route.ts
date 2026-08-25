import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({serverSide:true,databaseRls:true,roles:["member","admin"]});}
