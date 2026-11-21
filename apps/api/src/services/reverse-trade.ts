import { Prisma, type PrismaClient } from "../../generated/prisma/client";
import { calculateTradePosting, type TradeKindValue } from "../domain/ledger";
import { makeDocumentNumber } from "./document-number";

export async function reverseTrade(db: PrismaClient, tradeId: string, actorId: string, reason: string, actorIp?: string, actorUserAgent?: string) {
  if (reason.trim().length < 5) throw new Error("علت برگشت سند باید حداقل ۵ نویسه باشد.");

  return db.$transaction(async (tx) => {
    const original = await tx.trade.findUnique({ where: { id: tradeId }, include: { reversal: true } });
    if (!original) throw new Error("سند معامله پیدا نشد.");
    if (original.status !== "POSTED") throw new Error("فقط سند قطعی قابل برگشت است.");
    if (original.reversal) throw new Error("برای این سند قبلاً برگشت ثبت شده است.");

    const reverseKind: TradeKindValue = original.kind === "CUSTOMER_BUYS_FROM_BUSINESS"
      ? "CUSTOMER_SELLS_TO_BUSINESS"
      : "CUSTOMER_BUYS_FROM_BUSINESS";
    const effects = calculateTradePosting(reverseKind, original.weight.toString(), original.unitPrice.toString(), original.moneyScale);

    if (effects.weightDelta.lt(0)) {
      const balance = await tx.weightLedgerEntry.aggregate({
        where: { customerId: original.customerId, productId: original.productId },
        _sum: { quantity: true },
      });
      const available = balance._sum.quantity ?? new Prisma.Decimal(0);
      if (available.plus(effects.weightDelta).lt(0)) {
        throw new Error("این سند قابل برگشت نیست؛ بخشی از وزن آن قبلاً تحویل یا مصرف شده است.");
      }
    }

    const reversal = await tx.trade.create({
      data: {
        documentNo: makeDocumentNumber("TR"),
        customerId: original.customerId,
        productId: original.productId,
        kind: reverseKind,
        weight: original.weight,
        unitPrice: original.unitPrice,
        totalAmount: original.totalAmount,
        currencyCode: original.currencyCode,
        moneyScale: original.moneyScale,
        status: "POSTED",
        tradedAt: new Date(),
        note: `برگشت سند ${original.documentNo} — ${reason.trim()}`,
        createdById: actorId,
        reversalOfId: original.id,
      },
    });

    await tx.weightLedgerEntry.create({
      data: {
        customerId: original.customerId,
        productId: original.productId,
        kind: "REVERSAL",
        quantity: effects.weightDelta,
        sourceTradeId: reversal.id,
        description: `برگشت معامله ${original.documentNo}`,
        createdById: actorId,
      },
    });
    await tx.financialLedgerEntry.create({
      data: {
        customerId: original.customerId,
        sourceType: "REVERSAL",
        sourceTradeId: reversal.id,
        debitAmount: effects.debitAmount,
        creditAmount: effects.creditAmount,
        currencyCode: original.currencyCode,
        moneyScale: original.moneyScale,
        description: `برگشت معامله ${original.documentNo}`,
        createdById: actorId,
      },
    });
    await tx.trade.update({ where: { id: original.id }, data: { status: "REVERSED" } });

    await tx.auditLog.create({
      data: {
        actorId,
        customerId: original.customerId,
        tradeId: original.id,
        entityType: "TRADE",
        entityId: original.id,
        action: "REVERSE",
        reason: reason.trim(),
        beforeJson: { status: original.status, documentNo: original.documentNo },
        afterJson: { status: "REVERSED", reversalDocumentNo: reversal.documentNo, reversalId: reversal.id },
        ipAddress: actorIp,
        userAgent: actorUserAgent,
      },
    });
    return { originalId: original.id, originalDocumentNo: original.documentNo, reversal };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
