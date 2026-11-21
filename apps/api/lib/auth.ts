import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { admin } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";

const secret = process.env.BETTER_AUTH_SECRET;
if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32)) {
  throw new Error("BETTER_AUTH_SECRET must be configured with at least 32 characters in production.");
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.WEB_APP_ORIGIN].filter((value): value is string => Boolean(value)),
  plugins: [admin({ defaultRole: "user", adminRoles: ["admin"] })],
  emailAndPassword: {
    enabled: true,
    disableSignUp: process.env.ALLOW_PUBLIC_SIGNUP !== "true",
  },
  user: {
    additionalFields: {
      customerId: { type: "string", required: false, input: false },
      isActive: { type: "boolean", required: false, defaultValue: true, input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
});
