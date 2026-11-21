import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/http-auth";
import { postPayment } from "@/src/services/post-payment";

export const runtime = "nodejs";

const paymentSchema = z.object({
  customerId: z.string().min(1),
  direction: z.enum(["RECEIVED_FROM_CUSTOMER", "PAID_TO_CUSTOMER"]),
  amount: z.string().regex(/^\d+(\.\d{1,4})?$/),
  currencyCode: z.string().regex(/^[A-Z]{3}$/),
  method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "OTHER"]).default("BANK_TRANSFER"),
  reference: z.string().max(160).optional(),
  paidAt: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.response) return authResult.response;
  const parsed = paymentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 422 });
  }
  try {
    const payment = await postPayment(prisma, {
      ...parsed.data,
      paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : undefined,
      createdById: authResult.user!.id,
      actorIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      actorUserAgent: request.headers.get("user-agent") ?? undefined,
    });
    return NextResponse.json({ data: payment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ثبت پرداخت انجام نشد.";
    return NextResponse.json({ error: "PAYMENT_POST_FAILED", message }, { status: 400 });
  }
}
