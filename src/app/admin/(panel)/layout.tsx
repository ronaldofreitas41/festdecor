import Link from "next/link";
import { Suspense } from "react";
import { ActiveAdminNav, AdminNav } from "@/components/admin/admin-nav";
import { cx, ui } from "@/components/admin/ui";
import { getCurrentAdmin } from "@/lib/auth/session";
import { logout } from "../login/actions";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[232px_1fr]">
      <aside className="border-b border-a-line bg-a-panel lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:border-b-0">
        <div className="flex h-full flex-col gap-4 px-4 py-4 lg:py-6">
          <div className="flex items-center justify-between gap-4 lg:block">
            <Link href="/admin" className="block">
              <span className="font-serif text-[1.375rem] leading-none font-medium tracking-[-0.02em]">Fest Decor</span>
              <span className="mt-1 block text-[13px] text-a-muted">Painel da equipe</span>
            </Link>
            <Link href="/" target="_blank" className="text-sm text-a-muted underline underline-offset-4 hover:text-a-ink lg:hidden">
              Ver site
            </Link>
          </div>
          <Suspense fallback={<AdminNav />}>
            <ActiveAdminNav />
          </Suspense>
          <div className="mt-auto hidden space-y-3 lg:block">
            <Link href="/" target="_blank" className="block text-sm text-a-muted underline underline-offset-4 hover:text-a-ink">
              Ver o site ↗
            </Link>
            <Suspense fallback={<div className="h-16" />}>
              <CurrentUser />
            </Suspense>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="mx-auto max-w-[1120px] px-4 py-6 sm:px-8 lg:py-9">{children}</div>
        <div className="border-t border-a-line px-4 py-4 lg:hidden">
          <Suspense>
            <CurrentUser />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function CurrentUser() {
  const admin = await getCurrentAdmin();
  if (!admin) return null;
  return (
    <div className="flex items-center justify-between gap-3 lg:block">
      <p className="min-w-0 truncate text-sm">
        <span className="font-medium">{admin.name}</span>
        <span className="block truncate text-[13px] text-a-muted">{admin.email}</span>
      </p>
      <form action={logout} className="lg:mt-2">
        <button type="submit" className={cx(ui.btn, ui.secondary, "min-h-9 px-3")}>
          Sair
        </button>
      </form>
    </div>
  );
}
