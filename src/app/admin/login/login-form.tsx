"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { cx, ui } from "@/components/admin/ui";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const next = useSearchParams().get("next") ?? "";
  const [state, action, pending] = useActionState<LoginState, FormData>(login, null);

  return (
    <form action={action} className={cx(ui.panel, "mt-8 space-y-5 p-6")} noValidate>
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className={ui.label}>
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state?.email ?? ""}
          className={cx(ui.input, "mt-1.5")}
        />
      </div>
      <div>
        <label htmlFor="password" className={ui.label}>
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={cx(ui.input, "mt-1.5")}
          aria-describedby={state?.error ? "login-error" : undefined}
        />
      </div>
      {state?.error && (
        <p id="login-error" role="alert" className="rounded-md bg-a-danger-soft px-3 py-2 text-sm text-a-danger">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={cx(ui.btn, ui.primary, "w-full")}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
