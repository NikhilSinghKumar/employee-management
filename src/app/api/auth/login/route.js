import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";
import { verifyPassword } from "@/utils/auth";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password are required." },
      { status: 400 }
    );
  }

  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .limit(1);

    if (error) {
      console.error("Supabase error:", error.message);
      return NextResponse.json({ message: "Database error." }, { status: 500 });
    }

    if (!users || users.length === 0) {
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
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Set token as HTTP-only cookie
    const response = NextResponse.json(
      { message: "Login successful.", token },
      { status: 200 }
    );

    response.headers.append(
      "Set-Cookie",
      serialize("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        path: "/",
        maxAge: 60 * 60, // 1 hour
      })
    );

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Database error." }, { status: 500 });
  }
}
