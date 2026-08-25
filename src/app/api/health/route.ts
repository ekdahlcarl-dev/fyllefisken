import { NextResponse } from "next/server";
import { getRuntimeEnvironment } from "@/lib/env";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "fyllefisken",
    environment: getRuntimeEnvironment(),
    timestamp: new Date().toISOString(),
  });
}
