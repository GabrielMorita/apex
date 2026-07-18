import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { updateSession } from "@/lib/supabase/proxy";

const PUBLIC_ROUTES = [
  "/entrar",
  "/cadastro",
  "/recuperar-senha",
  "/atualizar-senha",
  "/auth",
  "/configurar-supabase",
  "/termos",
  "/privacidade",
  "/dados-saude",
  "/suporte",
  "/api/health",
];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isSupabaseConfigured()) {
    if (pathname === "/configurar-supabase") return NextResponse.next();
    return NextResponse.redirect(new URL("/configurar-supabase", request.url));
  }

  const { response, userId } = await updateSession(request);
  const publicRoute = isPublicRoute(pathname);

  if (!userId && !publicRoute) {
    const loginUrl = new URL("/entrar", request.url);
    loginUrl.searchParams.set("redirect", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (userId && ["/entrar", "/cadastro", "/recuperar-senha"].includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|screenshots/|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
