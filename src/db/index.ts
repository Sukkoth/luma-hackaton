import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/luma_db";

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const conn =
  globalForDb.conn ??
  postgres(connectionString, {
    max: 10,
  });

if (!globalForDb.conn) {
  globalForDb.conn = conn;
}

export const db = drizzle(conn, { schema });

export * from "./schema";
