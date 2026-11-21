import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/http-auth";

export const runtime = "nodejs";

type StatementEvent = {
  id: string;
  date: Date;
  documentNo: string;
  type: "TRADE" | "PAYMENT" | "DELIVERY";
  description: string;
  productId?: string;
  productName?: string;
  weightDelta: string;
  debit: string;
  credit: string;
  currencyCode?: string;
};

type TradeWithLedger = Prisma.TradeGetPayload<{ include: { product: { select: { name: true } }; financialEntry: true } }>;
type PaymentWithLedger = Prisma.PaymentGetPayload<{ include: { financialEntry: true } }>;
type DeliveryWithProduct = Prisma.DeliveryGetPayload<{ include: { product: { select: { name: true } } } }>;

function toTradeEvent(trade: TradeWithLedger): StatementEvent {
  const isBuy = trade.kind === "CUSTOMER_BUYS_FROM_BUSINESS";
  return {
    id: trade.id,
    date: trade.tradedAt,
    documentNo: trade.documentNo,
    type: "TRADE",
    description: isBuy ? "خرید مشتری" : "فروش مشتری",
    productId: trade.productId,
    productName: trade.product.name,
    weightDelta: isBuy ? trade.weight.toFixed() : trade.weight.negated().toFixed(),
    debit: (trade.financialEntry?.debitAmount ?? new Prisma.Decimal(0)).toFixed(),
    credit: (trade.financialEntry?.creditAmount ?? new Prisma.Decimal(0)).toFixed(),
    currencyCode: trade.currencyCode,
  };
}

function toPaymentEvent(payment: PaymentWithLedger): StatementEvent {
  return {
    id: payment.id,
    date: payment.paidAt,
    documentNo: payment.documentNo,
    type: "PAYMENT",
    description: payment.direction === "RECEIVED_FROM_CUSTOMER" ? "دریافت وجه" : "پرداخت وجه",
    weightDelta: "0",
    debit: (payment.financialEntry?.debitAmount ?? new Prisma.Decimal(0)).toFixed(),
    credit: (payment.financialEntry?.creditAmount ?? new Prisma.Decimal(0)).toFixed(),
    currencyCode: payment.currencyCode,
  };
}

function toDeliveryEvent(delivery: DeliveryWithProduct): StatementEvent {
  return {
    id: delivery.id,
    date: delivery.deliveredAt,
    documentNo: delivery.documentNo,
    type: "DELIVERY",
    description: "تحویل فیزیکی کالا",
    productId: delivery.productId,
    productName: delivery.product.name,
    weightDelta: delivery.weight.negated().toFixed(),
    debit: "0",
    credit: "0",
  };
}

const dateBounds = (from: Date | undefined, to: Date | undefined) => ({
  ...(from ? { gte: from } : {}),
  ...(to ? { lte: to } : {}),
});

export async function GET(request: NextRequest) {
  const authResult = await requireCustomer();
  if (authResult.response) return authResult.response;
  const customerId = authResult.user!.customerId!;
  const params = request.nextUrl.searchParams;
  const fromParam = params.get("from");
  const toParam = params.get("to");
  const productId = params.get("productId") ?? undefined;
  const from = fromParam ? new Date(fromParam) : undefined;
  const to = toParam ? new Date(toParam) : undefined;
  if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime())) || (from && to && from > to)) {
    return NextResponse.json({ error: "INVALID_DATE_RANGE" }, { status: 422 });
  }

  const tradeBase = { customerId, status: { not: "DRAFT" as const }, ...(productId ? { productId } : {}) };
  const deliveryBase = { customerId, status: { not: "DRAFT" as const }, ...(productId ? { productId } : {}) };
  const paymentBase = { customerId, status: { not: "DRAFT" as const } };
  const [trades, payments, deliveries, openingTrades, openingPayments, openingDeliveries] = await Promise.all([
    prisma.trade.findMany({
      where: { ...tradeBase, ...((from || to) ? { tradedAt: dateBounds(from, to) } : {}) },
      include: { product: { select: { name: true } }, financialEntry: true },
      orderBy: { tradedAt: "asc" },
      take: 5000,
    }),
    prisma.payment.findMany({
      where: { ...paymentBase, ...((from || to) ? { paidAt: dateBounds(from, to) } : {}) },
      include: { financialEntry: true },
      orderBy: { paidAt: "asc" },
      take: 5000,
    }),
    prisma.delivery.findMany({
      where: { ...deliveryBase, ...((from || to) ? { deliveredAt: dateBounds(from, to) } : {}) },
      include: { product: { select: { name: true } } },
      orderBy: { deliveredAt: "asc" },
      take: 5000,
    }),
    from ? prisma.trade.findMany({ where: { ...tradeBase, tradedAt: { lt: from } }, include: { product: { select: { name: true } }, financialEntry: true }, take: 5000 }) : Promise.resolve([]),
    from ? prisma.payment.findMany({ where: { ...paymentBase, paidAt: { lt: from } }, include: { financialEntry: true }, take: 5000 }) : Promise.resolve([]),
    from ? prisma.delivery.findMany({ where: { ...deliveryBase, deliveredAt: { lt: from } }, include: { product: { select: { name: true } } }, take: 5000 }) : Promise.resolve([]),
  ]);

  const openingWeight = new Map<string, Prisma.Decimal>();
  const openingDebit = new Map<string, Prisma.Decimal>();
  const openingCredit = new Map<string, Prisma.Decimal>();
  const add = (map: Map<string, Prisma.Decimal>, key: string, value: string | Prisma.Decimal) => {
    map.set(key, (map.get(key) ?? new Prisma.Decimal(0)).plus(value));
  };

  for (const trade of openingTrades) {
    const isBuy = trade.kind === "CUSTOMER_BUYS_FROM_BUSINESS";
    add(openingWeight, trade.productId, isBuy ? trade.weight : trade.weight.negated());
    if (trade.financialEntry) {
      add(openingDebit, trade.currencyCode, trade.financialEntry.debitAmount);
      add(openingCredit, trade.currencyCode, trade.financialEntry.creditAmount);
    }
  }
  for (const payment of openingPayments) {
    if (payment.financialEntry) {
      add(openingDebit, payment.currencyCode, payment.financialEntry.debitAmount);
      add(openingCredit, payment.currencyCode, payment.financialEntry.creditAmount);
    }
  }
  for (const delivery of openingDeliveries) add(openingWeight, delivery.productId, delivery.weight.negated());

  const events = [
    ...trades.map(toTradeEvent),
    ...payments.map(toPaymentEvent),
    ...deliveries.map(toDeliveryEvent),
  ].sort((a, b) => a.date.getTime() - b.date.getTime() || a.documentNo.localeCompare(b.documentNo));

  const currentWeight = new Map(openingWeight);
  const currentDebit = new Map(openingDebit);
  const currentCredit = new Map(openingCredit);
  const rows = events.map((event) => {
    if (event.productId) add(currentWeight, event.productId, event.weightDelta);
    if (event.currencyCode) {
      add(currentDebit, event.currencyCode, event.debit);
      add(currentCredit, event.currencyCode, event.credit);
    }
    const financialBalance = event.currencyCode
      ? (currentDebit.get(event.currencyCode) ?? new Prisma.Decimal(0)).minus(currentCredit.get(event.currencyCode) ?? new Prisma.Decimal(0)).toFixed()
      : null;
    return {
      ...event,
      date: event.date.toISOString(),
      financialBalance,
      productWeightBalance: event.productId ? (currentWeight.get(event.productId) ?? new Prisma.Decimal(0)).toFixed() : null,
    };
  });

  const currencies = [...new Set([...currentDebit.keys(), ...currentCredit.keys()])];
  const products = [...new Set([...currentWeight.keys()])];
  return NextResponse.json({
    range: { from: from?.toISOString() ?? null, to: to?.toISOString() ?? null },
    opening: {
      financial: currencies.map((currencyCode) => ({
        currencyCode,
        debit: (openingDebit.get(currencyCode) ?? new Prisma.Decimal(0)).toFixed(),
        credit: (openingCredit.get(currencyCode) ?? new Prisma.Decimal(0)).toFixed(),
        balance: (openingDebit.get(currencyCode) ?? new Prisma.Decimal(0)).minus(openingCredit.get(currencyCode) ?? new Prisma.Decimal(0)).toFixed(),
      })),
      weight: products.map((productId) => ({ productId, quantity: (openingWeight.get(productId) ?? new Prisma.Decimal(0)).toFixed() })),
    },
    rows,
    summary: {
      financial: currencies.map((currencyCode) => ({
        currencyCode,
        debit: (currentDebit.get(currencyCode) ?? new Prisma.Decimal(0)).toFixed(),
        credit: (currentCredit.get(currencyCode) ?? new Prisma.Decimal(0)).toFixed(),
        balance: (currentDebit.get(currencyCode) ?? new Prisma.Decimal(0)).minus(currentCredit.get(currencyCode) ?? new Prisma.Decimal(0)).toFixed(),
      })),
      weight: products.map((productId) => ({ productId, quantity: (currentWeight.get(productId) ?? new Prisma.Decimal(0)).toFixed() })),
      truncated: trades.length >= 5000 || payments.length >= 5000 || deliveries.length >= 5000 || openingTrades.length >= 5000 || openingPayments.length >= 5000 || openingDeliveries.length >= 5000,
    },
  });
}
