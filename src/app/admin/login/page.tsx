import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="font-serif text-[2.25rem] leading-none font-medium tracking-[-0.03em]">Fest Decor</p>
        <h1 className="mt-2 text-a-muted">Painel da equipe</h1>
        <Suspense>
          <LoginForm />
        </Suspense>
        <Link href="/" className="mt-8 inline-block text-sm text-a-muted underline underline-offset-4 hover:text-a-ink">
          Voltar ao site
        </Link>
      </div>
    </main>
  );
}
