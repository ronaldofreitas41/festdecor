import type { Metadata } from "next";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { ui } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/session";
import { listCategories } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Categorias" };

export default async function CategoriesPage() {
  await requireAdmin();
  const categories = await listCategories();
  return (
    <div className="space-y-6">
      <div>
        <h1 className={ui.pageTitle}>Categorias</h1>
        <p className="mt-1 text-a-muted">Viram os filtros do portfólio e as opções do pedido de orçamento.</p>
      </div>
      <CategoriesManager categories={categories.map(({ id, name, projectCount }) => ({ id, name, projectCount }))} />
    </div>
  );
}
