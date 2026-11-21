import { Prisma } from "../../generated/prisma/client";

export type TradeKindValue =
  | "CUSTOMER_BUYS_FROM_BUSINESS"
  | "CUSTOMER_SELLS_TO_BUSINESS";

export type PaymentDirectionValue =
  | "RECEIVED_FROM_CUSTOMER"
  | "PAID_TO_CUSTOMER";

export interface TradePosting {
  weightDelta: Prisma.Decimal;
  debitAmount: Prisma.Decimal;
  creditAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
}

const zero = () => new Prisma.Decimal(0);

export function calculateTradePosting(
  kind: TradeKindValue,
  weightValue: string,
  unitPriceValue: string,
  moneyScale: number,
): TradePosting {
  const weight = new Prisma.Decimal(weightValue);
  const unitPrice = new Prisma.Decimal(unitPriceValue);

  if (!weight.isFinite() || !unitPrice.isFinite() || weight.lte(0) || unitPrice.lte(0)) {
    throw new Error("وزن باید مثبت و قیمت نباید منفی باشد.");
  }
  if (!Number.isInteger(moneyScale) || moneyScale < 0 || moneyScale > 4) {
    throw new Error("دقت اعشار مبلغ نامعتبر است.");
  }

  const totalAmount = weight.mul(unitPrice).toDecimalPlaces(
    moneyScale,
    Prisma.Decimal.ROUND_HALF_UP,
  );
  const isCustomerBuy = kind === "CUSTOMER_BUYS_FROM_BUSINESS";

  return {
    weightDelta: isCustomerBuy ? weight : weight.negated(),
    debitAmount: isCustomerBuy ? totalAmount : zero(),
    creditAmount: isCustomerBuy ? zero() : totalAmount,
    totalAmount,
  };
}

export function calculatePaymentPosting(
  direction: PaymentDirectionValue,
  amountValue: string,
  moneyScale: number,
) {
  const amount = new Prisma.Decimal(amountValue);
  if (!amount.isFinite() || amount.lte(0)) {
    throw new Error("مبلغ پرداخت باید بزرگ‌تر از صفر باشد.");
  }
  if (!Number.isInteger(moneyScale) || moneyScale < 0 || moneyScale > 4) {
    throw new Error("دقت اعشار مبلغ نامعتبر است.");
  }

  const normalized = amount.toDecimalPlaces(moneyScale, Prisma.Decimal.ROUND_HALF_UP);
  const received = direction === "RECEIVED_FROM_CUSTOMER";
  return {
    debitAmount: received ? zero() : normalized,
    creditAmount: received ? normalized : zero(),
  };
}

export function sumFinancialBalance(debitValues: string[], creditValues: string[]) {
  const debit = debitValues.reduce((sum, value) => sum.plus(value), zero());
  const credit = creditValues.reduce((sum, value) => sum.plus(value), zero());
  return debit.minus(credit);
}
