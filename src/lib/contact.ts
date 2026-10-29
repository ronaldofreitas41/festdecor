export type ContactSettings = {
  whatsapp: string;
  instagram: string;
  email: string;
  phoneDisplay: string;
  city: string;
};

export function whatsappLink(number: string, message?: string): string | null {
  const digits = number.replace(/\D/g, "");
  if (!digits) return null;
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${query}`;
}

export function instagramLink(handle: string): string | null {
  return handle ? `https://www.instagram.com/${handle}/` : null;
}

/** Formata 5531999998888 como (31) 99999-8888 quando não há telefone de exibição. */
export function formatPhone(settings: ContactSettings): string {
  if (settings.phoneDisplay) return settings.phoneDisplay;
  const d = settings.whatsapp.replace(/\D/g, "").replace(/^55/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return "";
}

export type QuoteRequest = {
  eventType: string;
  month: string;
  guests: string;
  place: string;
  name: string;
};

const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export function formatMonth(value: string | null | undefined): string {
  if (!value) return "";
  const [y, m] = value.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return "";
  return `${MONTHS[m - 1]} de ${y}`;
}

/** Monta a mensagem de orçamento enviada pelo WhatsApp ou e-mail. */
export function quoteMessage(q: QuoteRequest): string {
  const lines = [`Olá, Fest Decor! ${q.name.trim() ? `Meu nome é ${q.name.trim()}. ` : ""}Quero um orçamento.`];
  if (q.eventType) lines.push(`Evento: ${q.eventType}`);
  const month = formatMonth(q.month);
  if (month) lines.push(`Data: ${month}`);
  if (q.guests) lines.push(`Convidados: cerca de ${q.guests}`);
  if (q.place.trim()) lines.push(`Local: ${q.place.trim()}`);
  return lines.join("\n");
}
