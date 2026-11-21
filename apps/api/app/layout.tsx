import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "فلزنگار | سامانه مدیریت معاملات فلزات",
  description: "هسته عملیاتی و پرتال سامانه فلزنگار",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
