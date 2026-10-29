"use client";

import Link from "next/link";
import { useRef } from "react";

export function MobileMenu({ items }: { items: { href: string; label: string }[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="min-h-11 px-1 text-small text-ink"
        aria-haspopup="dialog"
      >
        Menu
      </button>
      <dialog
        ref={ref}
        aria-label="Menu"
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-bg p-0 text-ink backdrop:bg-black/60 open:flex open:flex-col"
      >
        <div className="flex items-center justify-between px-margin py-5">
          <Link href="/" onClick={close} className="text-[1.375rem] font-medium tracking-[-0.02em]">
            Fest Decor
          </Link>
          <button type="button" onClick={close} className="min-h-11 px-1 text-small">
            Fechar
          </button>
        </div>
        <nav aria-label="Menu" className="flex flex-1 flex-col justify-end gap-2 px-margin pb-10">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="py-1 text-[2.5rem] leading-tight font-medium tracking-[-0.025em]"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/#orcamento" onClick={close} className="btn-primary mt-8 self-start">
            Pedir orçamento
          </Link>
        </nav>
      </dialog>
    </div>
  );
}
