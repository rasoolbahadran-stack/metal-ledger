import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/http-auth";
import { reverseTrade } from "@/src/services/reverse-trade";

export const runtime = "nodejs";

const schema = z.object({ reason: z.string().trim().min(5).max(1000) });

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin();
  if (authResult.response) return authResult.response;
  const { id } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 422 });

  try {
    const result = await reverseTrade(
      prisma,
      id,
      authResult.user!.id,
      parsed.data.reason,
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      request.headers.get("user-agent") ?? undefined,
    );
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "برگشت سند انجام نشد.";
    return NextResponse.json({ error: "TRADE_REVERSAL_FAILED", message }, { status: 400 });
  }
}
