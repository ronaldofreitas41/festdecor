import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SITE } from "@/lib/site";
import "./globals.css";

const erode = localFont({
  variable: "--font-erode",
  display: "swap",
  src: [
    { path: "./fonts/Erode-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Erode-Italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/Erode-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Erode-Semibold.woff2", weight: "600", style: "normal" },
  ],
});

const quicksand = localFont({
  variable: "--font-quicksand",
  display: "swap",
  src: [{ path: "./fonts/Quicksand-Medium.woff2", weight: "500", style: "normal" }],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Fest Decor — decoração de casamentos e eventos em BH",
    template: "%s · Fest Decor",
  },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE.name,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#9b5030",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${erode.variable} ${quicksand.variable}`} suppressHydrationWarning>
      <head>
        {/* Marca que há JavaScript antes da pintura, para as entradas animadas. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
