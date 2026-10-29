"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect } from "react";
import { toast } from "sonner";
import { saveProject, type ActionResult } from "@/app/admin/actions";
import { ImagePicker, type PickerMedia } from "./image-picker";
import { cx, ui } from "./ui";

export type ProjectFormValues = {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  categoryId: string | null;
  location: string;
  eventDate: string | null;
  published: boolean;
  featured: boolean;
  isDemo: boolean;
  images: PickerMedia[];
};

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={ui.label}>
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && !error && (
        <p id={`${id}-hint`} className={ui.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={ui.error}>
          {error}
        </p>
      )}
    </div>
  );
}

export function ProjectForm({
  values,
  categories,
  library,
}: {
  values: ProjectFormValues;
  categories: { id: string; name: string }[];
  library: PickerMedia[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(saveProject, null);
  const e = state?.errors ?? {};
  const isNew = !values.id;

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Salvo.");
      if (isNew && state.id) router.replace(`/admin/projetos/${state.id}`);
      else router.refresh();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, isNew, router]);

  // Envio manual: evita que o React limpe os campos ao terminar a action.
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  }

  const describedBy = (name: string, hint?: boolean) => (e[name] ? `${name}-error` : hint ? `${name}-hint` : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <div className={cx(ui.panel, "grid gap-6 p-5 sm:p-6 md:grid-cols-2")}>
        <div className="md:col-span-2">
          <Field id="title" label="Título" error={e.title}>
            <input id="title" name="title" required maxLength={120} defaultValue={values.title} aria-invalid={Boolean(e.title)} aria-describedby={describedBy("title")} className={ui.input} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field id="summary" label="Descrição curta" hint="Aparece nos destaques e no portfólio. Até 240 caracteres." error={e.summary}>
            <textarea
              id="summary"
              name="summary"
              required
              rows={2}
              maxLength={240}
              defaultValue={values.summary}
              aria-invalid={Boolean(e.summary)}
              aria-describedby={describedBy("summary", true)}
              className={cx(ui.input, "py-2")}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field id="description" label="Texto completo" hint="Página do projeto. Separe parágrafos com uma linha em branco." error={e.description}>
            <textarea
              id="description"
              name="description"
              rows={6}
              maxLength={5000}
              defaultValue={values.description}
              aria-invalid={Boolean(e.description)}
              aria-describedby={describedBy("description", true)}
              className={cx(ui.input, "py-2")}
            />
          </Field>
        </div>
        <Field id="categoryId" label="Categoria" error={e.categoryId}>
          <select id="categoryId" name="categoryId" defaultValue={values.categoryId ?? ""} aria-invalid={Boolean(e.categoryId)} className={ui.input}>
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="location" label="Local" hint="Cidade ou espaço do evento." error={e.location}>
          <input id="location" name="location" maxLength={120} defaultValue={values.location} aria-describedby={describedBy("location", true)} className={ui.input} />
        </Field>
        <Field id="eventDate" label="Mês do evento" error={e.eventDate}>
          <input id="eventDate" name="eventDate" type="month" defaultValue={values.eventDate ?? ""} aria-invalid={Boolean(e.eventDate)} className={ui.input} />
        </Field>
        <Field id="slug" label="Endereço da página" hint="Deixe em branco para gerar a partir do título." error={e.slug}>
          <div className="flex items-center rounded-md bg-a-bg ring-1 ring-a-line ring-inset">
            <span className="pl-3 text-sm text-a-muted">/portfolio/</span>
            <input id="slug" name="slug" maxLength={80} defaultValue={values.slug} aria-describedby={describedBy("slug", true)} className={cx(ui.input, "ring-0")} />
          </div>
        </Field>
      </div>

      <div className={cx(ui.panel, "p-5 sm:p-6")}>
        <ImagePicker library={library} initial={values.images} error={e.imageIds} />
      </div>

      <div className={cx(ui.panel, "space-y-4 p-5 sm:p-6")}>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="published" defaultChecked={values.published} className="mt-1 size-4 accent-a-ink" />
          <span>
            <span className="font-medium">Publicado</span>
            <span className="block text-sm text-a-muted">Aparece no portfólio do site.</span>
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="featured" defaultChecked={values.featured} className="mt-1 size-4 accent-a-ink" />
          <span>
            <span className="font-medium">Destaque na página inicial</span>
            <span className="block text-sm text-a-muted">Entra no fim da lista de destaques; reordene na tela de projetos.</span>
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="isDemo" defaultChecked={values.isDemo} className="mt-1 size-4 accent-a-ink" />
          <span>
            <span className="font-medium">Conteúdo de demonstração</span>
            <span className="block text-sm text-a-muted">Mostra o aviso “projeto de demonstração” no site. Desmarque quando o projeto for real.</span>
          </span>
        </label>
      </div>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-a-line bg-a-bg/95 px-4 py-3 sm:-mx-8 sm:px-8">
        <button type="submit" disabled={pending} className={cx(ui.btn, ui.primary)}>
          {pending ? "Salvando…" : isNew ? "Criar projeto" : "Salvar alterações"}
        </button>
        <Link href="/admin" className={cx(ui.btn, ui.secondary)}>
          Voltar
        </Link>
        {values.id && values.published && (
          <Link href={`/portfolio/${values.slug}`} target="_blank" className="ml-auto text-sm text-a-muted underline underline-offset-4 hover:text-a-ink">
            Ver no site ↗
          </Link>
        )}
      </div>
    </form>
  );
}
