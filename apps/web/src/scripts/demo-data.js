/* ============================================================
   فلزنگار — داده نمونه مرکزی (Demo Data)
   همه اعداد این فایل نمایشی هستند؛ به هیچ منبع واقعی متصل نیستند.
   محاسبات مانده بر اساس docs/ACCOUNTING_RULES.md انجام می‌شود.
   ============================================================ */

export const PRODUCTS = [
  { id: 'AU18', code: 'AU-18', name: 'طلای ۱۸ عیار', metal: 'gold', unit: 'گرم', decimals: 3, refPrice: 7500000 },
  { id: 'AU24', code: 'AU-24', name: 'طلای ۲۴ عیار', metal: 'gold', unit: 'گرم', decimals: 3, refPrice: 8700000 },
  { id: 'AG999', code: 'AG-999', name: 'نقره خالص', metal: 'silver', unit: 'گرم', decimals: 3, refPrice: 82000 },
  { id: 'PT950', code: 'PT-950', name: 'پلاتین', metal: 'platinum', unit: 'گرم', decimals: 3, refPrice: 3850000 },
];

export const METAL_LABELS = { gold: 'طلا', silver: 'نقره', platinum: 'پلاتین' };

export const CUSTOMERS = [
  { id: 'CU-0128', name: 'محمدرضا احمدی', phone: '۰۹۱۲ ••• •• ۴۵', status: 'active', avatar: 'a', since: '۱۴۰۳/۰۲/۱۱' },
  { id: 'CU-0127', name: 'سارا محمدی', phone: '۰۹۱۷ ••• •• ۹۸', status: 'active', avatar: 'b', since: '۱۴۰۳/۰۳/۰۵' },
  { id: 'CU-0126', name: 'علی رضایی', phone: '۰۹۳۵ ••• •• ۳۲', status: 'active', avatar: 'c', since: '۱۴۰۳/۰۴/۲۲' },
  { id: 'CU-0125', name: 'نگار کریمی', phone: '۰۹۱۳ ••• •• ۱۱', status: 'active', avatar: 'd', since: '۱۴۰۳/۰۵/۰۹' },
  { id: 'CU-0124', name: 'امیرحسین زمانی', phone: '۰۹۱۴ ••• •• ۶۰', status: 'active', avatar: 'e', since: '۱۴۰۳/۰۵/۲۸' },
  { id: 'CU-0123', name: 'فاطمه حسینی', phone: '۰۹۱۵ ••• •• ۲۳', status: 'active', avatar: 'f', since: '۱۴۰۳/۰۶/۱۴' },
  { id: 'CU-0122', name: 'حسین قاسمی', phone: '۰۹۱۶ ••• •• ۷۷', status: 'inactive', avatar: 'a', since: '۱۴۰۳/۰۷/۰۲' },
  { id: 'CU-0121', name: 'مریم اسدی', phone: '۰۹۳۰ ••• •• ۱۵', status: 'active', avatar: 'b', since: '۱۴۰۳/۰۷/۲۰' },
  { id: 'CU-0120', name: 'رضا نادری', phone: '۰۹۱۹ ••• •• ۴۸', status: 'active', avatar: 'c', since: '۱۴۰۳/۰۸/۰۳' },
  { id: 'CU-0119', name: 'زهرا مرادی', phone: '۰۹۲۱ ••• •• ۹۴', status: 'active', avatar: 'd', since: '۱۴۰۳/۰۸/۱۲' },
  { id: 'CU-0118', name: 'محمد جوادی', phone: '۰۹۱۲ ••• •• ۳۹', status: 'inactive', avatar: 'e', since: '۱۴۰۳/۰۸/۲۱' },
  { id: 'CU-0117', name: 'لیلا فرهادی', phone: '۰۹۳۳ ••• •• ۵۶', status: 'active', avatar: 'f', since: '۱۴۰۳/۰۹/۰۱' },
];

/* نوع معامله: buy = خرید مشتری از ما (بدهکار می‌شود، وزن +)
   sell = فروش مشتری به ما (بستانکار می‌شود، وزن −) */
export const TRADES = [
  { id: 'TR-1048', day: 30, date: '۱۴۰۵/۰۸/۳۰', time: '۱۰:۴۵', customer: 'CU-0128', type: 'buy', product: 'AU18', weight: 750, price: 7500000, status: 'posted' },
  { id: 'TR-1047', day: 30, date: '۱۴۰۵/۰۸/۳۰', time: '۱۰:۱۲', customer: 'CU-0127', type: 'sell', product: 'AG999', weight: 1200, price: 82000, status: 'posted' },
  { id: 'TR-1046', day: 30, date: '۱۴۰۵/۰۸/۳۰', time: '۰۹:۵۰', customer: 'CU-0126', type: 'buy', product: 'AU24', weight: 300, price: 8700000, status: 'draft' },
  { id: 'TR-1045', day: 29, date: '۱۴۰۵/۰۸/۲۹', time: '۱۶:۲۰', customer: 'CU-0125', type: 'sell', product: 'AU18', weight: 225, price: 7500000, status: 'posted' },
  { id: 'TR-1044', day: 29, date: '۱۴۰۵/۰۸/۲۹', time: '۱۴:۳۵', customer: 'CU-0124', type: 'buy', product: 'PT950', weight: 400, price: 3850000, status: 'reversed' },
  { id: 'TR-1043', day: 29, date: '۱۴۰۵/۰۸/۲۹', time: '۱۱:۰۸', customer: 'CU-0123', type: 'buy', product: 'AU18', weight: 180, price: 7500000, status: 'posted' },
  { id: 'TR-1042', day: 28, date: '۱۴۰۵/۰۸/۲۸', time: '۱۵:۴۲', customer: 'CU-0121', type: 'buy', product: 'AU18', weight: 120, price: 7500000, status: 'posted' },
  { id: 'TR-1041', day: 28, date: '۱۴۰۵/۰۸/۲۸', time: '۱۳:۱۷', customer: 'CU-0120', type: 'buy', product: 'AG999', weight: 1500, price: 82000, status: 'posted' },
  { id: 'TR-1040', day: 27, date: '۱۴۰۵/۰۸/۲۷', time: '۱۷:۰۱', customer: 'CU-0119', type: 'buy', product: 'AU18', weight: 360, price: 7500000, status: 'posted' },
  { id: 'TR-1039', day: 27, date: '۱۴۰۵/۰۸/۲۷', time: '۱۰:۳۳', customer: 'CU-0128', type: 'sell', product: 'AU18', weight: 150, price: 7500000, status: 'posted' },
  { id: 'TR-1038', day: 26, date: '۱۴۰۵/۰۸/۲۶', time: '۱۲:۵۵', customer: 'CU-0117', type: 'buy', product: 'AU24', weight: 80, price: 8700000, status: 'posted' },
  { id: 'TR-1037', day: 26, date: '۱۴۰۵/۰۸/۲۶', time: '۰۹:۲۴', customer: 'CU-0126', type: 'sell', product: 'AU24', weight: 45, price: 8700000, status: 'posted' },
  { id: 'TR-1036', day: 25, date: '۱۴۰۵/۰۸/۲۵', time: '۱۶:۴۸', customer: 'CU-0125', type: 'buy', product: 'AU18', weight: 900, price: 7500000, status: 'posted' },
  { id: 'TR-1035', day: 24, date: '۱۴۰۵/۰۸/۲۴', time: '۱۱:۱۰', customer: 'CU-0124', type: 'sell', product: 'AU18', weight: 90, price: 7500000, status: 'draft' },
  { id: 'TR-1034', day: 23, date: '۱۴۰۵/۰۸/۲۳', time: '۰۹:۲۰', customer: 'CU-0123', type: 'buy', product: 'PT950', weight: 600, price: 3850000, status: 'posted' },
  { id: 'TR-1030', day: 22, date: '۱۴۰۵/۰۸/۲۲', time: '۱۴:۰۵', customer: 'CU-0127', type: 'buy', product: 'AG999', weight: 2200, price: 82000, status: 'posted' },
];

/* پرداخت/دریافت: receive = دریافت از مشتری (بستانکار مشتری)
   pay = پرداخت به مشتری (بدهکار مشتری) */
export const PAYMENTS = [
  { id: 'PY-0248', day: 30, date: '۱۴۰۵/۰۸/۳۰', time: '۱۰:۲۵', customer: 'CU-0128', direction: 'receive', method: 'انتقال بانکی', amount: 300000000, status: 'posted' },
  { id: 'PY-0247', day: 30, date: '۱۴۰۵/۰۸/۳۰', time: '۰۹:۱۸', customer: 'CU-0127', direction: 'pay', method: 'کارت', amount: 98400000, status: 'posted' },
  { id: 'PY-0246', day: 29, date: '۱۴۰۵/۰۸/۲۹', time: '۱۶:۴۰', customer: 'CU-0126', direction: 'receive', method: 'نقدی', amount: 120000000, status: 'draft' },
  { id: 'PY-0245', day: 29, date: '۱۴۰۵/۰۸/۲۹', time: '۱۲:۰۲', customer: 'CU-0123', direction: 'receive', method: 'انتقال بانکی', amount: 45000000, status: 'posted' },
  { id: 'PY-0244', day: 28, date: '۱۴۰۵/۰۸/۲۸', time: '۱۵:۱۱', customer: 'CU-0125', direction: 'receive', method: 'چک', amount: 85000000, status: 'posted' },
  { id: 'PY-0243', day: 27, date: '۱۴۰۵/۰۸/۲۷', time: '۱۱:۴۵', customer: 'CU-0119', direction: 'pay', method: 'انتقال بانکی', amount: 210000000, status: 'posted' },
  { id: 'PY-0242', day: 26, date: '۱۴۰۵/۰۸/۲۶', time: '۱۳:۳۰', customer: 'CU-0121', direction: 'receive', method: 'کارت', amount: 62000000, status: 'posted' },
  { id: 'PY-0241', day: 25, date: '۱۴۰۵/۰۸/۲۵', time: '۰۹:۵۵', customer: 'CU-0117', direction: 'receive', method: 'انتقال بانکی', amount: 160000000, status: 'draft' },
];

/* تحویل فیزیکی: فقط دفتر وزنی را کم می‌کند (طبق قواعد فعلی) */
export const DELIVERIES = [
  { id: 'DL-0086', day: 30, date: '۱۴۰۵/۰۸/۳۰', customer: 'CU-0128', product: 'AU18', weight: 150, status: 'posted', note: 'رسید نمایشی' },
  { id: 'DL-0085', day: 29, date: '۱۴۰۵/۰۸/۲۹', customer: 'CU-0127', product: 'AG999', weight: 800, status: 'posted', note: 'رسید نمایشی' },
  { id: 'DL-0084', day: 28, date: '۱۴۰۵/۰۸/۲۸', customer: 'CU-0126', product: 'AU24', weight: 15, status: 'posted', note: 'تحویل حضوری' },
  { id: 'DL-0083', day: 27, date: '۱۴۰۵/۰۸/۲۷', customer: 'CU-0128', product: 'AU18', weight: 20, status: 'draft', note: 'در انتظار تأیید' },
  { id: 'DL-0082', day: 26, date: '۱۴۰۵/۰۸/۲۶', customer: 'CU-0119', product: 'AU18', weight: 105, status: 'posted', note: 'رسید نمایشی' },
];

export const PRICES = [
  { product: 'AU18', price: 7500000, updated: 'امروز، ۱۰:۰۰', change: +1.4 },
  { product: 'AU24', price: 8700000, updated: 'امروز، ۱۰:۰۰', change: +1.2 },
  { product: 'AG999', price: 82000, updated: 'امروز، ۱۰:۰۰', change: -0.8 },
  { product: 'PT950', price: 3850000, updated: 'دیروز، ۱۷:۳۰', change: +0.6 },
];

export const NOTIFICATIONS = [
  { icon: 'trade', title: 'سند TR-1046 در وضعیت پیش‌نویس است', time: '۲۰ دقیقه پیش', tone: 'warning' },
  { icon: 'pay', title: 'دریافت ۳۰۰٬۰۰۰٬۰۰۰ از محمدرضا احمدی تأیید شد', time: '۱ ساعت پیش', tone: 'success' },
  { icon: 'delivery', title: 'تحویل DL-0083 در انتظار تأیید مانده وزنی', time: '۳ ساعت پیش', tone: 'info' },
  { icon: 'price', title: 'قیمت مرجع طلا به‌روزرسانی شد (نمایشی)', time: 'دیروز', tone: 'neutral' },
];

/* ---------- توابع کمکی ---------- */
export const productById = (id) => PRODUCTS.find((p) => p.id === id);
export const customerById = (id) => CUSTOMERS.find((c) => c.id === id);
export const tradeTotal = (t) => Math.round(t.weight * t.price);
export const postedTrades = () => TRADES.filter((t) => t.status === 'posted');

/* مانده مالی مشتری: بدهکار(+) − بستانکار(−) طبق قواعد سند */
export function customerFinancialBalance(customerId) {
  let debit = 0, credit = 0;
  for (const t of postedTrades()) {
    if (t.customer !== customerId) continue;
    if (t.type === 'buy') debit += tradeTotal(t); else credit += tradeTotal(t);
  }
  for (const p of PAYMENTS) {
    if (p.customer !== customerId || p.status !== 'posted') continue;
    if (p.direction === 'receive') credit += p.amount; else debit += p.amount;
  }
  return debit - credit; // مثبت = بدهکار | منفی = بستانکار | صفر = تسویه‌شده
}

/* مانده وزنی مشتری به تفکیک محصول */
export function customerWeightBalances(customerId) {
  const balances = {};
  for (const t of postedTrades()) {
    if (t.customer !== customerId) continue;
    balances[t.product] = (balances[t.product] || 0) + (t.type === 'buy' ? t.weight : -t.weight);
  }
  for (const d of DELIVERIES) {
    if (d.customer !== customerId || d.status !== 'posted') continue;
    balances[d.product] = (balances[d.product] || 0) - d.weight;
  }
  return balances;
}

/* دفتر حساب مشتری: رویدادها به ترتیب زمانی با مانده تجمعی */
export function customerStatement(customerId) {
  const events = [];
  for (const t of TRADES) {
    if (t.customer !== customerId || t.status === 'reversed') continue;
    const total = tradeTotal(t);
    events.push({
      date: t.date, day: t.day, time: t.time, ref: t.id, kind: t.type === 'buy' ? 'خرید مشتری از ما' : 'فروش مشتری به ما',
      product: productById(t.product)?.name || '—',
      weight: (t.type === 'buy' ? '+' : '−') + t.weight, debit: t.type === 'buy' ? total : null,
      credit: t.type === 'sell' ? total : null,
      weightEffect: t.type === 'buy' ? t.weight : -t.weight,
      status: t.status,
    });
  }
  for (const p of PAYMENTS) {
    if (p.customer !== customerId || p.status !== 'posted') continue;
    events.push({
      date: p.date, day: p.day, time: p.time, ref: p.id, kind: p.direction === 'receive' ? 'دریافت وجه از مشتری' : 'پرداخت وجه به مشتری',
      product: '—', weight: '—',
      debit: p.direction === 'pay' ? p.amount : null,
      credit: p.direction === 'receive' ? p.amount : null,
      weightEffect: 0, status: p.status,
    });
  }
  for (const d of DELIVERIES) {
    if (d.customer !== customerId || d.status !== 'posted') continue;
    events.push({
      date: d.date, day: d.day, time: '—', ref: d.id, kind: 'تحویل فیزیکی کالا',
      product: productById(d.product)?.name || '—', weight: '−' + d.weight,
      debit: null, credit: null, weightEffect: -d.weight, status: d.status,
    });
  }
  events.sort((a, b) => (b.day - a.day) || String(b.time).localeCompare(String(a.time), 'fa'));
  let balance = 0;
  for (const e of [...events].reverse()) {
    balance += (e.debit || 0) - (e.credit || 0);
    e.balance = balance;
  }
  return events;
}
