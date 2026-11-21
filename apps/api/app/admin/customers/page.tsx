import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/http-auth";

export default async function AdminCustomersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/portal");
  const customers = await prisma.customer.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return <section style={{ background: "white", border: "1px solid #e6e9e4", borderRadius: 18, padding: 24 }}>
    <h1 style={{ marginTop: 0, fontSize: 25 }}>مدیریت مشتریان</h1>
    <p style={{ color: "#809087", fontSize: 13 }}>پرونده‌های واقعی ذخیره‌شده در PostgreSQL · حداکثر ۱۰۰ مورد اخیر</p>
    <div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 600, textAlign: "right", borderCollapse: "collapse", fontSize: 13 }}><thead><tr>{["کد", "نام مشتری", "تلفن", "ایمیل", "وضعیت"].map((v) => <th key={v} style={{ padding: 12, borderBottom: "1px solid #e8ece7", color: "#809087" }}>{v}</th>)}</tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}><td style={{ padding: 12, borderBottom: "1px solid #eff1ed", fontFamily: "monospace" }}>{customer.code}</td><td style={{ padding: 12, borderBottom: "1px solid #eff1ed" }}>{customer.fullName}</td><td style={{ padding: 12, borderBottom: "1px solid #eff1ed" }}>{customer.phone ?? "—"}</td><td style={{ padding: 12, borderBottom: "1px solid #eff1ed" }}>{customer.email ?? "—"}</td><td style={{ padding: 12, borderBottom: "1px solid #eff1ed" }}>{customer.isActive ? "فعال" : "غیرفعال"}</td></tr>)}{!customers.length ? <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#819087" }}>مشتری ثبت نشده است.</td></tr> : null}</tbody></table></div>
  </section>;
}
