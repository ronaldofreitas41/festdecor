import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/settings-form";
import { ui } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/session";
import { getSettingsForEdit } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Contato e WhatsApp" };

export default async function SettingsPage() {
  await requireAdmin();
  const s = await getSettingsForEdit();
  return (
    <div className="space-y-6">
      <div>
        <h1 className={ui.pageTitle}>Contato e WhatsApp</h1>
        <p className="mt-1 text-a-muted">Usados no pedido de orçamento, no contato e no rodapé do site.</p>
      </div>
      <SettingsForm
        values={{ whatsapp: s.whatsapp, instagram: s.instagram, email: s.email, phoneDisplay: s.phoneDisplay, city: s.city }}
      />
    </div>
  );
}
