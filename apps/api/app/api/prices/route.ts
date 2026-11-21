import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/http-auth";

export const runtime = "nodejs";

const priceSchema = z.object({
  productId: z.string().min(1),
  unitPrice: z.string().regex(/^(?=.*[1-9])\d+(\.\d{1,8})?$/),
  currencyCode: z.string().regex(/^[A-Z]{3}$/),
  validAt: z.string().datetime().optional(),
  note: z.string().max(1000).optional(),
});

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.response) return authResult.response;
  const productId = request.nextUrl.searchParams.get("productId") ?? undefined;
  const take = Math.min(Math.max(Number(request.nextUrl.searchParams.get("take") ?? 50) || 50, 1), 100);
  const data = await prisma.priceQuote.findMany({
    where: productId ? { productId } : undefined,
    include: { product: { select: { code: true, name: true, baseUnit: true } } },
    orderBy: { validAt: "desc" },
    take,
  });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.response) return authResult.response;
  const parsed = priceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 422 });

  const currency = await prisma.currencyUnit.findUnique({ where: { code: parsed.data.currencyCode }, select: { isActive: true } });
  if (!currency?.isActive) return NextResponse.json({ error: "CURRENCY_NOT_CONFIGURED", message: "ابتدا ارز را در تنظیمات سامانه تعریف و فعال کنید." }, { status: 422 });

  try {
    const quote = await prisma.$transaction(async (tx) => {
      const created = await tx.priceQuote.create({
        data: {
          productId: parsed.data.productId,
          source: "MANUAL",
          unitPrice: new Prisma.Decimal(parsed.data.unitPrice),
          currencyCode: parsed.data.currencyCode,
          validAt: parsed.data.validAt ? new Date(parsed.data.validAt) : new Date(),
          note: parsed.data.note,
          creatorId: authResult.user!.id,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: authResult.user!.id,
          entityType: "PRICE_QUOTE",
          entityId: created.id,
          action: "CREATE_MANUAL_PRICE",
          afterJson: { productId: created.productId, unitPrice: created.unitPrice.toString(), currencyCode: created.currencyCode },
          ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
          userAgent: request.headers.get("user-agent") ?? undefined,
        },
      });
      return created;
    });
    return NextResponse.json({ data: quote }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "PRICE_CREATE_FAILED", message: "ثبت قیمت انجام نشد؛ محصول را بررسی کنید." }, { status: 400 });
  }
}
