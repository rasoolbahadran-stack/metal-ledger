import test from "node:test";
import assert from "node:assert/strict";
import { calculatePaymentPosting, calculateTradePosting, sumFinancialBalance } from "../src/domain/ledger";

test("خرید مشتری، وزن و بدهی او را افزایش می‌دهد", () => {
  const result = calculateTradePosting("CUSTOMER_BUYS_FROM_BUSINESS", "2.500", "1000", 2);
  assert.equal(result.weightDelta.toString(), "2.5");
  assert.equal(result.totalAmount.toString(), "2500");
  assert.equal(result.debitAmount.toString(), "2500");
  assert.equal(result.creditAmount.toString(), "0");
});

test("فروش مشتری، وزن را کم و بستانکاری را زیاد می‌کند", () => {
  const result = calculateTradePosting("CUSTOMER_SELLS_TO_BUSINESS", "0.750", "1200", 0);
  assert.equal(result.weightDelta.toString(), "-0.75");
  assert.equal(result.totalAmount.toString(), "900");
  assert.equal(result.debitAmount.toString(), "0");
  assert.equal(result.creditAmount.toString(), "900");
});

test("دریافت وجه از مشتری، بدهی را کاهش می‌دهد", () => {
  const result = calculatePaymentPosting("RECEIVED_FROM_CUSTOMER", "425.50", 0);
  assert.equal(result.debitAmount.toString(), "0");
  assert.equal(result.creditAmount.toString(), "426");
});

test("پرداخت وجه به مشتری، بدهی مالی را افزایش می‌دهد", () => {
  const result = calculatePaymentPosting("PAID_TO_CUSTOMER", "425.50", 2);
  assert.equal(result.debitAmount.toString(), "425.5");
  assert.equal(result.creditAmount.toString(), "0");
});

test("مبلغ با قاعده گردکردن نیم به بالا محاسبه می‌شود", () => {
  const result = calculateTradePosting("CUSTOMER_BUYS_FROM_BUSINESS", "1", "10.555", 2);
  assert.equal(result.totalAmount.toString(), "10.56");
});

test("وزن یا مبلغ نامعتبر پذیرفته نمی‌شود", () => {
  assert.throws(() => calculateTradePosting("CUSTOMER_BUYS_FROM_BUSINESS", "0", "100", 0));
  assert.throws(() => calculateTradePosting("CUSTOMER_BUYS_FROM_BUSINESS", "1", "0", 0));
  assert.throws(() => calculatePaymentPosting("RECEIVED_FROM_CUSTOMER", "-1", 0));
});

test("مانده مالی برابر بدهکار منهای بستانکار است", () => {
  assert.equal(sumFinancialBalance(["1000", "200"], ["300"]).toString(), "900");
});
