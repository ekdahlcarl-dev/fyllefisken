import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({flow:["admin invite","email callback","set password","member login"]});}
