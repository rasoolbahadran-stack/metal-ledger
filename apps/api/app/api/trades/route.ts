import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/http-auth";
import { postTrade } from "@/src/services/post-trade";

export const runtime = "nodejs";

const tradeSchema = z.object({
  customerId: z.string().min(1),
  productId: z.string().min(1),
  kind: z.enum(["CUSTOMER_BUYS_FROM_BUSINESS", "CUSTOMER_SELLS_TO_BUSINESS"]),
  weight: z.string().regex(/^\d+(\.\d{1,12})?$/),
  unitPrice: z.string().regex(/^\d+(\.\d{1,8})?$/),
  currencyCode: z.string().regex(/^[A-Z]{3}$/),
  tradedAt: z.string().datetime().optional(),
  note: z.string().max(2000).optional(),
});

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.response) return authResult.response;

  const customerId = request.nextUrl.searchParams.get("customerId") ?? undefined;
  const take = Math.min(Math.max(Number(request.nextUrl.searchParams.get("take") ?? 50), 1), 100);
  const data = await prisma.trade.findMany({
    where: customerId ? { customerId } : undefined,
    include: { customer: { select: { code: true, fullName: true } }, product: { select: { code: true, name: true, baseUnit: true } } },
    orderBy: { tradedAt: "desc" },
    take,
  });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.response) return authResult.response;

  const parsed = tradeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const trade = await postTrade(prisma, {
      ...parsed.data,
      tradedAt: parsed.data.tradedAt ? new Date(parsed.data.tradedAt) : undefined,
      createdById: authResult.user!.id,
      actorIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      actorUserAgent: request.headers.get("user-agent") ?? undefined,
    });
    return NextResponse.json({ data: trade }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ثبت معامله انجام نشد.";
    return NextResponse.json({ error: "TRADE_POST_FAILED", message }, { status: 400 });
  }
}
