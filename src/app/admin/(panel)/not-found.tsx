import Link from "next/link";
import { cx, ui } from "@/components/admin/ui";

export default function AdminNotFound() {
  return (
    <div className={cx(ui.panel, "p-6")}>
      <h1 className="text-lg font-medium">Não encontrado</h1>
      <p className="mt-1 text-a-muted">Este item pode ter sido excluído.</p>
      <Link href="/admin" className={cx(ui.btn, ui.secondary, "mt-4")}>
        Voltar aos projetos
      </Link>
    </div>
  );
}
