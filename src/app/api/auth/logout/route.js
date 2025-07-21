import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    { message: "Logout successful." },
    { status: 200 }
  );
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict", // Try "Lax" if issues persist
    path: "/",
    expires: new Date(0),
  });
  return response;
}
