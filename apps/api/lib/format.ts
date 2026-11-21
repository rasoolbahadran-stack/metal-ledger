/** Preserve exact decimal digits when formatting database NUMERIC/Decimal values. */
export function formatFaNumber(value: string | number | bigint): string {
  const raw = String(value).trim();
  const match = raw.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
  if (!match) return raw;

  const [, sign, integerPart, fractionPart = ""] = match;
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, "٬");
  const fraction = fractionPart.replace(/0+$/, "");
  const latin = `${sign === "-" ? "−" : sign === "+" ? "+" : ""}${groupedInteger}${fraction ? `٫${fraction}` : ""}`;
  const digits = "۰۱۲۳۴۵۶۷۸۹";
  return latin.replace(/[0-9]/g, (digit) => digits[Number(digit)]);
}
