"use client";

import { useId, useState } from "react";
import { BrandLogo } from "./brand-logo";
import { formatMonth, instagramLink, quoteMessage, whatsappLink, type ContactSettings, type QuoteRequest } from "@/lib/contact";

const GUESTS = ["até 50", "50 a 100", "100 a 200", "200 a 300", "mais de 300"];

/**
 * O pedido de orçamento montado como um convite: a pessoa escolhe e vê a mensagem
 * pronta, que segue pelo WhatsApp (ou Instagram / e-mail, conforme o painel).
 */
export function QuoteComposer({ eventTypes, contact }: { eventTypes: string[]; contact: ContactSettings }) {
  const id = useId();
  const [q, setQ] = useState<QuoteRequest>({
    eventType: eventTypes[0] ?? "Casamento",
    month: "",
    guests: "",
    place: "",
    name: "",
  });
  const [copied, setCopied] = useState(false);
  const set = (key: keyof QuoteRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setQ((prev) => ({ ...prev, [key]: e.target.value }));

  const message = quoteMessage(q);
  const wa = whatsappLink(contact.whatsapp, message);
  const ig = instagramLink(contact.instagram);
  const mail = contact.email
    ? `mailto:${contact.email}?subject=${encodeURIComponent("Pedido de orçamento")}&body=${encodeURIComponent(message)}`
    : null;

  async function copyThenOpenInstagram(e: React.MouseEvent<HTMLAnchorElement>) {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      // Sem permissão de cópia: a pessoa ainda pode copiar do cartão.
      e.preventDefault();
      window.open(e.currentTarget.href, "_blank", "noopener");
    }
  }

  const fieldClass =
    "mt-1 block w-full min-h-12 border-b border-gold/60 bg-transparent px-0 font-serif text-[1.0625rem] tracking-normal normal-case text-ink placeholder:text-muted/70 transition-colors focus:border-accent focus:outline-none";

  return (
    <div className="grid gap-12 md:grid-cols-12 md:gap-6">
      <form className="md:col-span-6 lg:col-span-5" onSubmit={(e) => e.preventDefault()} aria-describedby={`${id}-hint`}>
        <fieldset>
          <legend className="caps text-muted">Tipo de evento</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {[...eventTypes, "Outro"].map((type) => (
              <label key={type} className="cursor-pointer">
                <input
                  type="radio"
                  name="eventType"
                  value={type}
                  checked={q.eventType === type}
                  onChange={set("eventType")}
                  className="peer sr-only"
                />
                <span className="inline-flex min-h-11 items-center rounded-full px-4 text-small text-ink ring-1 ring-gold/50 transition-colors peer-checked:bg-ink peer-checked:text-bg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent hover:bg-surface peer-checked:ring-ink peer-checked:hover:bg-ink">
                  {type}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <label className="caps text-muted">
            Mês do evento
            <input type="month" value={q.month} onChange={set("month")} className={`${fieldClass} [color-scheme:light]`} />
          </label>
          <label className="caps text-muted">
            Convidados
            <select value={q.guests} onChange={set("guests")} className={fieldClass}>
              <option value="">Ainda não sei</option>
              {GUESTS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className="caps text-muted">
            Local ou cidade
            <input value={q.place} onChange={set("place")} placeholder="Ex.: Nova Lima" maxLength={80} className={fieldClass} />
          </label>
          <label className="caps text-muted">
            Seu nome
            <input value={q.name} onChange={set("name")} autoComplete="given-name" maxLength={60} className={fieldClass} />
          </label>
        </div>
        <p id={`${id}-hint`} className="mt-6 text-small text-muted">
          Nada é enviado daqui: a mensagem abre {wa ? "no seu WhatsApp" : "no Instagram"} para você revisar antes.
        </p>
      </form>

      <div className="md:col-span-6 lg:col-start-7">
        <figure
          className="rounded-[2rem] bg-brand px-8 py-10 text-center text-brand-text shadow-[0_40px_80px_-40px_rgb(40_15_5/0.6)] outline-1 -outline-offset-[12px] outline-brand-ink/45 sm:px-12 sm:py-14"
          aria-live="polite"
        >
          <BrandLogo id="logo-convite" title="" className="mx-auto mb-6 h-16 w-auto text-brand-ink sm:h-20" />
          <figcaption className="caps text-brand-ink">Sua mensagem</figcaption>
          <p className="mx-auto mt-5 max-w-[26ch] text-[clamp(1.375rem,1.1rem+1vw,2rem)] leading-snug italic">
            {q.name.trim() ? `${q.name.trim()} quer celebrar` : "Um pedido de orçamento para"}{" "}
            {q.eventType === "Outro" ? "um evento" : q.eventType.toLowerCase()}
            {q.month ? ` em ${formatMonth(q.month)}` : ""}
            {q.place.trim() ? `, em ${q.place.trim()}` : ""}
            {q.guests ? `, com ${q.guests} convidados` : ""}.
          </p>
          <p className="mt-6 text-small whitespace-pre-line text-brand-ink">{message}</p>
        </figure>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
          {wa ? (
            <a href={wa} target="_blank" rel="noopener" className="btn-primary">
              Enviar pelo WhatsApp
            </a>
          ) : ig ? (
            <a
              href={`https://ig.me/m/${contact.instagram}`}
              target="_blank"
              rel="noopener"
              onClick={copyThenOpenInstagram}
              className="btn-primary"
            >
              Copiar e abrir o Instagram
            </a>
          ) : null}
          {mail && (
            <a href={mail} className="link-quiet text-small">
              Prefiro por e-mail
            </a>
          )}
          {wa && ig && (
            <a href={ig} target="_blank" rel="noopener" className="link-quiet text-small">
              Ver o Instagram
            </a>
          )}
        </div>
        {copied && <p className="mt-3 text-small text-muted">Mensagem copiada. Cole na conversa do Instagram.</p>}
      </div>
    </div>
  );
}
