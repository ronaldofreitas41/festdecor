import type { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Painel Fest Decor" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin min-h-dvh bg-a-bg font-sans text-[15px] leading-normal text-a-ink [color-scheme:light]">
      {children}
      <Toaster position="bottom-right" richColors closeButton toastOptions={{ duration: 5000 }} />
    </div>
  );
}
