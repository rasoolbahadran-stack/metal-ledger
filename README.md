# فلزنگار | Metal Ledger

سامانه فارسی‌زبان مدیریت معاملات فلزات، حساب وزنی مشتریان و دفتر مالی. این Repository برای دو خروجی جدا طراحی شده است:

1. **نسخه نمایشی عمومی (Astro):** رابط کاربری تعاملی با داده‌های کاملاً نمونه و بدون اتصال به دیتابیس یا قیمت زنده؛ قابل انتشار روی GitHub Pages.
2. **هسته عملیاتی (Next.js API):** زیرساخت Backend، احراز هویت، مدل PostgreSQL/Prisma و سرویس‌های ثبت سند. این قسمت روی GitHub Pages اجرا نمی‌شود و به یک محیط Node.js و PostgreSQL نیاز دارد.

> **هشدار مهم:** نسخه نمایشی، نرم‌افزار مالی عملیاتی نیست. اعداد، نام‌ها، نمودارها و رویدادهای آن صرفاً داده نمونه برای نمایش UI هستند. هیچ API قیمت زنده، دیتابیس متصل، حساب کاربری واقعی یا اطلاعات مشتری واقعی در این نسخه تنظیم نشده است.

## فناوری‌ها

- Astro 7 + TypeScript + Tailwind CSS 4 — رابط کاربری و خروجی استاتیک
- Next.js 16 + TypeScript — Backend و API
- PostgreSQL + Prisma ORM 7 — پایگاه داده رابطه‌ای و مقادیر Decimal دقیق
- Better Auth — احراز هویت مبتنی بر Session
- Zod — اعتبارسنجی ورودی‌های API
- GitHub Actions + GitHub Pages — انتشار فقط نسخه استاتیک نمایشی

## ساختار Repository

```text
metal-ledger/
├── apps/
│   ├── web/                        # Astro static showcase (GitHub Pages)
│   │   └── src/
│   │       ├── assets/fonts/       # Vazirmatn self-hosted (بدون CDN خارجی)
│   │       ├── components/panel/   # کامپوننت‌های پنل (Sidebar، Topbar، نماها، مودال‌ها)
│   │       ├── pages/
│   │       │   ├── index.astro     # وب‌سایت معرفی عمومی (/)
│   │       │   ├── app/index.astro # پنل نمایشی (/app/)
│   │       │   └── 404.astro       # صفحه ۴۰۴
│   │       ├── scripts/            # app.js، demo-data.js، format.js، landing.js
│   │       └── styles/             # tokens، base، components، app، landing
│   └── api/                 # Next.js API + Prisma schema
│       ├── app/api/
│       ├── lib/
│       ├── prisma/
│       └── src/
│           ├── domain/
│           └── services/
├── docs/                    # معماری، قواعد حسابداری، API، وضعیت پیاده‌سازی و بازطراحی
├── infra/                   # Docker Compose برای PostgreSQL توسعه
└── .github/workflows/       # انتشار Astro روی GitHub Pages
```

### مسیرهای نسخه نمایشی

| مسیر | محتوا |
|---|---|
| `/` | وب‌سایت معرفی عمومی محصول |
| `/app/` | نسخه نمایشی پنل مدیریت (۱۱ ماژول با داده کاملاً نمونه) |

لینک‌های داخلی با `BASE_URL` ساخته می‌شوند و با `PUBLIC_BASE_PATH` در Workflow سازگارند. جزئیات ممیزی و تصمیم‌های طراحی نسخه ۰.۲ در `docs/REDESIGN_NOTES.md` آمده است.

## اجرای محلی

نیازمندی‌ها: Node.js 22.12 یا بالاتر، npm و برای Backend یک PostgreSQL واقعی.

```bash
cp apps/api/.env.example apps/api/.env
docker compose -f infra/docker-compose.yml up -d
npm install
npm run db:generate
npm run db:migrate
```

سپس در دو ترمینال:

```bash
npm run dev:api
npm run dev:web
```

نسخه نمایشی Astro در `http://localhost:4321` و API/پرتال Next.js در `http://localhost:3000` باز می‌شوند. وضعیت API در `http://localhost:3000/api/health` قابل بررسی است. فایل محیطی را با Secret واقعی تکمیل کنید؛ هیچ Credential واقعی نباید Commit شود.

اسکریپت Provisioning امن برای ایجاد مدیر اولیه هنوز پیاده‌سازی و آزمون نشده است؛ تا تکمیل آن، Backend را برای معاملات واقعی فعال نکنید. ثبت‌نام عمومی به‌صورت پیش‌فرض غیرفعال است. جزئیات در `docs/DEPLOYMENT.md` آمده است.

## انتشار نسخه نمایشی با GitHub Pages

1. مخزن عمومی `rasoolbahadran-stack/metal-ledger` ساخته شده است.
2. در Settings → Pages، گزینه **GitHub Actions** را به‌عنوان Source انتخاب کنید.
3. پس از Push شدن فایل‌های پروژه روی شاخه `main`، Workflow موجود در `.github/workflows/github-pages.yml` خروجی استاتیک Astro را Build و منتشر می‌کند.

لینک مورد انتظار بعد از Deploy موفق:

`https://rasoolbahadran-stack.github.io/metal-ledger/`

این URL تا اجرای موفق Workflow و فعال‌کردن GitHub Pages قابل تأیید نیست.

## تفکیک نسخه نمایشی و عملیاتی

| قابلیت | نسخه نمایشی GitHub Pages | Backend عملیاتی |
|---|---|---|
| رابط داشبورد | بله | API داده واقعی لازم دارد |
| جست‌وجو و جابه‌جایی صفحات نمایشی | بله | — |
| تغییر تم | بله | — |
| فرم‌های آزمایشی | فقط در حافظه مرورگر | باید به API متصل شوند |
| ثبت معامله واقعی | خیر | زیرساخت سرویس و دیتابیس آماده توسعه |
| حساب وزنی پایدار | خیر | مدل و قواعد پایه تعریف شده؛ نیازمند تست یکپارچه |
| بدهکار/بستانکار واقعی | خیر | دفتر معین و سرویس Posting پایه تعریف شده |
| قیمت زنده | خیر | Provider واقعی هنوز انتخاب/متصل نشده |
| خروجی PDF رسمی | خیر؛ فقط Print مرورگر | نیازمند پیاده‌سازی و تست فارسی |
| ورود مدیر/مشتری | خیر | Better Auth و نقش‌ها scaffold شده‌اند؛ نیازمند تکمیل و تست گردش ساخت حساب |

## قواعد محافظه‌کارانه فعلی

قواعد پیش‌فرض در `docs/ACCOUNTING_RULES.md` مستند شده‌اند. مهم‌ترین اصل‌ها:

- خرید مشتری از کسب‌وکار، موجودی وزنی مشتری را افزایش و بدهی مالی او را بیشتر می‌کند.
- فروش مشتری به کسب‌وکار، موجودی وزنی او را کاهش و بستانکاری مالی او را بیشتر می‌کند.
- دریافت وجه از مشتری، بدهی او را کاهش می‌دهد؛ پرداخت وجه به مشتری، بستانکاری او را کاهش می‌دهد.
- تحویل فیزیکی فلز به مشتری، موجودی وزنی او را کاهش می‌دهد و به‌تنهایی اثر مالی جدید ایجاد نمی‌کند.
- اسناد ثبت‌شده حذف فیزیکی نمی‌شوند؛ اصلاح از طریق سند معکوس و ثبت علت انجام می‌شود.

این‌ها فرض‌های اولیه برای طراحی‌اند و باید قبل از استفاده واقعی با روش حسابداری کسب‌وکار تأیید شوند.

## وضعیت

این نسخه یک **Foundation + UI Demo** است، نه سامانه آماده بهره‌برداری مالی. وضعیت دقیق بخش‌ها، محدودیت‌ها و گام‌های بعدی در `docs/IMPLEMENTATION_STATUS.md` آمده است. قرارداد مسیرهای API در `docs/API.md` و مراحل راه‌اندازی در `docs/DEPLOYMENT.md` قرار دارد.

## انتشار و سرویس‌ها

- GitHub Pages فقط نسخه استاتیک Astro را میزبانی می‌کند.
- Backend Next.js، دیتابیس PostgreSQL و فایل‌های خصوصی باید روی زیرساخت سروری مناسب مستقر شوند.
- Workflow مخزن فقط GitHub Pages را هدف می‌گیرد؛ هیچ پیکربندی یا Workflow برای Vercel وجود ندارد.
- اتصال Astro به API هنوز انجام نشده و صفحات عملیاتی Next.js از API/DB سمت سرور استفاده می‌کنند.
- PDF رسمی فارسی، API قیمت خارجی، ذخیره‌سازی فایل، idempotency، Rate Limit و تست امنیتی مستقل هنوز تکمیل نشده‌اند.
- اتصال به GitHub انجام می‌شود؛ انتشار Pages تنها پس از فعال‌سازی GitHub Actions به‌عنوان Source و موفقیت Workflow انجام خواهد شد.
