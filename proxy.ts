import { clerkMiddleware, clerkClient, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk",
]);

export default clerkMiddleware(async (auth, req) => {
  try {
    const { userId } = await auth();

    // Allow public routes
    if (!userId && isPublicRoute(req)) {
      return NextResponse.next();
    }

    // Block unauthenticated users
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const role = user.publicMetadata.role as string | undefined;

    if (
      role === "admin" &&
      req.nextUrl.pathname === "/dashboard"
    ) {
      return NextResponse.redirect(
        new URL("/admin/dashboard", req.url)
      );
    }

    if (
      role !== "admin" &&
      req.nextUrl.pathname.startsWith("/admin")
    ) {
      return NextResponse.redirect(
        new URL("/dashboard", req.url)
      );
    }

    if (isPublicRoute(req)) {
      return NextResponse.redirect(
        new URL(
          role === "admin"
            ? "/admin/dashboard"
            : "/dashboard",
          req.url
        )
      );
    }

    return NextResponse.next();
  } catch (err) {
    console.error(err);

    return new Response("Internal Server Error", {
      status: 500,
    });
  }
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};