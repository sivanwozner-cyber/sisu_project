import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { IS_DEMO } from "@/lib/demo";

// Protects pages (not /api — API routes self-enforce via getSessionUser → 401).
export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    // Authenticated but profile incomplete → force onboarding.
    if (token && !token.profileComplete && pathname !== "/onboarding") {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    // Completed profile shouldn't sit on onboarding.
    if (token && token.profileComplete && pathname === "/onboarding") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: { authorized: ({ token }) => !!token },
    pages: { signIn: "/login" },
  },
);

export const config = {
  // Everything except: /login, the NextAuth API, and Next static assets.
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico).*)"],
};
