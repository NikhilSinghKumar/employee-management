import { NextResponse } from "next/server";
import { authenticateToken } from "./lib/auth/authenticateToken"; // helper logic only

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // 1. Public routes (login, register) → allow access
  const publicRoutes = ["/", "/register"];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  try {
    // 2. Block direct access if no auth token (Prevents direct URL visits)
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // 3. Verify token for authentication
    const authResult = await authenticateToken(token);
    if (!authResult.success) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // 4. Role-based protected routes (Authorization)
    const protectedRoutes = {
      "/dashboard": "dashboard",
      "/operations": "operations",
      "/human_resource": "human_resource",
      "/accommodation_transport": "accommodation_transport",
      "/admin": "admin",
    };

    const requiredSection = Object.keys(protectedRoutes).find((route) =>
      pathname.startsWith(route)
    );

    if (requiredSection) {
      const sectionAuth = await authenticateToken(
        token,
        protectedRoutes[requiredSection]
      );
      if (!sectionAuth.success) {
        return NextResponse.redirect(
          new URL(
            `/unauthorized?error=${encodeURIComponent(sectionAuth.message)}`,
            request.url
          )
        );
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware Error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}

// 5. Apply middleware only to protected routes
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/operations/:path*",
    "/human_resource/:path*",
    "/accommodation_transport/:path*",
    "/admin/:path*",
  ],
};
