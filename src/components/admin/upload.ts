"use client";

export type UploadedMedia = { id: string; filename: string; width: number; height: number; alt: string };

const MAX_SIDE = 2400;
// Fica abaixo do limite de corpo de requisição de hospedagens serverless (~4,5 MB).
const MAX_SEND_BYTES = 4 * 1024 * 1024;

/** Reduz fotos grandes de celular no navegador antes de enviar. */
async function shrink(file: File): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= MAX_SEND_BYTES) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  return blob ?? file;
}

export async function uploadImage(file: File, alt = ""): Promise<UploadedMedia> {
  const body = new FormData();
  const blob = await shrink(file);
  body.append("file", blob, file.name.replace(/\.(png|webp|heic|heif)$/i, blob === file ? "$&" : ".jpg"));
  body.append("alt", alt);
  const res = await fetch("/api/admin/media", { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Falha no envio.");
  return data as UploadedMedia;
}
