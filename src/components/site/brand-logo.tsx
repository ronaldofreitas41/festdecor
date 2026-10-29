/**
 * A marca da Fest Decor redesenhada em vetor a partir da logo do Instagram:
 * "fest" com o f e o s em voluta e "decor de eventos" em arco. Usa a cor do texto (currentColor).
 * Para usar o arquivo original, troque este SVG por <Image src="/brand/logo.svg" … />.
 * Com `title` vazio, a marca é decorativa e fica fora da leitura de tela.
 */
export function BrandLogo({ id, className, title = "Fest Decor, decor de eventos" }: { id: string; className?: string; title?: string }) {
  const arc = `${id}-arco`;
  return (
    <svg
      viewBox="40 118 506 444"
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
      className={className}
      fill="currentColor"
    >
      {/* f */}
      <rect x="156" y="200" width="9" height="152" />
      <path d="M160.5 214C160 166 140 138 106 138C74 138 52 160 53 184C54 200 66 208 78 204" fill="none" stroke="currentColor" strokeWidth="3.4" />
      <circle cx="68" cy="195" r="12.5" />
      <path d="M163 205C170 190 186 182 200 186" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="203" cy="190" r="9" />
      <rect x="141" y="254" width="54" height="3.2" />
      <rect x="143" y="349" width="47" height="3.2" />
      {/* e */}
      <path d="M209 290H283C283 263 268 250 247 250C222 250 206 271 206 304C206 337 223 355 250 355C266 355 277 347 285 334" fill="none" stroke="currentColor" strokeWidth="3.2" />
      <path d="M210 275C204 292 204 318 211 336C209 318 209 292 214 272Z" />
      {/* s, com a cauda em voluta */}
      <path
        d="M357 262C350 252 338 248 326 248C309 248 298 258 298 271C298 292 330 302 350 316C392 345 418 395 410 452C402 515 365 552 320 550C275 548 230 520 228 478C226 440 255 412 284 418"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.4"
      />
      {/* O traço grosso do s: a diagonal e a volta de baixo, sobre o mesmo caminho. */}
      <path d="M303 282C312 297 333 305 350 316C392 345 418 395 410 452" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      <path d="M300 549C268 543 232 518 229 482" fill="none" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
      <rect x="355" y="250" width="3.2" height="22" />
      <circle cx="284" cy="418" r="13" />
      {/* t */}
      <path d="M424 215L433 206V355H424Z" />
      <path d="M428 345C430 356 440 360 451 352" fill="none" stroke="currentColor" strokeWidth="3.2" />
      <rect x="405" y="254" width="47" height="3.2" />
      <path id={arc} d="M353.5 164A106 106 0 0 1 515 297" fill="none" />
      <text fontFamily="var(--font-quicksand), sans-serif" fontWeight="500" fontSize="27" letterSpacing="4.2">
        <textPath href={`#${arc}`}>decor de eventos</textPath>
      </text>
    </svg>
  );
}

/** Ramos de folhas da logo, em tom sobre tom. Puramente decorativo. */
export function Foliage({ className }: { className?: string }) {
  const leaves = [
    [70, 250, -38, 1],
    [128, 196, -52, 0.95],
    [182, 150, -62, 0.9],
    [236, 116, -74, 0.82],
    [122, 300, 12, 0.92],
    [190, 250, 2, 0.86],
    [252, 200, -8, 0.78],
    [306, 158, -18, 0.68],
  ] as const;
  return (
    <svg viewBox="0 0 400 400" aria-hidden="true" className={className} fill="currentColor">
      <path d="M40 330C100 280 180 210 300 140" fill="none" stroke="currentColor" strokeWidth="2.5" />
      {leaves.map(([x, y, r, s], i) => (
        <path
          key={i}
          transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}
          d="M0 0C18 -30 58 -44 96 -40C70 -12 36 4 0 0Z"
        />
      ))}
    </svg>
  );
}
