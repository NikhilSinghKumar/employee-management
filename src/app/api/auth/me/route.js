import { NextResponse } from "next/server";
import { parse } from "cookie";
import jwt from "jsonwebtoken";

export async function GET(request) {
  const cookies = request.headers.get("cookie");
  if (!cookies)
    return NextResponse.json({ message: "No cookies found" }, { status: 401 });

  const { token } = parse(cookies);
  if (!token)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return NextResponse.json({ userId: decoded.userId });
  } catch (error) {
    return NextResponse.json({ message: "Invalid token" }, { status: 403 });
  }
}
