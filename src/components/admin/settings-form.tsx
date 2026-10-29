"use client";

import { startTransition, useActionState, useEffect } from "react";
import { toast } from "sonner";
import { saveSettings, type ActionResult } from "@/app/admin/actions";
import { cx, ui } from "./ui";

type Values = { whatsapp: string; instagram: string; email: string; phoneDisplay: string; city: string };

const FIELDS: { name: keyof Values; label: string; hint: string; type?: string; placeholder?: string; inputMode?: "numeric" }[] = [
  {
    name: "whatsapp",
    label: "WhatsApp",
    hint: "Com DDI e DDD, só números. É para onde vai o pedido de orçamento do site.",
    placeholder: "5531999999999",
    inputMode: "numeric",
  },
  { name: "instagram", label: "Instagram", hint: "Só o usuário, sem @.", placeholder: "festdecorbhmg" },
  { name: "email", label: "E-mail", hint: "Opcional. Quando preenchido, aparece em destaque no contato.", type: "email" },
  { name: "phoneDisplay", label: "Telefone exibido", hint: "Opcional. Ex.: (31) 99999-9999. Sem ele, usamos o WhatsApp." },
  { name: "city", label: "Cidade", hint: "Aparece no contato.", placeholder: "Belo Horizonte, MG" },
];

export function SettingsForm({ values }: { values: Values }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(saveSettings, null);
  const e = state?.errors ?? {};

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(state.message ?? "Salvo.");
    else if (state.message) toast.error(state.message);
  }, [state]);

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        const data = new FormData(ev.currentTarget);
        startTransition(() => action(data));
      }}
      noValidate
      className={cx(ui.panel, "max-w-2xl space-y-6 p-5 sm:p-6")}
    >
      {FIELDS.map((f) => (
        <div key={f.name}>
          <label htmlFor={f.name} className={ui.label}>
            {f.label}
          </label>
          <input
            id={f.name}
            name={f.name}
            type={f.type ?? "text"}
            inputMode={f.inputMode}
            placeholder={f.placeholder}
            defaultValue={values[f.name]}
            aria-invalid={Boolean(e[f.name])}
            aria-describedby={`${f.name}-note`}
            className={cx(ui.input, "mt-1.5")}
          />
          <p id={`${f.name}-note`} className={e[f.name] ? ui.error : ui.hint}>
            {e[f.name] ?? f.hint}
          </p>
        </div>
      ))}
      <button type="submit" disabled={pending} className={cx(ui.btn, ui.primary)}>
        {pending ? "Salvando…" : "Salvar"}
      </button>
    </form>
  );
}
