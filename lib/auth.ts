import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
  }),
  // trustedOrigins: ["https://localhost:3000", "https://192.168.1.3:3000"],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      displayName: { type: "string" },
      publicKey: { type: "string" },
      encryptedPrivateKey: { type: "string" },
      kdfSalt: { type: "string" },
    },
  },

  plugins: [nextCookies()],
});
export type Auth = typeof auth;
