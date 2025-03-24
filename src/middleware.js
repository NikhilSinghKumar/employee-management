import { NextResponse } from "next/server";
import { authenticateToken } from "./lib/middleware/auth";

export async function middleware(request) {
  const protectedRoutes = ["/services", "/employee_list", "/add_employee"];
  const authRoutes = ["/", "/register"];
  const pathname = request.nextUrl.pathname;

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

// Apply middleware only to protected routes
export const config = {
  matcher: ["/services", "/employee_list", "/add_employee"],
};
