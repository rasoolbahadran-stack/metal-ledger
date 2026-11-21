# معماری سامانه فلزنگار

## مرزبندی مسئولیت‌ها

### Astro — رابط کاربری
- مسئول رندر رابط کاربری، صفحات عمومی و نسخه نمایشی است.
- از Tailwind CSS برای ساخت Design System استفاده می‌کند.
- در نسخه GitHub Pages به‌صورت Static Output ساخته می‌شود.
- در اتصال عملیاتی، داده‌ها را صرفاً از API احراز هویت‌شده Next.js دریافت می‌کند؛ هیچ کلید محرمانه یا منطق مالی در مرورگر قرار نمی‌گیرد.

### Next.js — لایه Backend / API
- مسئول احراز هویت، Session، کنترل دسترسی و APIهای خصوصی است.
- اعتبارسنجی و محاسبات مالی در سمت سرور انجام می‌شود.
- عملیات ثبت سند در تراکنش دیتابیس و همراه با Audit Log اجرا می‌شود.
- رابط Astro نباید مستقیماً به دیتابیس متصل شود.

### PostgreSQL + Prisma
- PostgreSQL منبع اصلی داده‌های عملیاتی است.
- وزن، نرخ و مبلغ با Decimal/Numeric نگهداری می‌شوند؛ نه Float/Double.
- رکوردهای دفتر وزنی و مالی append-only هستند.
- تغییرات روی اسناد قطعی با سند برگشت/اصلاح جبران می‌شود.

## جریان داده

```text
Browser (Astro)
      │ HTTPS + Session Cookie
      ▼
Next.js Route Handlers
      │ 1) authenticate
      │ 2) authorize each request
      │ 3) validate payload (Zod)
      │ 4) domain service
      ▼
Prisma Client + PostgreSQL
      ├── Trade / Payment / Delivery documents
      ├── WeightLedgerEntry
      ├── FinancialLedgerEntry
      └── AuditLog
```

## محدوده دسترسی
- `ADMIN`: مدیریت مشتری، محصول، قیمت و اسناد.
- `CUSTOMER`: فقط مشاهده داده‌های مرتبط با `customerId` متصل به هویت خودش.
- در هر درخواست، دسترسی سمت سرور بررسی می‌شود؛ پنهان‌کردن منو یا کنترل سمت مرورگر به‌تنهایی امنیت محسوب نمی‌شود.
- حالت پیش‌فرض رد دسترسی است. مشتری نباید بتواند با تغییر شناسه URL یا Payload، داده مشتری دیگر را ببیند.

## سیاست ثبت اطلاعات مالی
هر عملیات اثرگذار باید در یک تراکنش دیتابیس شامل سند اصلی، ردیف دفتر وزنی/مالی و Audit Log ثبت شود. اگر هر بخش شکست بخورد، کل تراکنش Rollback می‌شود. سند Posted حذف فیزیکی یا ویرایش مستقیم نمی‌شود؛ برای اصلاح، سند معکوس و سند جایگزین ثبت می‌شود.

## GitHub Pages
GitHub Pages فقط Static Assets را سرو می‌کند و محیط اجرای Node.js، Next.js Route Handler یا دیتابیس نیست. بنابراین مقصد آن فقط نسخه Astro Demo است. در Workflow، `PUBLIC_BASE_PATH` با نام Repository تنظیم شده تا مسیر Project Pages درست ساخته شود.
