import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";

let authInstance: ReturnType<typeof betterAuth> | null = null;

/**
 * Retrieves or initializes the authentication instance using better-auth library.
 * Uses Drizzle ORM with PostgreSQL.
 */
export function getAuth() {
  if (!authInstance) {
    const allowedOrigins = process.env.CLIENT_URL?.split(',').map(url => url.trim()) || ['http://localhost:5173'];
    
    console.log('=== Better Auth Configuration ===');
    console.log('CLIENT_URL env variable:', process.env.CLIENT_URL);
    console.log('Trusted origins:', allowedOrigins);
    console.log('=================================');
    
    authInstance = betterAuth({
      database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
          user: schema.user,
          session: schema.session,
          account: schema.account,
          verification: schema.verification,
        },
      }),
      secret: process.env.AUTH_SECRET,
      baseURL: process.env.API_URL || "http://localhost:3000",
      basePath: "/api/auth",
      emailAndPassword: {
        enabled: true,
      },
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      },
      trustedOrigins: allowedOrigins,
      advanced: {
        crossSubDomainCookies: {
          enabled: true,
          domain: ".popaty.com",
        },
        defaultCookieAttributes: {
          sameSite: "lax",
          secure: true, // ✅ Must be true for HTTPS
          httpOnly: true,
        },
      },
    });
  }
  return authInstance;
}