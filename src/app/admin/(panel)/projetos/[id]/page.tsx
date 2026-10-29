import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/admin/project-form";
import { ui } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/session";
import { getProjectForEdit, listCategories, listMedia } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Editar projeto" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditProjectPage({ params }: PageProps<"/admin/projetos/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const [project, categories, library] = await Promise.all([getProjectForEdit(id), listCategories(), listMedia()]);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-a-muted hover:text-a-ink">
          ← Projetos
        </Link>
        <h1 className={`${ui.pageTitle} mt-2`}>{project.title}</h1>
      </div>
      <ProjectForm
        key={project.updatedAt.toISOString()}
        values={{
          id: project.id,
          title: project.title,
          slug: project.slug,
          summary: project.summary,
          description: project.description,
          categoryId: project.categoryId,
          location: project.location,
          eventDate: project.eventDate,
          published: project.published,
          featured: project.featured,
          isDemo: project.isDemo,
          images: project.images,
        }}
        categories={categories}
        library={library}
      />
    </div>
  );
}
