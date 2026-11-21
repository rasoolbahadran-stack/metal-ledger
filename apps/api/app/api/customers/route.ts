import { randomInt } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/http-auth";

export const runtime = "nodejs";

const customerSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  code: z.string().trim().min(2).max(32).regex(/^[A-Za-z0-9_-]+$/).optional(),
  phone: z.string().trim().max(32).optional(),
  email: z.email().optional().or(z.literal("")),
  password: z.string().min(12).max(128).optional(),
  notes: z.string().max(4000).optional(),
}).refine((value) => Boolean(value.email) === Boolean(value.password), {
  message: "برای ساخت حساب ورود، ایمیل و گذرواژه باید هر دو وارد شوند.",
  path: ["password"],
});

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.response) return authResult.response;

  const search = request.nextUrl.searchParams.get("q")?.trim();
  const activeParam = request.nextUrl.searchParams.get("active");
  const requestedTake = Number(request.nextUrl.searchParams.get("take") ?? 50);
  const take = Math.min(Math.max(Number.isFinite(requestedTake) ? requestedTake : 50, 1), 100);

  const customers = await prisma.customer.findMany({
    where: {
      ...(activeParam === "true" ? { isActive: true } : activeParam === "false" ? { isActive: false } : {}),
      ...(search ? {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ],
      } : {}),
    },
    select: { id: true, code: true, fullName: true, phone: true, email: true, isActive: true, createdAt: true, user: { select: { id: true, email: true, role: true, isActive: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });

  return NextResponse.json({ data: customers });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.response) return authResult.response;
  const parsed = customerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 422 });
  }

  const { password, ...customerData } = parsed.data;
  const code = customerData.code ?? `CUS-${Date.now().toString(36).toUpperCase()}-${randomInt(10, 99)}`;
  let customer;
  try {
    customer = await prisma.customer.create({
      data: {
        code,
        fullName: customerData.fullName,
        phone: customerData.phone || null,
        email: customerData.email || null,
        notes: customerData.notes,
      },
    });
  } catch {
    return NextResponse.json({ error: "CUSTOMER_CREATE_FAILED", message: "ایجاد پرونده مشتری انجام نشد؛ کد مشتری را بررسی کنید." }, { status: 409 });
  }

  let accountCreated = false;
  try {
    if (customerData.email && password) {
      const authUser = await auth.api.createUser({
        body: {
          name: customerData.fullName,
          email: customerData.email,
          password,
          role: "user",
          data: { customerId: customer.id, isActive: true },
        },
        headers: request.headers,
      });
      // Persist the relationship explicitly; it is a server-owned authorization field.
      await prisma.user.update({
        where: { id: authUser.id },
        data: { customerId: customer.id, isActive: true, role: "user" },
      });
      accountCreated = true;
    }

    await prisma.auditLog.create({
      data: {
        actorId: authResult.user!.id,
        customerId: customer.id,
        entityType: "CUSTOMER",
        entityId: customer.id,
        action: accountCreated ? "CREATE_WITH_LOGIN" : "CREATE",
        afterJson: { code: customer.code, fullName: customer.fullName, accountCreated },
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
        userAgent: request.headers.get("user-agent") ?? undefined,
      },
    });
  } catch {
    // The customer account stays disabled/unlinked if provisioning failed; no password is returned or stored here.
    return NextResponse.json({
      data: { id: customer.id, code: customer.code, fullName: customer.fullName },
      warning: "پرونده مشتری ایجاد شد، اما ساخت حساب ورود کامل نشد. از ثبت دوباره پرونده خودداری و وضعیت کاربر را بررسی کنید.",
    }, { status: 202 });
  }

  return NextResponse.json({
    data: { id: customer.id, code: customer.code, fullName: customer.fullName, accountCreated },
  }, { status: 201 });
}
