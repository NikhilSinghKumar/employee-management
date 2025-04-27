import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { supabase } from "@supabase/supabase-js";
import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";

// Validate environment variables
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in .env.local");
}

// Rate limiter: 5 attempts per hour per token
const rateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60 * 60, // 1 hour
});

export async function POST(req) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { message: "Token and password are required." },
        { status: 400 }
      );
    }

    // Rate limiting
    await rateLimiter.consume(token);

    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { message: "Password must contain both letters and numbers." },
        { status: 400 }
      );
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    // Check token validity
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("reset_token", token)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { message: "Invalid or expired token." },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    const { error: updateError } = await supabase
      .from("users")
      .update({ password: hashedPassword, reset_token: null })
      .eq("email", email);

    if (updateError) {
      throw updateError;
    }

    // Clear token cookie
    const response = NextResponse.json(
      { message: "Password reset successfully." },
      { status: 200 }
    );
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Reset password error:", error.message, error.stack);

    if (error instanceof RateLimiterRes) {
      return NextResponse.json(
        { message: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    if (error.name === "TokenExpiredError") {
      return NextResponse.json(
        { message: "Token has expired." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message:
          process.env.NODE_ENV === "production"
            ? "Server error."
            : "Server error: " + error.message,
      },
      { status: 500 }
    );
  }
}
