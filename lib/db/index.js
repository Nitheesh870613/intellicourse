import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

const globalForDb = globalThis;
const isProd = process.env.NODE_ENV === 'production';

if (!globalForDb._pgPool) {
  globalForDb._pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    // SSL Configuration for Production Managed Databases
    // Neon, Supabase, Railway, Render require SSL but don't provide CA certs
    // ✅ CORRECT: SSL enabled with rejectUnauthorized: false (industry standard)
    ssl: isProd
      ? { rejectUnauthorized: false }  // SSL enabled, skip CA verification (required for managed DBs)
      : false  // No SSL in local development
  });
  console.log("🔥 PostgreSQL pool initialized once");
}

if (!globalForDb._drizzleDb) {
  globalForDb._drizzleDb = drizzle(globalForDb._pgPool, { schema });
}

const pool = globalForDb._pgPool;
const db = globalForDb._drizzleDb;

async function safeQuery(fn, retries = 2) {
  try {
    return await fn();
  } catch (err) {
    if (retries > 0) return safeQuery(fn, retries - 1);
    throw err;
  }
}

export { db, pool, safeQuery };
export * from "./schema.js";