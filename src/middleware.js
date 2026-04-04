import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // 1. Role Definitions
    const isAdminOrTeam = token?.role === "ADMIN" || token?.role === "TEAM";
    const isClient = token?.role === "CLIENT";

    // 2. Protect Internal Agency Routes
    // If a Client tries to access /dashboard, /team, /onboarding, or /clients
    const internalRoutes = ["/dashboard", "/team", "/onboarding", "/clients"];
    const isTryingToAccessInternal = internalRoutes.some(route => pathname.startsWith(route));

    if (isTryingToAccessInternal && !isAdminOrTeam) {
      // Redirect Client back to their specific portal
      return NextResponse.redirect(new URL(`/portal/${token.clientId}`, req.url));
    }

    // 3. Protect Cross-Client Portal Access
    // Ensure Client A cannot manually type /portal/client-b-id in the URL
    if (pathname.startsWith("/portal/")) {
      const urlSegments = pathname.split("/");
      const targetClientId = urlSegments[2]; // Gets [clientId] from /portal/[clientId]

      if (isClient && token.clientId !== targetClientId) {
        // Force them back to their own assigned portal
        return NextResponse.redirect(new URL(`/portal/${token.clientId}`, req.url));
      }
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      // The middleware only runs if authorized returns true
      authorized: ({ token }) => !!token, 
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/team/:path*",
    "/onboarding/:path*",
    "/portal/:path*",
    "/clients/:path*",
  ],
};