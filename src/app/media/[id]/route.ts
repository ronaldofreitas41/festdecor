import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { resolveInstagramImage } from "@/lib/media/instagram";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Serve as imagens. As enviadas pelo painel saem do banco, com cache permanente (o id nunca muda de conteúdo).
 * As do Instagram redirecionam para o endereço atual da imagem no próprio Instagram, com cache curto.
 */
export async function GET(_request: Request, ctx: RouteContext<"/media/[id]">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });

  const [row] = await db
    .select({ data: schema.media.data, mimeType: schema.media.mimeType, sourceUrl: schema.media.sourceUrl })
    .from(schema.media)
    .where(eq(schema.media.id, id));
  if (!row) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  if (row.sourceUrl) {
    try {
      const url = await resolveInstagramImage(row.sourceUrl);
      return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "public, max-age=3600" } });
    } catch {
      return new Response("Imagem indisponível no Instagram", { status: 502, headers: { "Cache-Control": "no-store" } });
    }
  }
  if (!row.data) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  return new Response(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mimeType,
      "Content-Length": String(row.data.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
