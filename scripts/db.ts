import "./load-env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { databaseUrl } from "../src/db/url";

export const client = postgres(databaseUrl(), {
  max: 1,
  prepare: process.env.DATABASE_PREPARE !== "false",
  onnotice: () => {},
});
export const db = drizzle(client, { schema });
export { schema };
