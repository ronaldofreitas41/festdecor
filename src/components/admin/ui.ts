// Classes compartilhadas do painel: claro, neutro, controles com 40px de altura.
export const ui = {
  btn: "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-[background-color,transform] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
  primary: "bg-a-ink text-white hover:bg-black",
  secondary: "bg-a-panel text-a-ink ring-1 ring-a-line ring-inset hover:bg-a-bg",
  danger: "bg-a-danger text-white hover:bg-[#8a1f16]",
  ghost: "text-a-ink hover:bg-a-line/50",
  input:
    "block w-full min-h-10 rounded-md bg-a-panel px-3 text-[15px] text-a-ink ring-1 ring-a-line ring-inset placeholder:text-a-muted/70 focus:outline-2 focus:outline-a-accent aria-invalid:ring-a-danger",
  label: "block text-sm font-medium text-a-ink",
  hint: "mt-1.5 text-[13px] text-a-muted",
  error: "mt-1.5 text-[13px] text-a-danger",
  panel: "rounded-lg bg-a-panel ring-1 ring-a-line",
  pageTitle: "font-serif text-[2rem] leading-tight font-medium tracking-[-0.02em]",
};

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
