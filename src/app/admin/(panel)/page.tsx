import type { Metadata } from "next";
import Link from "next/link";
import { FeaturedManager } from "@/components/admin/featured-manager";
import { ProjectsTable } from "@/components/admin/projects-table";
import { cx, ui } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/session";
import { listProjects } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Projetos" };

export default async function AdminProjectsPage() {
  await requireAdmin();
  const projects = await listProjects();
  const featured = projects
    .filter((p) => p.featured)
    .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0))
    .map(({ id, title, slug, category, coverId, published }) => ({ id, title, slug, category, coverId, published }));
  const rows = projects.map((p) => ({ ...p, updatedAt: p.updatedAt.toISOString() }));
  const demoCount = projects.filter((p) => p.isDemo).length;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={ui.pageTitle}>Projetos</h1>
          <p className="mt-1 text-a-muted">
            {projects.length} {projects.length === 1 ? "projeto" : "projetos"}, {featured.length} em destaque
          </p>
        </div>
        <Link href="/admin/projetos/novo" className={cx(ui.btn, ui.primary)}>
          Novo projeto
        </Link>
      </div>

      {demoCount > 0 && (
        <p className="rounded-lg bg-a-accent-soft px-4 py-3 text-sm text-a-accent">
          {demoCount} {demoCount === 1 ? "projeto é" : "projetos são"} de demonstração, com fotos ilustrativas de terceiros.
          Substitua pelas fotos reais da Fest Decor ou exclua antes de divulgar o site.
        </p>
      )}

      <section aria-labelledby="destaques" className="space-y-3">
        <div>
          <h2 id="destaques" className="text-lg font-medium">
            Destaques da página inicial
          </h2>
          <p className="text-sm text-a-muted">Use as setas para ordenar. A mudança aparece no site na hora.</p>
        </div>
        <FeaturedManager items={featured} />
      </section>

      <section aria-labelledby="todos" className="space-y-3">
        <h2 id="todos" className="text-lg font-medium">
          Todos os projetos
        </h2>
        <ProjectsTable rows={rows} />
      </section>
    </div>
  );
}
