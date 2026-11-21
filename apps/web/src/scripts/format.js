/* ============================================================
   فلزنگار — قالب‌بندی اعداد فارسی
   ============================================================ */

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function toFaDigits(str) {
  return String(str).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/** عدد یا رشته عددی را با جداکننده هزارگان و ارقام فارسی برمی‌گرداند. */
export function formatFaNumber(value) {
  const raw = String(value ?? '').trim();
  if (!/^[-+]?\d+(?:\.\d+)?$/.test(raw)) return '۰';
  const negative = raw.startsWith('-');
  const [integerPart, fractionPart = ''] = raw.replace(/^[-+]/, '').split('.');
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  const fraction = fractionPart.replace(/0+$/, '');
  let out = `${grouped}${fraction ? `٫${fraction}` : ''}`;
  if (negative) out = '−' + out;
  return toFaDigits(out);
}

export function formatMoney(value) {
  return formatFaNumber(Math.round(Number(value) || 0));
}

export function formatWeight(value, unit) {
  return `${formatFaNumber(Number(value) || 0)} ${unit || ''}`.trim();
}

/** محاسبه ضرب دو عدد اعشاری با گردکردن Half-Up (نمایشی — همان قرارداد سرویس‌ها) */
export function multiplyHalfUp(weightValue, priceValue) {
  const parse = (v) => {
    const raw = String(v ?? '').trim();
    if (!/^\d+(?:\.\d+)?$/.test(raw)) return null;
    const [intPart, fracPart = ''] = raw.split('.');
    return { units: BigInt(intPart + fracPart), scale: fracPart.length };
  };
  const w = parse(weightValue);
  const p = parse(priceValue);
  if (!w || !p) return null;
  const divisor = 10n ** BigInt(w.scale + p.scale);
  const numerator = w.units * p.units;
  return Number((numerator + divisor / 2n) / divisor);
}
