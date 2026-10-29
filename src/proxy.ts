import { NextResponse, type NextRequest } from "next/server";

// Verificação otimista: sem cookie de sessão, nem chega a renderizar o painel.
// A validação real da sessão acontece no servidor, em cada página, action e rota.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  if (!request.cookies.has("fd_session")) {
    const url = new URL("/admin/login", request.url);
    if (pathname !== "/admin") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
