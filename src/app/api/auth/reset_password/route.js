import { NextResponse } from "next/server";
import { pool } from "@/utils/db";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
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

async function getDBConnection() {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
}

export async function POST(req) {
  let connection;
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

    // Verify JWT (this handles token expiration)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    connection = await getDBConnection();

    // Check token (without reset_token_expires)
    const [users] = await connection.query(
      "SELECT * FROM users WHERE email = ? AND reset_token = ?",
      [email, token]
    );
    if (users.length === 0) {
      return NextResponse.json(
        { message: "Invalid or expired token." },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear token in a transaction
    await connection.beginTransaction();
    try {
      await connection.query(
        "UPDATE users SET password = ?, reset_token = NULL WHERE email = ?",
        [hashedPassword, email]
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }

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
  } finally {
    if (connection) connection.release();
  }
}
