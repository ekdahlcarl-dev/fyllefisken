import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({wp:"FYLLE-15",features:["invite-only auth","member/admin roles","server route protection","RLS","secure sign-out","friendly auth errors"]});}
