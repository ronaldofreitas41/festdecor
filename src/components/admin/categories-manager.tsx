"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { deleteCategory, saveCategory, type ActionResult } from "@/app/admin/actions";
import { ConfirmButton } from "./confirm-dialog";
import { cx, ui } from "./ui";

type Category = { id: string; name: string; projectCount: number };

function useSaved(state: ActionResult | null, onOk?: () => void) {
  const router = useRouter();
  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Salvo.");
      onOk?.();
      router.refresh();
    } else if (state.message) toast.error(state.message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}

function submitWith(action: (fd: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
}

function Row({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(saveCategory, null);
  useSaved(state, () => setEditing(false));

  if (editing) {
    return (
      <li className="px-4 py-3">
        <form onSubmit={submitWith(action)} className="flex flex-wrap items-start gap-2">
          <input type="hidden" name="id" value={category.id} />
          <div className="min-w-48 flex-1">
            <label htmlFor={`cat-${category.id}`} className="sr-only">
              Nome da categoria
            </label>
            <input
              id={`cat-${category.id}`}
              name="name"
              defaultValue={category.name}
              autoFocus
              maxLength={60}
              aria-invalid={Boolean(state?.errors?.name)}
              className={ui.input}
            />
            {state?.errors?.name && <p className={ui.error}>{state.errors.name}</p>}
          </div>
          <button type="submit" disabled={pending} className={cx(ui.btn, ui.primary)}>
            Salvar
          </button>
          <button type="button" onClick={() => setEditing(false)} className={cx(ui.btn, ui.secondary)}>
            Cancelar
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{category.name}</p>
        <p className="text-[13px] text-a-muted">
          {category.projectCount} {category.projectCount === 1 ? "projeto" : "projetos"}
        </p>
      </div>
      <button type="button" onClick={() => setEditing(true)} className={cx(ui.btn, ui.ghost)}>
        Renomear
      </button>
      <ConfirmButton
        label="Excluir"
        title={`Excluir a categoria “${category.name}”?`}
        description={
          category.projectCount > 0
            ? `${category.projectCount} ${category.projectCount === 1 ? "projeto ficará" : "projetos ficarão"} sem categoria. Os projetos não são excluídos.`
            : "Nenhum projeto usa esta categoria."
        }
        confirmLabel="Excluir categoria"
        action={() => deleteCategory(category.id)}
      />
    </li>
  );
}

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const form = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(saveCategory, null);
  useSaved(state, () => form.current?.reset());

  return (
    <div className="space-y-6">
      <form ref={form} onSubmit={submitWith(action)} className={cx(ui.panel, "flex flex-wrap items-end gap-3 p-4")}>
        <div className="min-w-56 flex-1">
          <label htmlFor="new-category" className={ui.label}>
            Nova categoria
          </label>
          <input id="new-category" name="name" maxLength={60} placeholder="Ex.: Chá revelação" aria-invalid={Boolean(state?.errors?.name)} className={cx(ui.input, "mt-1.5")} />
          {state?.errors?.name && <p className={ui.error}>{state.errors.name}</p>}
        </div>
        <button type="submit" disabled={pending} className={cx(ui.btn, ui.primary)}>
          Adicionar
        </button>
      </form>
      {categories.length === 0 ? (
        <p className="text-a-muted">Nenhuma categoria. Crie a primeira acima.</p>
      ) : (
        <ul className={cx(ui.panel, "divide-y divide-a-line")}>
          {categories.map((c) => (
            <Row key={c.id} category={c} />
          ))}
        </ul>
      )}
    </div>
  );
}
