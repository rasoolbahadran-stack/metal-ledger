# راهنمای اجرای محلی و استقرار

## پیش‌نیازها
- Node.js `22.12+` و npm
- Docker با Compose برای PostgreSQL محلی
- PostgreSQL 16 در محیط استقرار
- دامنه HTTPS مستقل برای API در محیط عملیاتی

## اجرای محلی
از ریشه Repository:

```bash
cp apps/api/.env.example apps/api/.env
docker compose -f infra/docker-compose.yml up -d
npm install
npm run db:generate
npm run db:migrate
npm run dev:api
```

در ترمینال دوم:

```bash
npm run dev:web
```

- رابط Astro: `http://localhost:4321`
- API و پرتال سروری: `http://localhost:3000`
- وضعیت سرویس: `GET http://localhost:3000/api/health`

`BETTER_AUTH_SECRET` را با مقدار تصادفی امن و طول حداقل ۳۲ نویسه جایگزین کنید. رمز نمونه PostgreSQL فقط برای توسعه محلی است.

## ایجاد مدیر اولیه
پس از نصب بسته‌ها، Migration را اجرا کنید. سپس نخستین مدیر را بسازید. برای تعریف ارزها، پس از ورود مدیر از `POST /api/currencies` استفاده کنید؛ ثبت معامله/پرداخت بدون ارز فعال و پیکربندی‌شده انجام نمی‌شود.

در پوشه `apps/api` و پس از تنظیم Environment اجرا کنید:

```bash
npx auth@latest create-admin --email admin@example.com --name "System Admin" --role admin
```

ایمیل و نام نمونه را با اطلاعات مدیر واقعی جایگزین کنید. گذرواژه باید در جریان CLI امن تعیین شود. هرگز ثبت‌نام عمومی را برای ایجاد مدیر فعال نکنید.

## GitHub Pages
GitHub Pages فقط خروجی استاتیک `apps/web/dist` را میزبانی می‌کند. Workflow در `.github/workflows/github-pages.yml` آن را با GitHub Actions می‌سازد. در تنظیمات Repository، Pages Source را روی GitHub Actions بگذارید.

API و PostgreSQL از طریق GitHub Pages اجرا نمی‌شوند. پس از استقرار API روی سرور HTTPS، باید تنظیم `WEB_APP_ORIGIN`، `BETTER_AUTH_URL` و سیاست Cookie/CORS برای دامنه‌های واقعی بازبینی شود. برای استفاده عملیاتی پیشنهاد می‌شود UI و API روی یک Site یا زیر دامنه‌های هم‌سیاست و با Cookie امن مستقر شوند.

## قبل از Production
- Secretها را در محیط استقرار نگهداری کنید، نه در Repository.
- TLS، پشتیبان‌گیری و بازیابی PostgreSQL را فعال و آزمایش کنید.
- Migration را در محیط کنترل‌شده اجرا کنید.
- CORS را به Originهای دقیق محدود کنید.
- سیاست `SameSite`, `Secure`, Cookie Domain و CSRF را با دامنه نهایی تنظیم کنید.
- Rate limit، Idempotency، مانیتورینگ و هشدار خطا را اضافه کنید.
- ارزیابی امنیتی مستقل و تست‌های رقابت/تکرار سند را اجرا کنید.
