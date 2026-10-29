/**
 * Cria (ou redefine a senha de) uma administradora.
 *   npm run admin:create -- --email ana@festdecor.com.br --name "Ana" --password "senha-forte-aqui"
 * Sem --password, a senha é lida da variável ADMIN_PASSWORD (evita que fique no histórico do terminal).
 */
import { parseArgs } from "node:util";
import { hashPassword, PASSWORD_MIN_LENGTH } from "../src/lib/auth/password";
import { client, db, schema } from "./db";
import { eq } from "drizzle-orm";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    name: { type: "string" },
    password: { type: "string" },
  },
});

const email = values.email?.trim().toLowerCase();
const name = values.name?.trim() || "Administradora";
const password = values.password ?? process.env.ADMIN_PASSWORD;

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Informe um e-mail válido com --email.");
  process.exit(1);
}
if (!password || password.length < PASSWORD_MIN_LENGTH) {
  console.error(`Informe uma senha com pelo menos ${PASSWORD_MIN_LENGTH} caracteres (--password ou ADMIN_PASSWORD).`);
  process.exit(1);
}

const passwordHash = await hashPassword(password);
const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email));

if (existing) {
  await db.update(schema.users).set({ passwordHash, name }).where(eq(schema.users.id, existing.id));
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, existing.id));
  console.log(`Senha de ${email} redefinida (sessões anteriores encerradas).`);
} else {
  await db.insert(schema.users).values({ email, name, passwordHash });
  console.log(`Administradora ${email} criada.`);
}
await client.end();
