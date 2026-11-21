import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/http-auth";
import { formatFaNumber } from "@/lib/format";

const fa = formatFaNumber;

export default async function AdminProductsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/portal");
  const products = await prisma.metalProduct.findMany({ include: { prices: { orderBy: { validAt: "desc" }, take: 1 } }, orderBy: [{ isActive: "desc" }, { name: "asc" }] });
  return <section style={{ background: "white", border: "1px solid #e6e9e4", borderRadius: 18, padding: 24 }}>
    <h1 style={{ marginTop: 0, fontSize: 25 }}>محصولات و قیمت‌ها</h1>
    <p style={{ color: "#809087", fontSize: 13 }}>محصولات تعریف‌شده و آخرین نرخ ثبت‌شده دستی</p>
    <div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 620, textAlign: "right", borderCollapse: "collapse", fontSize: 13 }}><thead><tr>{["کد", "محصول", "نوع فلز", "واحد", "دقت وزن", "آخرین قیمت", "وضعیت"].map((v) => <th key={v} style={{ padding: 12, borderBottom: "1px solid #e8ece7", color: "#809087" }}>{v}</th>)}</tr></thead><tbody>{products.map((product) => <tr key={product.id}><td style={{ padding: 12, borderBottom: "1px solid #eff1ed", fontFamily: "monospace" }}>{product.code}</td><td style={{ padding: 12, borderBottom: "1px solid #eff1ed" }}>{product.name}</td><td style={{ padding: 12, borderBottom: "1px solid #eff1ed" }}>{product.metalType}</td><td style={{ padding: 12, borderBottom: "1px solid #eff1ed" }}>{product.baseUnit}</td><td style={{ padding: 12, borderBottom: "1px solid #eff1ed" }}>{product.weightPrecision}</td><td style={{ padding: 12, borderBottom: "1px solid #eff1ed" }}>{product.prices[0] ? `${fa(product.prices[0].unitPrice.toFixed())} ${product.prices[0].currencyCode}` : "ثبت نشده"}</td><td style={{ padding: 12, borderBottom: "1px solid #eff1ed" }}>{product.isActive ? "فعال" : "غیرفعال"}</td></tr>)}{!products.length ? <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#819087" }}>محصولی تعریف نشده است.</td></tr> : null}</tbody></table></div>
  </section>;
}
