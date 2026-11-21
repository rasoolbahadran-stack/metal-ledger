import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/http-auth";
import { formatFaNumber } from "@/lib/format";

const fa = formatFaNumber;

export default async function AdminTradesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/portal");
  const trades = await prisma.trade.findMany({ include: { customer: { select: { fullName: true } }, product: { select: { name: true, baseUnit: true } } }, orderBy: { tradedAt: "desc" }, take: 100 });
  return <section style={{ background: "white", border: "1px solid #e6e9e4", borderRadius: 18, padding: 24 }}>
    <h1 style={{ marginTop: 0, fontSize: 25 }}>مدیریت معاملات</h1>
    <p style={{ color: "#809087", fontSize: 13 }}>اسناد ذخیره‌شده در پایگاه داده · حداکثر ۱۰۰ مورد اخیر</p>
    <div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 740, textAlign: "right", borderCollapse: "collapse", fontSize: 13 }}><thead><tr>{["شماره سند", "مشتری", "نوع", "محصول", "وزن", "نرخ", "مبلغ", "وضعیت"].map((v) => <th key={v} style={{ padding: 12, borderBottom: "1px solid #e8ece7", color: "#809087" }}>{v}</th>)}</tr></thead><tbody>{trades.map((trade) => <tr key={trade.id}><td style={{ padding: 12, borderBottom: "1px solid #eff1ed", fontFamily: "monospace" }}>{trade.documentNo}</td><td style={{ padding: 12, borderBottom: "1px solid #eff1ed" }}>{trade.customer.fullName}</td><td style={{ padding: 12, borderBottom: "1px solid #eff1ed" }}>{trade.kind === "CUSTOMER_BUYS_FROM_BUSINESS" ? "خرید مشتری" : "فروش مشتری"}</td><td style={{ padding: 12, borderBottom: "1px solid #eff1ed" }}>{trade.product.name}</td><td style={{ padding: 12, borderBottom: "1px solid #eff1ed" }}>{fa(trade.weight.toFixed())} {trade.product.baseUnit}</td><td style={{ padding: 12, borderBottom: "1px solid #eff1ed" }}>{fa(trade.unitPrice.toFixed())}</td><td style={{ padding: 12, borderBottom: "1px solid #eff1ed" }}>{fa(trade.totalAmount.toFixed())} {trade.currencyCode}</td><td style={{ padding: 12, borderBottom: "1px solid #eff1ed" }}>{trade.status === "POSTED" ? "قطعی" : trade.status === "REVERSED" ? "برگشت‌خورده" : "پیش‌نویس"}</td></tr>)}{!trades.length ? <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#819087" }}>معامله‌ای ثبت نشده است.</td></tr> : null}</tbody></table></div>
  </section>;
}
