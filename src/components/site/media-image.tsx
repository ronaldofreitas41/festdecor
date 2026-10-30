import Image, { type ImageProps } from "next/image";
import type { PublicImage } from "@/lib/data/public";

type Props = Omit<ImageProps, "src" | "alt" | "width" | "height"> & {
  image: PublicImage;
  alt?: string;
  fill?: boolean;
};

/**
 * Imagem servida por /media/[id]. As enviadas pelo painel passam pelo otimizador do next/image;
 * as do Instagram vão direto do navegador para o Instagram, sem passar pelo servidor.
 */
export function MediaImage({ image, alt, fill, ...rest }: Props) {
  const src = `/media/${image.id}`;
  const text = alt ?? image.alt;
  const unoptimized = image.external || undefined;
  return fill ? (
    <Image src={src} alt={text} quality={80} unoptimized={unoptimized} {...rest} fill />
  ) : (
    <Image src={src} alt={text} quality={80} unoptimized={unoptimized} {...rest} width={image.width} height={image.height} />
  );
}
