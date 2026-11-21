import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      service: "metal-ledger-api",
      status: "degraded",
      database: "not_configured",
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      service: "metal-ledger-api",
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      service: "metal-ledger-api",
      status: "degraded",
      database: "unavailable",
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
