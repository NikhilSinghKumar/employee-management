import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    { message: "Logout successful." },
    { status: 200 }
  );

  // Next.js' built-in cookie handling
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    path: "/",
    expires: new Date(0), // Expire immediately
  });

  return response;
}
