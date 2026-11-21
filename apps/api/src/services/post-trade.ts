import { Prisma, type PrismaClient } from "../../generated/prisma/client";
import { calculateTradePosting, type TradeKindValue } from "../domain/ledger";
import { makeDocumentNumber } from "./document-number";

type TransactionClient = Prisma.TransactionClient;

export interface PostTradeInput {
  customerId: string;
  productId: string;
  kind: TradeKindValue;
  weight: string;
  unitPrice: string;
  currencyCode: string;
  tradedAt?: Date;
  note?: string;
  createdById: string;
  actorIp?: string;
  actorUserAgent?: string;
}

export async function postTrade(db: PrismaClient, input: PostTradeInput) {
  return db.$transaction(async (tx: TransactionClient) => {
    const [customer, product, currency] = await Promise.all([
      tx.customer.findUnique({ where: { id: input.customerId }, select: { id: true, isActive: true } }),
      tx.metalProduct.findUnique({ where: { id: input.productId }, select: { id: true, isActive: true, weightPrecision: true } }),
      tx.currencyUnit.findUnique({ where: { code: input.currencyCode }, select: { code: true, minorUnitScale: true, isActive: true } }),
    ]);

    if (!customer?.isActive) throw new Error("مشتری فعال پیدا نشد.");
    if (!product?.isActive) throw new Error("محصول فعال پیدا نشد.");
    if (!currency?.isActive) throw new Error("ارز فعال و پیکربندی‌شده برای این سند پیدا نشد.");
    const effects = calculateTradePosting(input.kind, input.weight, input.unitPrice, currency.minorUnitScale);
    if (new Prisma.Decimal(input.weight).decimalPlaces() > product.weightPrecision) {
      throw new Error(`دقت وزن این محصول حداکثر ${product.weightPrecision} رقم اعشار است.`);
    }
    if (effects.weightDelta.lt(0)) {
      const currentBalance = await tx.weightLedgerEntry.aggregate({
        where: { customerId: input.customerId, productId: input.productId },
        _sum: { quantity: true },
      });
      const available = currentBalance._sum.quantity ?? new Prisma.Decimal(0);
      if (available.plus(effects.weightDelta).lt(0)) {
        throw new Error("مانده وزنی مشتری برای ثبت این فروش کافی نیست.");
      }
    }

    const trade = await tx.trade.create({
      data: {
        documentNo: makeDocumentNumber("TR"),
        customerId: input.customerId,
        productId: input.productId,
        kind: input.kind,
        weight: new Prisma.Decimal(input.weight),
        unitPrice: new Prisma.Decimal(input.unitPrice),
        totalAmount: effects.totalAmount,
        currencyCode: input.currencyCode,
        moneyScale: currency.minorUnitScale,
        status: "POSTED",
        tradedAt: input.tradedAt ?? new Date(),
        note: input.note,
        createdById: input.createdById,
      },
    });

    await tx.weightLedgerEntry.create({
      data: {
        customerId: input.customerId,
        productId: input.productId,
        kind: input.kind === "CUSTOMER_BUYS_FROM_BUSINESS" ? "TRADE_PURCHASE" : "TRADE_SALE",
        quantity: effects.weightDelta,
        sourceTradeId: trade.id,
        description: input.note ?? `ثبت معامله ${trade.documentNo}`,
        createdById: input.createdById,
      },
    });

    await tx.financialLedgerEntry.create({
      data: {
        customerId: input.customerId,
        sourceType: "TRADE",
        sourceTradeId: trade.id,
        debitAmount: effects.debitAmount,
        creditAmount: effects.creditAmount,
        currencyCode: input.currencyCode,
        moneyScale: currency.minorUnitScale,
        description: `${input.kind === "CUSTOMER_BUYS_FROM_BUSINESS" ? "خرید مشتری" : "فروش مشتری"} - ${trade.documentNo}`,
        createdById: input.createdById,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.createdById,
        customerId: input.customerId,
        tradeId: trade.id,
        entityType: "TRADE",
        entityId: trade.id,
        action: "POST",
        afterJson: {
          documentNo: trade.documentNo,
          kind: input.kind,
          weight: input.weight,
          unitPrice: input.unitPrice,
          totalAmount: effects.totalAmount.toString(),
        },
        ipAddress: input.actorIp,
        userAgent: input.actorUserAgent,
      },
    });

    return trade;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
