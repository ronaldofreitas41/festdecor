"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/app/admin/actions";
import { cx, ui } from "./ui";

/** Executa uma action, mostra o retorno e atualiza a tela. */
export function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  function run(action: () => Promise<ActionResult>, onDone?: (r: ActionResult) => void) {
    start(async () => {
      try {
        const result = await action();
        if (result.ok) toast.success(result.message ?? "Salvo.");
        else toast.error(result.message ?? "Não foi possível concluir.");
        onDone?.(result);
        router.refresh();
      } catch {
        toast.error("Sem conexão com o servidor. Tente de novo.");
      }
    });
  }
  return { run, pending };
}

/** Botão que pede confirmação antes de uma ação destrutiva. */
export function ConfirmButton({
  label,
  title,
  description,
  confirmLabel,
  action,
  className,
}: {
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  action: () => Promise<ActionResult>;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { run, pending } = useAction();

  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className={className ?? cx(ui.btn, ui.ghost, "text-a-danger")}>
        {label}
      </button>
      <dialog
        ref={ref}
        aria-labelledby="confirm-title"
        className="m-auto w-[min(92vw,28rem)] rounded-lg bg-a-panel p-0 text-a-ink shadow-xl backdrop:bg-black/40"
      >
        <div className="p-6">
          <h2 id="confirm-title" className="text-lg font-medium">
            {title}
          </h2>
          <p className="mt-2 text-a-muted">{description}</p>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => ref.current?.close()} className={cx(ui.btn, ui.secondary)} autoFocus>
              Cancelar
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(action, () => ref.current?.close())}
              className={cx(ui.btn, ui.danger)}
            >
              {pending ? "Excluindo…" : confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
