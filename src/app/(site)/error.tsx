"use client";

import Link from "next/link";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="conteudo" className="px-margin pt-[clamp(4rem,10vw,9rem)]">
      <h1 className="max-w-[14ch] text-head">Algo saiu do lugar</h1>
      <p className="mt-6 max-w-[34rem] text-lead text-muted">Não conseguimos carregar esta página agora.</p>
      <div className="mt-10 flex flex-wrap items-center gap-6">
        <button type="button" onClick={reset} className="btn-primary">
          Tentar de novo
        </button>
        <Link href="/" className="link-quiet text-small">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
