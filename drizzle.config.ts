import type { Config } from "drizzle-kit";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./src/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config; 