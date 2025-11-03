import { NextResponse } from "next/server";
import { parse } from "cookie";
import jwt from "jsonwebtoken";

export async function GET(request) {
  const cookies = request.headers.get("cookie");
  if (!cookies)
    return NextResponse.json(
      { success: false, message: "No cookies found" },
      { status: 401 }
    );

  const { token } = parse(cookies);
  if (!token)
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return NextResponse.json({
      success: true,
      user: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        allowed_sections: decoded.allowedSections,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Invalid token" },
      { status: 403 }
    );
  }
}
