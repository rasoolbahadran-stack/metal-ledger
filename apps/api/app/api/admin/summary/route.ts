import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/http-auth";

export const runtime = "nodejs";

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult.response) return authResult.response;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [customers, activeCustomers, todayTrades, moneyByCurrency, weightByProduct, latestTrades, latestPayments, latestDeliveries] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { isActive: true } }),
    prisma.trade.count({ where: { tradedAt: { gte: startOfDay }, status: "POSTED" } }),
    prisma.trade.groupBy({ by: ["currencyCode"], where: { tradedAt: { gte: startOfDay }, status: "POSTED" }, _sum: { totalAmount: true } }),
    prisma.trade.groupBy({ by: ["productId"], where: { tradedAt: { gte: startOfDay }, status: "POSTED" }, _sum: { weight: true } }),
    prisma.trade.findMany({ include: { customer: { select: { fullName: true, code: true } }, product: { select: { name: true, baseUnit: true } } }, orderBy: { tradedAt: "desc" }, take: 6 }),
    prisma.payment.findMany({ include: { customer: { select: { fullName: true, code: true } } }, orderBy: { paidAt: "desc" }, take: 5 }),
    prisma.delivery.findMany({ include: { customer: { select: { fullName: true, code: true } }, product: { select: { name: true, baseUnit: true } } }, orderBy: { deliveredAt: "desc" }, take: 5 }),
  ]);

  return NextResponse.json({
    counts: { customers, activeCustomers, todayTrades },
    today: {
      moneyByCurrency: moneyByCurrency.map((item) => ({
        currencyCode: item.currencyCode,
        grossAmount: (item._sum.totalAmount ?? 0).toString(),
      })),
      weightByProduct: weightByProduct.map((item) => ({
        productId: item.productId,
        weight: (item._sum.weight ?? 0).toString(),
      })),
    },
    latest: { trades: latestTrades, payments: latestPayments, deliveries: latestDeliveries },
  });
}
