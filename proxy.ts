import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// ── Route yang dilindungi ─────────────────────────────────────────────────────
const PROTECTED_PREFIXES = ["/dashboard", "/events/new"];
const PUBLIC_PREFIXES    = ["/api/auth", "/_next", "/favicon"];

// ─────────────────────────────────────────────────────────────────────────────

function isProtected(pathname: string): boolean {
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  // Validasi session via Better Auth
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Tidak ada session atau sudah expire → redirect ke login
  if (!session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search   = "?reason=timeout";
    return NextResponse.redirect(loginUrl);
  }

  // Session valid → lanjutkan request
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match semua path kecuali:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico
     * - file dengan ekstensi (gambar, font, dll)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};