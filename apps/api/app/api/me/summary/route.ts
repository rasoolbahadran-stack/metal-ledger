import { NextResponse } from "next/server";
import { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/http-auth";

export const runtime = "nodejs";

export async function GET() {
  const authResult = await requireCustomer();
  if (authResult.response) return authResult.response;
  const customerId = authResult.user!.customerId!;

  const [customer, weightGroups, financialGroups, recentTrades, recentPayments, recentDeliveries] = await Promise.all([
    prisma.customer.findUnique({ where: { id: customerId }, select: { id: true, code: true, fullName: true, email: true, phone: true } }),
    prisma.weightLedgerEntry.groupBy({
      by: ["productId"],
      where: { customerId },
      _sum: { quantity: true },
    }),
    prisma.financialLedgerEntry.groupBy({
      by: ["currencyCode"],
      where: { customerId },
      _sum: { debitAmount: true, creditAmount: true },
    }),
    prisma.trade.findMany({ where: { customerId }, include: { product: { select: { name: true, baseUnit: true } } }, orderBy: { tradedAt: "desc" }, take: 5 }),
    prisma.payment.findMany({ where: { customerId }, orderBy: { paidAt: "desc" }, take: 5 }),
    prisma.delivery.findMany({ where: { customerId }, include: { product: { select: { name: true, baseUnit: true } } }, orderBy: { deliveredAt: "desc" }, take: 5 }),
  ]);

  if (!customer) return NextResponse.json({ error: "CUSTOMER_NOT_FOUND" }, { status: 404 });

  const productIds = weightGroups.map((item) => item.productId);
  const products = productIds.length
    ? await prisma.metalProduct.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, baseUnit: true, code: true } })
    : [];
  const productMap = new Map(products.map((product) => [product.id, product]));

  return NextResponse.json({
    customer,
    balances: {
      weight: weightGroups.map((item) => ({
        product: productMap.get(item.productId),
        quantity: (item._sum.quantity ?? new Prisma.Decimal(0)).toFixed(),
      })),
      financial: financialGroups.map((item) => {
        const debit = item._sum.debitAmount ?? new Prisma.Decimal(0);
        const credit = item._sum.creditAmount ?? new Prisma.Decimal(0);
        return {
          currencyCode: item.currencyCode,
          debit: debit.toFixed(),
          credit: credit.toFixed(),
          balance: debit.minus(credit).toFixed(),
        };
      }),
    },
    recent: {
      trades: recentTrades,
      payments: recentPayments,
      deliveries: recentDeliveries,
    },
  });
}
