import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

function securityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.paypal.com https://www.sandbox.paypal.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; frame-src 'self' https://www.paypal.com https://www.sandbox.paypal.com https://www.youtube.com https://player.vimeo.com; connect-src 'self' https://www.paypal.com https://www.sandbox.paypal.com;",
  );
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }
  return response;
}

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;
  const ip = getClientIp(req.headers);

  const session = req.auth as { user?: { role?: string } } | null;
  const isAdminUser =
    session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  // Rate-limit only unauthenticated admin login — not every admin page load / server action.
  if (pathname === "/admin/login" && !isAdminUser) {
    const rate = checkRateLimit(`admin-login:${ip}`, 30, 60_000);
    if (!rate.allowed) {
      return securityHeaders(
        new NextResponse("Too many requests. Please wait a moment and try again.", {
          status: 429,
        }),
      );
    }
  }

  const isAdminRoute = pathname.startsWith("/admin");

  const isAdminLogin = pathname === "/admin/login";

  if (isAdminRoute && !isAdminLogin && !isAdminUser) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return securityHeaders(NextResponse.redirect(loginUrl));
  }

  if (isAdminLogin && isAdminUser) {
    return securityHeaders(NextResponse.redirect(new URL("/admin", req.url)));
  }

  return securityHeaders(NextResponse.next());
});

export const config = {
  matcher: ["/admin/:path*"],
};
