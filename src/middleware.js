import { NextResponse } from "next/server";
import { authenticateToken } from "./lib/middleware/auth";

export async function middleware(request) {
  // Add /edit_employee to protected routes
  const protectedRoutes = [
    "/services",
    "/employee_list",
    "/add_employee",
    "/edit_employee",
  ];
  const authRoutes = ["/", "/register"];
  const pathname = request.nextUrl.pathname;

  // Allow auth routes without checking token
  if (authRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  try {
    const token = request.cookies.get("token")?.value;
    console.log("Middleware Token:", token); // Debugging

    // Ensure authResult always has a success property
    const authResult = token
      ? await authenticateToken(token)
      : { success: false };
    console.log("Auth Result:", authResult); // Debugging

    // Check if the pathname starts with any protected route
    if (
      protectedRoutes.some((route) => pathname.startsWith(route)) &&
      !authResult.success
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  } catch (error) {
    console.error("Middleware Error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Update matcher to include /edit_employee/:id
export const config = {
  matcher: [
    "/services/:path*",
    "/employee_list/:path*",
    "/add_employee/:path*",
    "/edit_employee/:path*",
  ],
};
