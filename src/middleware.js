import { NextResponse } from "next/server";
import { authenticateToken } from "./lib/middleware/auth";

export async function middleware(request) {
  const authRoutes = ["/", "/register", "/login"]; // Include login as an auth route
  const pathname = request.nextUrl.pathname;

  // Allow auth routes without checking token
  if (authRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  try {
    const token = request.cookies.get("token")?.value;

    // Authenticate token and get user details
    const authResult = token
      ? await authenticateToken(token)
      : { success: false, message: "No token provided" };

    if (!authResult.success) {
      // Redirect to login page with error query param for better UX
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(authResult.message)}`, request.url));
    }

    // Map pathname to base section for section-specific check
    const protectedRoutes = {
      "/services/:path*": "services",
      "/onboarding/:path*": "onboarding",
      "/employee_list/:path*": "employee_list",
      "/add_employee/:path*": "add_employee",
      "/edit_employee/:path*": "edit_employee",
      "/all_timesheet/:path*": "all_timesheet",
      "/timesheet/:path*": "timesheet",
      "/etmam_employee_form/:path*": "etmam_employee_form",
      "/etmam_employees/:path*": "etmam_employees",
      "/edit_timesheet/:path*": "edit_timesheet",
    };

    const matchingRoute = Object.keys(protectedRoutes).find((route) =>
      pathname.startsWith(route.split(":")[0])
    );
    const requiredSection = matchingRoute ? protectedRoutes[matchingRoute] : null;

    // Perform section-specific check if a protected route is matched
    if (requiredSection) {
      const sectionAuthResult = await authenticateToken(token, requiredSection);
      if (!sectionAuthResult.success) {
        return NextResponse.redirect(new URL(`/unauthorized?error=${encodeURIComponent(sectionAuthResult.message)}`, request.url));
      }
    }

    // Allow request to proceed
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware Error:", error);
    return NextResponse.redirect(new URL(`/login?error=Server error`, request.url));
  }
}

export const config = {
  matcher: [
    "/services/:path*",
    "/onboarding/:path*",
    "/employee_list/:path*",
    "/add_employee/:path*",
    "/edit_employee/:path*",
    "/all_timesheet/:path*",
    "/timesheet/:path*",
    "/etmam_employee_form/:path*",
    "/etmam_employees/:path*",
    "/edit_timesheet/:path*",
  ],
};