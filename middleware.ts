// middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

interface UserPublicMetadata {
  hasSeenTutorial?: boolean;
  // Add other metadata properties if needed
}

export default clerkMiddleware((auth, req) => {
  const { userId, sessionClaims } = auth();
  const url = req.nextUrl;

  // Public routes
  const publicRoutes = [
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhook",
    "/api/send-email",
    "/api/signup-success-after-refer"
  ];

  if (publicRoutes.some(route => new RegExp(route).test(url.pathname))) {
    return NextResponse.next();
  }

  // Protect non-public routes
  if (!userId) {
    const signInUrl = new URL("/sign-in", url.origin);
    signInUrl.searchParams.set("redirect_url", `${url.pathname}${url.search}`);
    return NextResponse.redirect(signInUrl);
  }

  // Type assertion for session claims
  const metadata = sessionClaims?.public_metadata as UserPublicMetadata | undefined;

  // For authenticated users going to /chat without tutorial flag
  if (userId && url.pathname === "/chat" && !url.searchParams.has("tutorial")) {
    if (!metadata?.hasSeenTutorial) {
      const newUrl = new URL(url);
      newUrl.searchParams.set("tutorial", "true");
      return NextResponse.redirect(newUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};