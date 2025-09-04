// middleware.ts
import { clerkMiddleware, auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface UserPublicMetadata {
  hasSeenTutorial?: boolean;
  admin?: boolean;
  // Add other metadata properties if needed
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, sessionClaims } = await auth();
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

  // Check if user is trying to access admin routes
  if (url.pathname.startsWith('/admin')) {
    if (!metadata?.admin) {
      // Redirect non-admins away from admin routes
      return NextResponse.redirect(new URL('/', url.origin));
    }
  }

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