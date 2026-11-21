import { Prisma, type PrismaClient } from "../../generated/prisma/client";
import { calculatePaymentPosting, type PaymentDirectionValue } from "../domain/ledger";
import { makeDocumentNumber } from "./document-number";

export interface PostPaymentInput {
  customerId: string;
  direction: PaymentDirectionValue;
  amount: string;
  currencyCode: string;
  method: "CASH" | "CARD" | "BANK_TRANSFER" | "OTHER";
  reference?: string;
  paidAt?: Date;
  notes?: string;
  createdById: string;
  actorIp?: string;
  actorUserAgent?: string;
}

export async function postPayment(db: PrismaClient, input: PostPaymentInput) {
  return db.$transaction(async (tx) => {
    const [customer, currency] = await Promise.all([
      tx.customer.findUnique({ where: { id: input.customerId }, select: { id: true, isActive: true } }),
      tx.currencyUnit.findUnique({ where: { code: input.currencyCode }, select: { code: true, minorUnitScale: true, isActive: true } }),
    ]);
    if (!customer?.isActive) throw new Error("مشتری فعال پیدا نشد.");
    if (!currency?.isActive) throw new Error("ارز فعال و پیکربندی‌شده برای این سند پیدا نشد.");
    const effects = calculatePaymentPosting(input.direction, input.amount, currency.minorUnitScale);

    const payment = await tx.payment.create({
      data: {
        documentNo: makeDocumentNumber("PY"),
        customerId: input.customerId,
        direction: input.direction,
        amount: new Prisma.Decimal(input.amount).toDecimalPlaces(currency.minorUnitScale, Prisma.Decimal.ROUND_HALF_UP),
        currencyCode: input.currencyCode,
        moneyScale: currency.minorUnitScale,
        method: input.method,
        reference: input.reference,
        paidAt: input.paidAt ?? new Date(),
        notes: input.notes,
        status: "POSTED",
        createdById: input.createdById,
      },
    });

    await tx.financialLedgerEntry.create({
      data: {
        customerId: input.customerId,
        sourceType: "PAYMENT",
        sourcePaymentId: payment.id,
        debitAmount: effects.debitAmount,
        creditAmount: effects.creditAmount,
        currencyCode: input.currencyCode,
        moneyScale: currency.minorUnitScale,
        description: `${input.direction === "RECEIVED_FROM_CUSTOMER" ? "دریافت از مشتری" : "پرداخت به مشتری"} - ${payment.documentNo}`,
        createdById: input.createdById,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.createdById,
        customerId: input.customerId,
        paymentId: payment.id,
        entityType: "PAYMENT",
        entityId: payment.id,
        action: "POST",
        afterJson: { documentNo: payment.documentNo, direction: input.direction, amount: payment.amount.toString() },
        ipAddress: input.actorIp,
        userAgent: input.actorUserAgent,
      },
    });
    return payment;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
