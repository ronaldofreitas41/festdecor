import "server-only";
import { cacheLife } from "next/cache";

const POST_URL = /^https:\/\/www\.instagram\.com\/(?:p|reel)\/[A-Za-z0-9_-]+\/$/;

export function isInstagramPostUrl(url: string) {
  return POST_URL.test(url);
}

/**
 * Endereço atual da imagem de um post do Instagram.
 * Os links da CDN do Instagram são assinados e vencem em poucos dias, então guardamos só o link
 * do post e lemos o endereço da imagem na página pública de incorporação, renovando a cada poucas horas.
 * Nenhuma imagem é baixada pelo servidor: o navegador a carrega direto do Instagram.
 */
export async function resolveInstagramImage(postUrl: string): Promise<string> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 6 * 3600, expire: 2 * 86400 });
  if (!isInstagramPostUrl(postUrl)) throw new Error("Link de post do Instagram inválido.");
  const res = await fetch(`${postUrl}embed/captioned/`, { headers: { "Accept-Language": "pt-BR" } });
  if (!res.ok) throw new Error(`Instagram respondeu ${res.status}.`);
  const html = await res.text();
  const src = html.match(/class="EmbeddedMediaImage"[^>]*?\ssrc="([^"]+)"/)?.[1];
  if (!src) throw new Error("Imagem do post não encontrada.");
  const url = src.replaceAll("&amp;", "&");
  if (!/^https:\/\/[a-z0-9.-]+\.(fbcdn\.net|cdninstagram\.com)\//.test(url)) throw new Error("Endereço de imagem inesperado.");
  return url;
}
