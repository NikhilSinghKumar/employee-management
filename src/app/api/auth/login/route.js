import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";
import { verifyPassword } from "@/utils/auth";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

export async function POST(request) {
  const { email, password } = await request.json();

  // Validate required fields
  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password are required." },
      { status: 400 }
    );
  }

  try {
    // Check if email is authorized and active in allowed_emails
    const { data: allowedEmail, error: allowedError } = await supabase
      .from("allowed_emails")
      .select("email, is_active")
      .eq("email", email.toLowerCase())
      .single();

    if (allowedError || !allowedEmail) {
      return NextResponse.json(
        { message: "Email not authorized." },
        { status: 403 }
      );
    }
    if (!allowedEmail.is_active) {
      return NextResponse.json(
        { message: "Email access is restricted." },
        { status: 403 }
      );
    }

    // Fetch user details
    const { data: users, error: userFetchError } = await supabase
      .from("users")
      .select("id, email, password, allowed_sections, role, is_active")
      .eq("email", email.toLowerCase())
      .limit(1);

    if (userFetchError) {
      console.error("Supabase error:", userFetchError.message);
      return NextResponse.json(
        { message: "Database error." },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    const user = users[0];
    const verifiedPassword = await verifyPassword(password, user.password);

    if (!verifiedPassword) {
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }

    // Check if user account is active
    if (!user.is_active) {
      return NextResponse.json(
        { message: "User account is disabled." },
        { status: 403 }
      );
    }

    // Generate JWT token with additional claims
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        allowedSections: user.allowed_sections,
        role: user.role,
        isActive: user.is_active,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Set token as HTTP-only cookie
    const response = NextResponse.json(
      { message: "Login successful." },
      { status: 200 }
    );

    response.headers.append(
      "Set-Cookie",
      serialize("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60, // 1 hour
      })
    );

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Server error." },
      { status: 500 }
    );
  }
}