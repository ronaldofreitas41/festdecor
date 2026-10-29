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
  const [q, setQ] = useState<QuoteRequest>({ eventType: eventTypes[0] ?? "Casamento", month: "", guests: "", place: "", name: "" });
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
    "mt-2 block w-full min-h-12 bg-surface-2 px-4 text-[1rem] text-ink placeholder:text-muted/80 focus:outline-2 focus:outline-accent";

  return (
    <div className="grid gap-12 md:grid-cols-12 md:gap-6">
      <form className="md:col-span-6 lg:col-span-5" onSubmit={(e) => e.preventDefault()} aria-describedby={`${id}-hint`}>
        <fieldset>
          <legend className="text-small text-muted">Tipo de evento</legend>
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
                <span className="inline-flex min-h-11 items-center rounded-full bg-surface-2 px-4 text-small text-ink transition-colors peer-checked:bg-ink peer-checked:text-bg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent hover:bg-surface-hover peer-checked:hover:bg-ink">
                  {type}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <label className="text-small text-muted">
            Mês do evento
            <input type="month" value={q.month} onChange={set("month")} className={`${fieldClass} [color-scheme:light]`} />
          </label>
          <label className="text-small text-muted">
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
          <label className="text-small text-muted">
            Local ou cidade
            <input value={q.place} onChange={set("place")} placeholder="Ex.: Nova Lima" maxLength={80} className={fieldClass} />
          </label>
          <label className="text-small text-muted">
            Seu nome
            <input value={q.name} onChange={set("name")} autoComplete="given-name" maxLength={60} className={fieldClass} />
          </label>
        </div>
        <p id={`${id}-hint`} className="mt-6 text-small text-muted">
          Nada é enviado daqui: a mensagem abre {wa ? "no seu WhatsApp" : "no Instagram"} para você revisar antes.
        </p>
      </form>

      <div className="md:col-span-6 lg:col-start-7">
        <figure className="bg-brand px-7 py-9 text-brand-text sm:px-10 sm:py-12" aria-live="polite">
          <BrandLogo id="logo-convite" title="" className="mb-6 h-16 w-auto text-brand-ink sm:h-20" />
          <figcaption className="text-small text-brand-ink">Sua mensagem</figcaption>
          <p className="mt-5 text-lead leading-snug font-medium tracking-[-0.015em]">
            {q.name.trim() ? `${q.name.trim()} quer celebrar` : "Um pedido de orçamento para"}
            {" "}
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
            <a href={`https://ig.me/m/${contact.instagram}`} target="_blank" rel="noopener" onClick={copyThenOpenInstagram} className="btn-primary">
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
