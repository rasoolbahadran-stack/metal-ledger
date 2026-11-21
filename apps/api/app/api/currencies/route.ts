import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/http-auth";

export const runtime = "nodejs";

const currencySchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
  name: z.string().trim().min(2).max(80),
  minorUnitScale: z.number().int().min(0).max(4),
});

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult.response) return authResult.response;
  const data = await prisma.currencyUnit.findMany({ orderBy: [{ isActive: "desc" }, { code: "asc" }] });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.response) return authResult.response;
  const parsed = currencySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 422 });

  try {
    const data = await prisma.$transaction(async (tx) => {
      const created = await tx.currencyUnit.create({ data: parsed.data });
      await tx.auditLog.create({
        data: {
          actorId: authResult.user!.id,
          entityType: "CURRENCY_UNIT",
          entityId: created.code,
          action: "CREATE",
          afterJson: { code: created.code, name: created.name, minorUnitScale: created.minorUnitScale },
          ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
          userAgent: request.headers.get("user-agent") ?? undefined,
        },
      });
      return created;
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "CURRENCY_CREATE_FAILED", message: "کد ارز تکراری است یا ثبت ارز انجام نشد." }, { status: 409 });
  }
}
