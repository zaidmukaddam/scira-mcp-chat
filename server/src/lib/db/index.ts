import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("🔴 DATABASE_URL environment variable is not set.");
}

const client = postgres(connectionString || "", {
  max: 1,
});

export const db = drizzle(client, { schema });

export async function testConnection() {
  try {
    await client`SELECT 1`;
    console.log("🟢 Database connection successful!");
  } catch (error) {
    console.error("🔴 Database connection failed:", error);
  }
}
