import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { after } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendPasswordResetEmail } from "@/lib/email";

const trustedOrigins = [
  "http://localhost:3000",
  "http://localhost:4040",
  ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS
    ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",").map((o) => o.trim())
    : []),
];

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins,
  rateLimit: {
    enabled: false,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  user: {
    fields: {
      emailVerified: "emailVerifiedAt",
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }) => {
      const resetUrl =
        url ||
        `${process.env.BETTER_AUTH_URL || ""}/reset-password?token=${token}`;
      try {
        after(async () => {
          await sendPasswordResetEmail({
            to: user.email,
            url: resetUrl,
            userName: user.name,
          });
        });
      } catch {
        void sendPasswordResetEmail({
          to: user.email,
          url: resetUrl,
          userName: user.name,
        });
      }
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
      requireLocalEmailVerified: false,
      updateUserInfoOnLink: true,
    },
  },
  onAPIError: {
    errorURL: "/login",
  },
  socialProviders: {
    google: {
      clientId:
        process.env.GOOGLE_CLIENT_ID || "mock-google-client-id-for-tests",
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET ||
        "mock-google-client-secret-for-tests",
    },
    github: {
      clientId:
        process.env.GITHUB_CLIENT_ID || "mock-github-client-id-for-tests",
      clientSecret:
        process.env.GITHUB_CLIENT_SECRET ||
        "mock-github-client-secret-for-tests",
    },
  },
});
