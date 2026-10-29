import { migrate } from "drizzle-orm/postgres-js/migrator";
import { client, db } from "./db";

await migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migrações aplicadas.");
await client.end();
