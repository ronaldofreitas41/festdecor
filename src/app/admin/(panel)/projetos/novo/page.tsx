import type { Metadata } from "next";
import Link from "next/link";
import { ProjectForm } from "@/components/admin/project-form";
import { ui } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/session";
import { listCategories, listMedia } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Novo projeto" };

export default async function NewProjectPage() {
  await requireAdmin();
  const [categories, library] = await Promise.all([listCategories(), listMedia()]);
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-a-muted hover:text-a-ink">
          ← Projetos
        </Link>
        <h1 className={`${ui.pageTitle} mt-2`}>Novo projeto</h1>
      </div>
      <ProjectForm
        values={{
          title: "",
          slug: "",
          summary: "",
          description: "",
          categoryId: null,
          location: "",
          eventDate: null,
          published: true,
          featured: false,
          isDemo: false,
          images: [],
        }}
        categories={categories}
        library={library}
      />
    </div>
  );
}
