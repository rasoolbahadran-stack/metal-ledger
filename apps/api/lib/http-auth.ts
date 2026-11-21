import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  if (session.user.isActive === false || session.user.banned === true) return null;
  return session.user;
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "UNAUTHENTICATED", message: "ابتدا وارد حساب شوید." }, { status: 401 }),
    };
  }
  if (user.role !== "admin") {
    return {
      user: null,
      response: NextResponse.json({ error: "FORBIDDEN", message: "دسترسی مدیر لازم است." }, { status: 403 }),
    };
  }
  return { user, response: null };
}

export async function requireCustomer() {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "UNAUTHENTICATED", message: "ابتدا وارد حساب شوید." }, { status: 401 }),
    };
  }
  if ((user.role !== "user") || !user.customerId) {
    return {
      user: null,
      response: NextResponse.json({ error: "FORBIDDEN", message: "حساب مشتری به پرونده‌ای متصل نیست." }, { status: 403 }),
    };
  }
  return { user, response: null };
}
