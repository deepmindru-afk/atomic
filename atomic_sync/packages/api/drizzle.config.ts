import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "packages/api/src/db/schema.ts",
  out: "packages/api/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
