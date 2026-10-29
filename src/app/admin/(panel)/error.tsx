"use client";

import { cx, ui } from "@/components/admin/ui";

export default function PanelError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className={cx(ui.panel, "p-6")} role="alert">
      <h1 className="text-lg font-medium">Não foi possível carregar esta tela</h1>
      <p className="mt-1 text-a-muted">Verifique a conexão e tente de novo. Se continuar, a sessão pode ter expirado.</p>
      <div className="mt-4 flex gap-3">
        <button type="button" onClick={reset} className={cx(ui.btn, ui.primary)}>
          Tentar de novo
        </button>
        <a href="/admin/login" className={cx(ui.btn, ui.secondary)}>
          Entrar novamente
        </a>
      </div>
    </div>
  );
}
