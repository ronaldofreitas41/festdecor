"use server";

import { and, eq, gt, lt, or, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation";

export type LoginState = { error?: string; email?: string } | null;

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS_PER_EMAIL = 5;
const MAX_FAILS_PER_IP = 20;

// Hash válido de uma senha aleatória: mantém o tempo de resposta igual quando o e-mail não existe.
const DUMMY_HASH =
  "scrypt$32768$8$1$c2FsdC1maXhvLWZlc3RkZWNvcg$Gk5xN9tQkqXh0rC3dVbJm2wqf7lQnU8yZ1sA6pE4oRtW3vYiKjHgFdSaQwErTyUiOpLkJhGfDsAzXcVbNmQ1";

async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim().slice(0, 64);
}

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
  const typedEmail = String(form.get("email") ?? "").slice(0, 200);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", email: typedEmail };

  const { email, password } = parsed.data;
  const ip = await clientIp();
  const since = new Date(Date.now() - WINDOW_MS);
  const { loginAttempts: la } = schema;

  const [fails] = await db
    .select({
      byEmail: sql<number>`count(*) filter (where ${la.email} = ${email})::int`,
      byIp: sql<number>`count(*) filter (where ${la.ip} = ${ip})::int`,
    })
    .from(la)
    .where(and(eq(la.success, false), gt(la.createdAt, since), or(eq(la.email, email), eq(la.ip, ip))));

  if ((fails?.byEmail ?? 0) >= MAX_FAILS_PER_EMAIL || (fails?.byIp ?? 0) >= MAX_FAILS_PER_IP) {
    return { error: "Muitas tentativas. Aguarde 15 minutos e tente de novo.", email };
  }

  const [user] = await db
    .select({ id: schema.users.id, passwordHash: schema.users.passwordHash })
    .from(schema.users)
    .where(eq(schema.users.email, email));
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  await db.insert(la).values({ email, ip, success: Boolean(user && valid) });
  // Mantém a tabela pequena.
  await db.delete(la).where(lt(la.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));

  if (!user || !valid) return { error: "E-mail ou senha incorretos.", email };

  await createSession(user.id);
  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
