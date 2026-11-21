import type { CSSProperties } from "react";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/http-auth";
import { formatFaNumber } from "@/lib/format";

const panel: CSSProperties = { background: "#fff", border: "1px solid #e6e9e4", borderRadius: 18, padding: 22, boxShadow: "0 8px 24px #1d302b08" };
const number = formatFaNumber;

export default async function AdminDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/portal");

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [customers, activeCustomers, todayTrades, todayMoney, todayWeight, latest] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { isActive: true } }),
    prisma.trade.count({ where: { tradedAt: { gte: start }, status: "POSTED" } }),
    prisma.trade.groupBy({ by: ["currencyCode"], where: { tradedAt: { gte: start }, status: "POSTED" }, _sum: { totalAmount: true } }),
    prisma.trade.groupBy({ by: ["productId"], where: { tradedAt: { gte: start }, status: "POSTED" }, _sum: { weight: true } }),
    prisma.trade.findMany({ include: { customer: { select: { fullName: true, code: true } }, product: { select: { name: true, baseUnit: true } } }, orderBy: { tradedAt: "desc" }, take: 8 }),
  ]);

  const productIds = todayWeight.map((item) => item.productId);
  const products = productIds.length
    ? await prisma.metalProduct.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, baseUnit: true } })
    : [];
  const productMap = new Map(products.map((product) => [product.id, product]));
  const moneySummary = todayMoney.length
    ? todayMoney.map((item) => `${number((item._sum.totalAmount ?? new Prisma.Decimal(0)).toFixed())} ${item.currencyCode}`).join(" · ")
    : "بدون معامله";
  const weightSummary = todayWeight.length
    ? todayWeight.map((item) => {
        const product = productMap.get(item.productId);
        return `${product?.name ?? "محصول"}: ${number((item._sum.weight ?? new Prisma.Decimal(0)).toFixed())} ${product?.baseUnit ?? "واحد"}`;
      }).join(" · ")
    : "بدون معامله";
  const cards = [
    ["کل مشتریان", number(customers), `${number(activeCustomers)} مشتری فعال`],
    ["معاملات امروز", number(todayTrades), "اسناد قطعی امروز"],
    ["گردش مالی امروز", moneySummary, "مبالغ تفکیک‌شده بر اساس ارز"],
    ["وزن معاملات امروز", weightSummary, "مقادیر تفکیک‌شده بر اساس محصول"],
  ];

  return <>
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "end", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
      <div><p style={{ color: "#8a9a91", margin: "0 0 8px", fontSize: 13 }}>نمای کلی سامانه</p><h1 style={{ fontSize: 28, margin: 0 }}>سلام، {user.name}</h1></div>
      <p style={{ margin: 0, color: "#809087", fontSize: 12 }}>اطلاعات این صفحه مستقیماً از پایگاه داده خوانده می‌شود.</p>
    </div>
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 16, marginBottom: 24 }}>
      {cards.map(([label, value, detail]) => <article key={label} style={panel}><p style={{ margin: 0, color: "#809087", fontSize: 13 }}>{label}</p><strong style={{ display: "block", fontSize: value.length > 28 ? 15 : value.length > 18 ? 19 : 28, lineHeight: 1.9, overflowWrap: "anywhere", margin: "16px 0 8px", fontVariantNumeric: "tabular-nums" }}>{value}</strong><small style={{ color: "#8d9a93" }}>{detail}</small></article>)}
    </section>
    <section style={panel}>
      <h2 style={{ margin: "0 0 18px", fontSize: 18 }}>آخرین معاملات ثبت‌شده</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 680, borderCollapse: "collapse", textAlign: "right", fontSize: 13 }}>
          <thead><tr>{["شماره سند", "مشتری", "محصول", "نوع", "وزن", "مبلغ / ارز", "تاریخ"].map((item) => <th key={item} style={{ padding: 13, color: "#7f8e85", borderBottom: "1px solid #e9ece7", fontWeight: 500 }}>{item}</th>)}</tr></thead>
          <tbody>{latest.map((trade) => <tr key={trade.id}>
            <td style={{ padding: 13, borderBottom: "1px solid #f0f2ee", fontFamily: "monospace" }}>{trade.documentNo}</td>
            <td style={{ padding: 13, borderBottom: "1px solid #f0f2ee" }}>{trade.customer.fullName}</td>
            <td style={{ padding: 13, borderBottom: "1px solid #f0f2ee" }}>{trade.product.name}</td>
            <td style={{ padding: 13, borderBottom: "1px solid #f0f2ee" }}>{trade.kind === "CUSTOMER_BUYS_FROM_BUSINESS" ? "خرید مشتری" : "فروش مشتری"}</td>
            <td style={{ padding: 13, borderBottom: "1px solid #f0f2ee" }}>{number(trade.weight.toFixed())} {trade.product.baseUnit}</td>
            <td style={{ padding: 13, borderBottom: "1px solid #f0f2ee" }}>{number(trade.totalAmount.toFixed())} {trade.currencyCode}</td>
            <td style={{ padding: 13, borderBottom: "1px solid #f0f2ee" }}>{new Intl.DateTimeFormat("fa-IR", { dateStyle: "short" }).format(trade.tradedAt)}</td>
          </tr>)}
          {!latest.length ? <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#809087" }}>هنوز معامله‌ای ثبت نشده است.</td></tr> : null}</tbody>
        </table>
      </div>
    </section>
  </>;
}
