import type { Metadata } from "next";
import { MediaGrid, Uploader } from "@/components/admin/media-library";
import { ui } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/session";
import { listMedia } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Imagens" };

export default async function MediaPage() {
  await requireAdmin();
  const items = await listMedia();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={ui.pageTitle}>Imagens</h1>
          <p className="mt-1 text-a-muted">
            {items.length} {items.length === 1 ? "imagem" : "imagens"} na biblioteca. Escreva a descrição de cada foto: ela é lida por
            leitores de tela e pelo Google.
          </p>
        </div>
        <Uploader />
      </div>
      <MediaGrid items={items} />
    </div>
  );
}
