import Image, { type ImageProps } from "next/image";
import type { PublicImage } from "@/lib/data/public";

type Props = Omit<ImageProps, "src" | "alt" | "width" | "height"> & {
  image: PublicImage;
  alt?: string;
  fill?: boolean;
};

/** Imagem guardada no banco, servida por /media/[id] e otimizada pelo next/image. */
export function MediaImage({ image, alt, fill, ...rest }: Props) {
  const src = `/media/${image.id}`;
  const text = alt ?? image.alt;
  return fill ? (
    <Image src={src} alt={text} quality={80} {...rest} fill />
  ) : (
    <Image src={src} alt={text} quality={80} {...rest} width={image.width} height={image.height} />
  );
}
