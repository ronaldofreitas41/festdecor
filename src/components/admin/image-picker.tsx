"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadImage } from "./upload";
import { cx, ui } from "./ui";

/** `external`: imagem de um post do Instagram (carregada direto de lá). */
export type PickerMedia = { id: string; filename: string; alt: string; width: number; height: number; external?: boolean };

/**
 * Imagens do projeto, em ordem (a primeira é a capa). Permite enviar novas
 * ou escolher da biblioteca; o formulário recebe os ids em campos ocultos.
 */
export function ImagePicker({
  library: initialLibrary,
  initial,
  error,
}: {
  library: PickerMedia[];
  initial: PickerMedia[];
  error?: string;
}) {
  const [library, setLibrary] = useState(initialLibrary);
  const [selected, setSelected] = useState(initial);
  const [uploading, setUploading] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const selectedIds = new Set(selected.map((s) => s.id));

  function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= selected.length) return;
    const next = [...selected];
    [next[index], next[target]] = [next[target], next[index]];
    setSelected(next);
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    setUploading((n) => n + list.length);
    for (const file of list) {
      try {
        const media = await uploadImage(file);
        setLibrary((l) => [media, ...l]);
        setSelected((s) => [...s, media]);
      } catch (e) {
        toast.error(`${file.name}: ${e instanceof Error ? e.message : "falha no envio"}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  function toggle(media: PickerMedia) {
    setSelected((s) => (s.some((x) => x.id === media.id) ? s.filter((x) => x.id !== media.id) : [...s, media]));
  }

  return (
    <fieldset aria-describedby="imagens-ajuda" aria-invalid={Boolean(error)}>
      <legend className={ui.label}>Imagens</legend>
      <p id="imagens-ajuda" className={ui.hint}>
        A primeira é a capa. JPG, PNG, WebP ou AVIF, até 15 MB; fotos grandes são reduzidas automaticamente.
      </p>
      {selected.map((m) => (
        <input key={m.id} type="hidden" name="imageIds" value={m.id} />
      ))}

      {selected.length > 0 && (
        <ol className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {selected.map((m, i) => (
            <li key={m.id} className="overflow-hidden rounded-md bg-a-panel ring-1 ring-a-line">
              <div className="relative aspect-[4/3] bg-a-bg">
                <Image src={`/media/${m.id}`} alt={m.alt} fill sizes="240px" unoptimized={m.external} className="object-cover" />
                {i === 0 && (
                  <span className="absolute top-2 left-2 rounded bg-a-ink px-1.5 py-0.5 text-[12px] font-medium text-white">Capa</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 p-1.5">
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Mover para a esquerda" className={cx(ui.btn, ui.ghost, "min-h-8 w-8 px-0")}>
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === selected.length - 1}
                    aria-label="Mover para a direita"
                    className={cx(ui.btn, ui.ghost, "min-h-8 w-8 px-0")}
                  >
                    →
                  </button>
                </div>
                <button type="button" onClick={() => toggle(m)} className={cx(ui.btn, ui.ghost, "min-h-8 px-2 text-a-danger")}>
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className={cx(ui.btn, ui.secondary, "cursor-pointer focus-within:outline-2 focus-within:outline-a-accent")}>
          Enviar imagens
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="sr-only"
            onChange={(e) => onFiles(e.target.files)}
          />
        </label>
        <button type="button" onClick={() => dialog.current?.showModal()} className={cx(ui.btn, ui.secondary)}>
          Escolher da biblioteca
        </button>
        {uploading > 0 && (
          <span role="status" className="text-sm text-a-muted">
            Enviando {uploading} {uploading === 1 ? "imagem" : "imagens"}…
          </span>
        )}
      </div>
      {error && <p className={ui.error}>{error}</p>}

      <dialog
        ref={dialog}
        aria-labelledby="biblioteca-titulo"
        className="m-auto max-h-[88dvh] w-[min(94vw,56rem)] rounded-lg bg-a-panel p-0 text-a-ink shadow-xl backdrop:bg-black/40"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-a-line bg-a-panel px-5 py-4">
          <h2 id="biblioteca-titulo" className="text-lg font-medium">
            Biblioteca de imagens
          </h2>
          <button type="button" onClick={() => dialog.current?.close()} className={cx(ui.btn, ui.primary)}>
            Concluir
          </button>
        </div>
        {library.length === 0 ? (
          <p className="p-8 text-center text-a-muted">A biblioteca está vazia. Envie imagens pelo botão “Enviar imagens”.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 md:grid-cols-4">
            {library.map((m) => {
              const on = selectedIds.has(m.id);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => toggle(m)}
                    aria-pressed={on}
                    className={cx(
                      "block w-full overflow-hidden rounded-md text-left ring-inset transition-shadow",
                      on ? "ring-3 ring-a-accent" : "ring-1 ring-a-line hover:ring-a-muted",
                    )}
                  >
                    <span className="relative block aspect-[4/3] bg-a-bg">
                      <Image src={`/media/${m.id}`} alt={m.alt} fill sizes="220px" unoptimized={m.external} className="object-cover" />
                    </span>
                    <span className="block truncate px-2 py-1.5 text-[13px]">{on ? "Selecionada" : m.filename}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </dialog>
    </fieldset>
  );
}
