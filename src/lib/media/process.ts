import sharp, { type Metadata } from "sharp";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const ACCEPTED_FORMATS = ["jpeg", "png", "webp", "avif", "heif"] as const;
const MAX_DIMENSION = 2400;

export type ProcessedImage = {
  data: Buffer;
  mimeType: "image/webp";
  width: number;
  height: number;
  size: number;
};

export class InvalidImageError extends Error {}

/**
 * Valida pelo conteúdo real (não pela extensão), corrige a orientação EXIF,
 * remove metadados (inclusive GPS) e converte para WebP com no máximo 2400px.
 */
export async function processImage(input: Buffer): Promise<ProcessedImage> {
  if (input.byteLength > MAX_UPLOAD_BYTES) throw new InvalidImageError("A imagem passa de 15 MB.");
  let meta: Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: 80_000_000 }).metadata();
  } catch {
    throw new InvalidImageError("O arquivo não é uma imagem válida.");
  }
  if (!meta.format || !(ACCEPTED_FORMATS as readonly string[]).includes(meta.format)) {
    throw new InvalidImageError("Formato não aceito. Use JPG, PNG, WebP ou AVIF.");
  }
  const { data, info } = await sharp(input, { limitInputPixels: 80_000_000 })
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  return { data, mimeType: "image/webp", width: info.width, height: info.height, size: data.byteLength };
}
