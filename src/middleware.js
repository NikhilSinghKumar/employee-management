import { NextResponse } from "next/server";
import { authenticateToken } from "./lib/middleware/auth";

export async function middleware(request) {
  const authRoutes = ["/", "/register"];
  const pathname = request.nextUrl.pathname;

  if (authRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  try {
    const token = request.cookies.get("token")?.value;

    const authResult = token
      ? await authenticateToken(token)
      : { success: false, message: "No token provided" };

    if (!authResult.success) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const protectedRoutes = {
      "/dashboard/:path*": "dashboard",
      "/operations/:path*": "operations",
      "/etmam_employee_form/:path*": "etmam_employee_form",
      "/etmam_employees/:path*": "etmam_employees",
      "/admin/:path*": "admin",
    };

    const matchingRoute = Object.keys(protectedRoutes).find((route) =>
      pathname.startsWith(route.split(":")[0])
    );
    const requiredSection = matchingRoute ? protectedRoutes[matchingRoute] : null;

    if (requiredSection) {
      const sectionAuthResult = await authenticateToken(token, requiredSection);
      if (!sectionAuthResult.success) {
        return NextResponse.redirect(
          new URL(`/unauthorized?error=${encodeURIComponent(sectionAuthResult.message)}`, request.url)
        );
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware Error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/operations/:path*",
    "/etmam_employee_form/:path*",
    "/etmam_employees/:path*",
    "/admin/:path*"
  ],
};