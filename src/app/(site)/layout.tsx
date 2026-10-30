import { Suspense } from "react";
import { Reveal } from "@/components/site/reveal";
import { SceneBackground } from "@/components/site/scene/scene-background";
import { SiteFooter } from "@/components/site/site-footer";
import { SmoothScroll } from "@/components/site/smooth-scroll";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only z-50 bg-accent px-4 py-2 text-accent-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>
      <SceneBackground />
      <SmoothScroll />
      {children}
      <SiteFooter />
      <Suspense>
        <Reveal />
      </Suspense>
    </>
  );
}
