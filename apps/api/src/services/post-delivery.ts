import { Prisma, type PrismaClient } from "../../generated/prisma/client";
import { makeDocumentNumber } from "./document-number";

export interface PostDeliveryInput {
  customerId: string;
  productId: string;
  weight: string;
  deliveredAt?: Date;
  note?: string;
  receiptFileKey?: string;
  createdById: string;
  actorIp?: string;
  actorUserAgent?: string;
}

export async function postDelivery(db: PrismaClient, input: PostDeliveryInput) {
  const weight = new Prisma.Decimal(input.weight);
  if (!weight.isFinite() || weight.lte(0)) throw new Error("وزن تحویل باید بزرگ‌تر از صفر باشد.");

  return db.$transaction(async (tx) => {
    const [customer, product, balance] = await Promise.all([
      tx.customer.findUnique({ where: { id: input.customerId }, select: { id: true, isActive: true } }),
      tx.metalProduct.findUnique({ where: { id: input.productId }, select: { id: true, isActive: true, weightPrecision: true } }),
      tx.weightLedgerEntry.aggregate({
        where: { customerId: input.customerId, productId: input.productId },
        _sum: { quantity: true },
      }),
    ]);

    if (!customer?.isActive) throw new Error("مشتری فعال پیدا نشد.");
    if (!product?.isActive) throw new Error("محصول فعال پیدا نشد.");
    if (weight.decimalPlaces() > product.weightPrecision) {
      throw new Error(`دقت وزن این محصول حداکثر ${product.weightPrecision} رقم اعشار است.`);
    }

    const available = balance._sum.quantity ?? new Prisma.Decimal(0);
    if (available.lt(weight)) throw new Error("وزن تحویل از موجودی وزنی مشتری بیشتر است.");

    const delivery = await tx.delivery.create({
      data: {
        documentNo: makeDocumentNumber("DL"),
        customerId: input.customerId,
        productId: input.productId,
        weight,
        status: "DELIVERED",
        deliveredAt: input.deliveredAt ?? new Date(),
        receiptFileKey: input.receiptFileKey,
        note: input.note,
        createdById: input.createdById,
      },
    });

    await tx.weightLedgerEntry.create({
      data: {
        customerId: input.customerId,
        productId: input.productId,
        kind: "DELIVERY_OUT",
        quantity: weight.negated(),
        sourceDeliveryId: delivery.id,
        description: input.note ?? `تحویل کالا ${delivery.documentNo}`,
        createdById: input.createdById,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.createdById,
        customerId: input.customerId,
        deliveryId: delivery.id,
        entityType: "DELIVERY",
        entityId: delivery.id,
        action: "POST",
        afterJson: { documentNo: delivery.documentNo, productId: input.productId, weight: weight.toString() },
        ipAddress: input.actorIp,
        userAgent: input.actorUserAgent,
      },
    });
    return delivery;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
