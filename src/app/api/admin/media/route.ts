import { db, schema } from "@/db";
import { assertAdmin, UnauthorizedError } from "@/lib/auth/session";
import { InvalidImageError, MAX_UPLOAD_BYTES, processImage } from "@/lib/media/process";

/** Upload de uma imagem por requisição (o cliente envia várias em sequência). */
export async function POST(request: Request) {
  // Proteção CSRF: só aceita envios do próprio site.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) {
    return Response.json({ error: "Origem não permitida." }, { status: 403 });
  }

  try {
    await assertAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) return Response.json({ error: error.message }, { status: 401 });
    throw error;
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) {
    return Response.json({ error: "A imagem passa de 15 MB." }, { status: 413 });
  }

  let file: FormDataEntryValue | null;
  let alt = "";
  try {
    const form = await request.formData();
    file = form.get("file");
    alt = String(form.get("alt") ?? "").trim().slice(0, 200);
  } catch {
    return Response.json({ error: "Envio inválido." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  try {
    const processed = await processImage(Buffer.from(await file.arrayBuffer()));
    const filename = file.name.replace(/[^\w.\- ]+/g, "").slice(0, 120) || "imagem";
    const [row] = await db
      .insert(schema.media)
      .values({ filename, alt, ...processed })
      .returning({
        id: schema.media.id,
        filename: schema.media.filename,
        width: schema.media.width,
        height: schema.media.height,
        alt: schema.media.alt,
      });
    return Response.json(row, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidImageError) return Response.json({ error: error.message }, { status: 422 });
    console.error("[upload]", error);
    return Response.json({ error: "Falha ao processar a imagem." }, { status: 500 });
  }
}
