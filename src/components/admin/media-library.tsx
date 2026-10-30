"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { deleteMedia, updateMedia, type ActionResult } from "@/app/admin/actions";
import { ConfirmButton } from "./confirm-dialog";
import { uploadImage } from "./upload";
import { cx, ui } from "./ui";

export type LibraryItem = {
  id: string;
  filename: string;
  width: number;
  height: number;
  size: number;
  alt: string;
  credit: string | null;
  usage: number;
  external?: boolean;
};

function formatSize(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export function Uploader() {
  const router = useRouter();
  const [pending, setPending] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    setPending(list.length);
    let ok = 0;
    for (const file of list) {
      try {
        await uploadImage(file);
        ok++;
      } catch (e) {
        toast.error(`${file.name}: ${e instanceof Error ? e.message : "falha no envio"}`);
      } finally {
        setPending((n) => n - 1);
      }
    }
    if (ok) toast.success(ok === 1 ? "Imagem enviada." : `${ok} imagens enviadas.`);
    if (input.current) input.current.value = "";
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className={cx(ui.btn, ui.primary, "cursor-pointer focus-within:outline-2 focus-within:outline-a-accent")}>
        Enviar imagens
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          onChange={(e) => onFiles(e.target.files)}
          aria-describedby="upload-hint"
        />
      </label>
      <span id="upload-hint" className="text-sm text-a-muted" role="status">
        {pending > 0 ? `Enviando ${pending}…` : "JPG, PNG, WebP ou AVIF, até 15 MB."}
      </span>
    </div>
  );
}

function MediaCard({ item }: { item: LibraryItem }) {
  const router = useRouter();
  const [state, action, saving] = useActionState<ActionResult | null, FormData>(updateMedia, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Salvo.");
      router.refresh();
    } else toast.error(state.message ?? Object.values(state.errors ?? {})[0] ?? "Erro ao salvar.");
  }, [state, router]);

  return (
    <li className={cx(ui.panel, "overflow-hidden")}>
      <div className="relative aspect-[4/3] bg-a-bg">
        <Image
          src={`/media/${item.id}`}
          alt={item.alt}
          fill
          sizes="(min-width: 1024px) 260px, 50vw"
          unoptimized={item.external}
          className="object-cover"
        />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          startTransition(() => action(data));
        }}
        className="space-y-3 p-3"
      >
        <input type="hidden" name="id" value={item.id} />
        <p className="truncate text-[13px] text-a-muted" title={item.filename}>
          {item.filename} · {item.width}×{item.height} · {item.external ? "Instagram" : formatSize(item.size)}
        </p>
        <div>
          <label htmlFor={`alt-${item.id}`} className="text-[13px] font-medium">
            Descrição da imagem
          </label>
          <input id={`alt-${item.id}`} name="alt" defaultValue={item.alt} maxLength={200} placeholder="O que aparece na foto" className={cx(ui.input, "mt-1 min-h-9 text-sm")} />
        </div>
        <div>
          <label htmlFor={`credit-${item.id}`} className="text-[13px] font-medium">
            Crédito
          </label>
          <input id={`credit-${item.id}`} name="credit" defaultValue={item.credit ?? ""} maxLength={200} placeholder="Ex.: Foto: Nome do fotógrafo" className={cx(ui.input, "mt-1 min-h-9 text-sm")} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <button type="submit" disabled={saving} className={cx(ui.btn, ui.secondary, "min-h-9 px-3")}>
            {saving ? "Salvando…" : "Salvar"}
          </button>
          {item.usage > 0 ? (
            <span className="text-[13px] text-a-muted">
              Em {item.usage} {item.usage === 1 ? "projeto" : "projetos"}
            </span>
          ) : (
            <ConfirmButton
              label="Excluir"
              title="Excluir esta imagem?"
              description="Ela não está em nenhum projeto. Esta ação não pode ser desfeita."
              confirmLabel="Excluir imagem"
              action={() => deleteMedia(item.id)}
              className={cx(ui.btn, ui.ghost, "min-h-9 px-3 text-a-danger")}
            />
          )}
        </div>
      </form>
    </li>
  );
}

export function MediaGrid({ items }: { items: LibraryItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg bg-a-panel px-5 py-10 text-center text-a-muted ring-1 ring-a-line">
        Nenhuma imagem ainda. As imagens enviadas aqui ficam disponíveis para qualquer projeto.
      </p>
    );
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <MediaCard key={`${item.id}-${item.alt}-${item.credit}`} item={item} />
      ))}
    </ul>
  );
}
