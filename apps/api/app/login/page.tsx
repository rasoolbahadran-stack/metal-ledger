"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const result = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (result.error) {
      setError("ورود انجام نشد. ایمیل و گذرواژه را بررسی کنید.");
      return;
    }
    window.location.assign("/admin");
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f5f5f0", color: "#1c2c28", fontFamily: "Vazirmatn, sans-serif" }}>
      <form onSubmit={onSubmit} style={{ width: "min(100%, 420px)", background: "white", border: "1px solid #e5e8e2", borderRadius: 24, padding: 32, boxShadow: "0 20px 60px #182b2412" }}>
        <div style={{ width: 48, height: 48, display: "grid", placeItems: "center", background: "#193c33", color: "#d9b978", borderRadius: 15, fontSize: 22, fontWeight: 800 }}>ف</div>
        <h1 style={{ margin: "24px 0 8px", fontSize: 24 }}>ورود به فلزنگار</h1>
        <p style={{ color: "#718079", margin: "0 0 24px", lineHeight: 1.9 }}>با حسابی که مدیر سامانه برای شما ایجاد کرده است وارد شوید.</p>
        <label style={{ display: "block", fontSize: 13, marginBottom: 8 }}>ایمیل</label>
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="username" style={{ width: "100%", boxSizing: "border-box", padding: 14, border: "1px solid #dce3dd", borderRadius: 12, marginBottom: 18, font: "inherit" }} />
        <label style={{ display: "block", fontSize: 13, marginBottom: 8 }}>گذرواژه</label>
        <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required autoComplete="current-password" style={{ width: "100%", boxSizing: "border-box", padding: 14, border: "1px solid #dce3dd", borderRadius: 12, marginBottom: 18, font: "inherit" }} />
        {error ? <p role="alert" style={{ color: "#b13e3e", fontSize: 13 }}>{error}</p> : null}
        <button disabled={loading} type="submit" style={{ width: "100%", border: 0, borderRadius: 12, padding: 15, background: "#193c33", color: "white", font: "inherit", cursor: "pointer" }}>{loading ? "در حال ورود…" : "ورود امن"}</button>
      </form>
    </main>
  );
}
