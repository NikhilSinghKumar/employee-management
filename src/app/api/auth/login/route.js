import { NextResponse } from "next/server";
import { createConnection } from "@/utils/db";
import { verifyPassword } from "@/utils/auth";
import jwt from "jsonwebtoken";

export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password are required." },
      { status: 400 }
    );
  }

  try {
    const db = await createConnection();
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const user = users[0];
    const verifiedPassword = await verifyPassword(password, user.password);
    if (!verifiedPassword) {
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return NextResponse.json(
      { message: "Login successful.", token },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ message: "Database error." }, { status: 500 });
  }
}
