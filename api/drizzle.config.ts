import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import { existsSync } from "fs";

// Default: repo root .env — Fallback: api/.env
const rootEnv = "../.env";
const localEnv = ".env";
dotenv.config({ path: existsSync(rootEnv) ? rootEnv : localEnv, override: true });

export default defineConfig({
  schema: "./src/core/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});