import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/http-auth";
import { postDelivery } from "@/src/services/post-delivery";

export const runtime = "nodejs";

const deliverySchema = z.object({
  customerId: z.string().min(1),
  productId: z.string().min(1),
  weight: z.string().regex(/^\d+(\.\d{1,12})?$/),
  deliveredAt: z.string().datetime().optional(),
  note: z.string().max(2000).optional(),
  receiptFileKey: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.response) return authResult.response;
  const parsed = deliverySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 422 });
  }
  try {
    const delivery = await postDelivery(prisma, {
      ...parsed.data,
      deliveredAt: parsed.data.deliveredAt ? new Date(parsed.data.deliveredAt) : undefined,
      createdById: authResult.user!.id,
      actorIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      actorUserAgent: request.headers.get("user-agent") ?? undefined,
    });
    return NextResponse.json({ data: delivery }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ثبت تحویل انجام نشد.";
    return NextResponse.json({ error: "DELIVERY_POST_FAILED", message }, { status: 400 });
  }
}
