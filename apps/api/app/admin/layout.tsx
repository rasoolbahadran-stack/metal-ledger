import type { ReactNode } from "react";
import Link from "next/link";

const links = [
  ["نمای کلی", "/admin"],
  ["مشتریان", "/admin/customers"],
  ["معاملات", "/admin/trades"],
  ["محصولات و قیمت‌ها", "/admin/products"],
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f4f5f0", color: "#1d302b", fontFamily: "Vazirmatn, sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 4vw", background: "#183b32", color: "white" }}>
        <strong style={{ fontSize: 19 }}>فلزنگار <span style={{ color: "#d4b575", fontSize: 11, marginRight: 8 }}>مدیریت</span></strong>
        <nav style={{ display: "flex", flexWrap: "wrap", gap: 18, fontSize: 13 }}>
          {links.map(([label, href]) => <Link key={href} href={href} style={{ color: "#e8eee9", textDecoration: "none" }}>{label}</Link>)}
        </nav>
      </header>
      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "36px 4vw 64px" }}>{children}</main>
    </div>
  );
}
