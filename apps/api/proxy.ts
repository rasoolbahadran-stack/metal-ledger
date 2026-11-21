import { NextRequest, NextResponse } from "next/server";

const CORS_HEADERS = [
  ["Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS"],
  ["Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With"],
  ["Access-Control-Allow-Credentials", "true"],
  ["Access-Control-Max-Age", "86400"],
] as const;

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowedOrigin = process.env.WEB_APP_ORIGIN;
  const isApi = request.nextUrl.pathname.startsWith("/api/");

  if (isApi && request.method === "OPTIONS") {
    if (!origin || !allowedOrigin || origin !== allowedOrigin) {
      return new NextResponse(null, { status: 403 });
    }
    const response = new NextResponse(null, { status: 204 });
    response.headers.set("Access-Control-Allow-Origin", origin);
    for (const [key, value] of CORS_HEADERS) response.headers.set(key, value);
    response.headers.set("Vary", "Origin");
    return response;
  }

  const response = NextResponse.next();
  if (isApi && origin && allowedOrigin && origin === allowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    for (const [key, value] of CORS_HEADERS) response.headers.set(key, value);
    response.headers.set("Vary", "Origin");
  }
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
