import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { databaseUrl } from "./url";

type Client = ReturnType<typeof postgres>;

// Reaproveita a conexão entre recargas do servidor de desenvolvimento.
const globalForDb = globalThis as unknown as { pgClient?: Client };

const client =
  globalForDb.pgClient ??
  postgres(databaseUrl(), {
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    prepare: process.env.DATABASE_PREPARE !== "false",
  });

if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
export { schema };
