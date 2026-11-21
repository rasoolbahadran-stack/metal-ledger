import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/http-auth";

export const runtime = "nodejs";

const productSchema = z.object({
  code: z.string().trim().min(2).max(32).regex(/^[A-Za-z0-9_-]+$/),
  name: z.string().trim().min(2).max(120),
  metalType: z.string().trim().min(2).max(80),
  purityLabel: z.string().trim().max(40).optional(),
  baseUnit: z.string().trim().min(1).max(12).default("g"),
  weightPrecision: z.number().int().min(0).max(12).default(3),
});

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult.response) return authResult.response;
  const data = await prisma.metalProduct.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.response) return authResult.response;
  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 422 });

  try {
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.metalProduct.create({ data: parsed.data });
      await tx.auditLog.create({
        data: {
          actorId: authResult.user!.id,
          entityType: "METAL_PRODUCT",
          entityId: created.id,
          action: "CREATE",
          afterJson: { code: created.code, name: created.name, metalType: created.metalType, purityLabel: created.purityLabel },
          ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
          userAgent: request.headers.get("user-agent") ?? undefined,
        },
      });
      return created;
    });
    return NextResponse.json({ data: product }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "PRODUCT_CREATE_FAILED", message: "ایجاد محصول انجام نشد؛ کد محصول را بررسی کنید." }, { status: 409 });
  }
}
