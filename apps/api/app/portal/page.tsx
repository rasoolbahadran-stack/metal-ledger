import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/http-auth";
import { formatFaNumber } from "@/lib/format";

export default async function CustomerPortalPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin");
  if ((user.role !== "user") || !user.customerId) redirect("/login");

  const customer = await prisma.customer.findUnique({ where: { id: user.customerId } });
  if (!customer) redirect("/login");
  const [weight, finance, trades] = await Promise.all([
    prisma.weightLedgerEntry.groupBy({ by: ["productId"], where: { customerId: customer.id }, _sum: { quantity: true } }),
    prisma.financialLedgerEntry.groupBy({ by: ["currencyCode"], where: { customerId: customer.id }, _sum: { debitAmount: true, creditAmount: true } }),
    prisma.trade.findMany({ where: { customerId: customer.id }, include: { product: true }, orderBy: { tradedAt: "desc" }, take: 6 }),
  ]);
  const products = weight.length ? await prisma.metalProduct.findMany({ where: { id: { in: weight.map((item) => item.productId) } } }) : [];
  const productMap = new Map(products.map((product) => [product.id, product]));
  const fmt = formatFaNumber;

  return <main dir="rtl" style={{ minHeight: "100vh", background: "#f4f5f0", color: "#1d302b", fontFamily: "Vazirmatn, sans-serif", padding: "40px 5vw" }}>
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <p style={{ color: "#829087", fontSize: 13 }}>حساب اختصاصی مشتری</p>
      <h1 style={{ fontSize: 28, margin: "8px 0" }}>سلام، {customer.fullName}</h1>
      <p style={{ color: "#829087", marginBottom: 28 }}>نمایش فقط اطلاعات پرونده اختصاصی شما</p>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 24 }}>
        {finance.map((item) => {
          const balance = (item._sum.debitAmount ?? new Prisma.Decimal(0)).minus(item._sum.creditAmount ?? new Prisma.Decimal(0));
          return <article key={item.currencyCode} style={{ background: "white", borderRadius: 18, padding: 22, border: "1px solid #e7ebe5" }}><p style={{ color: "#819087", fontSize: 13 }}>مانده مالی · {item.currencyCode}</p><strong style={{ fontSize: 26 }}>{fmt(balance.toFixed())}</strong><p style={{ color: "#819087", fontSize: 12 }}>{balance.gt(0) ? "بدهکار" : balance.lt(0) ? "بستانکار" : "تسویه"}</p></article>;
        })}
        {weight.map((item) => {
          const product = productMap.get(item.productId);
          return <article key={item.productId} style={{ background: "white", borderRadius: 18, padding: 22, border: "1px solid #e7ebe5" }}><p style={{ color: "#819087", fontSize: 13 }}>مانده وزنی · {product?.name ?? "محصول"}</p><strong style={{ fontSize: 26 }}>{fmt((item._sum.quantity ?? new Prisma.Decimal(0)).toFixed())}</strong><p style={{ color: "#819087", fontSize: 12 }}>{product?.baseUnit ?? "واحد پایه"}</p></article>;
        })}
      </section>
      <section style={{ background: "white", borderRadius: 18, padding: 22, border: "1px solid #e7ebe5" }}>
        <h2 style={{ fontSize: 18 }}>آخرین معاملات</h2>
        <div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 580, borderCollapse: "collapse", textAlign: "right", fontSize: 13 }}><thead><tr>{["تاریخ", "نوع", "محصول", "وزن", "مبلغ"].map((s) => <th key={s} style={{ padding: 12, color: "#819087", borderBottom: "1px solid #edf0ec" }}>{s}</th>)}</tr></thead><tbody>{trades.map((trade) => <tr key={trade.id}><td style={{ padding: 12, borderBottom: "1px solid #edf0ec" }}>{new Intl.DateTimeFormat("fa-IR", { dateStyle: "short" }).format(trade.tradedAt)}</td><td style={{ padding: 12, borderBottom: "1px solid #edf0ec" }}>{trade.kind === "CUSTOMER_BUYS_FROM_BUSINESS" ? "خرید" : "فروش"}</td><td style={{ padding: 12, borderBottom: "1px solid #edf0ec" }}>{trade.product.name}</td><td style={{ padding: 12, borderBottom: "1px solid #edf0ec" }}>{fmt(trade.weight.toFixed())} {trade.product.baseUnit}</td><td style={{ padding: 12, borderBottom: "1px solid #edf0ec" }}>{fmt(trade.totalAmount.toFixed())} {trade.currencyCode}</td></tr>)}{!trades.length ? <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "#819087" }}>هنوز معامله‌ای در حساب ثبت نشده است.</td></tr> : null}</tbody></table></div>
      </section>
    </div>
  </main>;
}
