import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid"; // Add uuid package for unique tokens

// Environment validation
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in .env.local");
}
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  throw new Error("EMAIL_USER and EMAIL_PASS must be set in .env.local");
}
if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL must be set in .env.local");
}

// Rate limiting (simple in-memory limit, consider Redis for production)
const requestLimits = new Map();
const MAX_REQUESTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true", // Use TLS if true
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === "production", // Enforce strict TLS in production
  },
});

export async function POST(req) {
  const clientIp = req.headers.get("x-forwarded-for") || req.socket.remoteAddress;
  const requestKey = `${clientIp}_${req.url}`;
  const now = Date.now();

  // Rate limiting check
  const requests = requestLimits.get(requestKey) || [];
  requests.push(now);
  requestLimits.set(
    requestKey,
    requests.filter((time) => now - time < WINDOW_MS)
  );
  if (requests.length > MAX_REQUESTS) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json(
        { message: "Email is required." },
        { status: 400 }
      );
    }

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
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id, email, is_active")
      .eq("email", email.toLowerCase())
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { message: "Email not found." },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Check if user account is active
    if (!user.is_active) {
      return NextResponse.json(
        { message: "User account is disabled." },
        { status: 403 }
      );
    }

    // Generate a unique reset token with JWT
    const resetTokenId = uuidv4(); // Unique identifier
    const resetToken = jwt.sign(
      { email, resetTokenId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Update reset token in users table
    const { error: updateError } = await supabase
      .from("users")
      .update({ reset_token: resetToken })
      .eq("email", email.toLowerCase());

    if (updateError) {
      throw updateError;
    }

    // Send reset email
    const resetLink = `${process.env.NEXT_PUBLIC_API_BASE_URL}/reset_password?token=${resetToken}`;
    await transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      text: `Click this link to reset your password: ${resetLink}\nThis link expires in 1 hour.`,
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    });

    // Log the reset request
    await supabase.from("logs").insert({
      event: "password_reset_requested",
      user_email: email,
      created_by: user.id,
    });

    return NextResponse.json(
      { message: "Reset link sent to your email." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password API error:", error.message, error.stack);
    let status = 500;
    let message = "Server error";
    if (error.code === "EAUTH") {
      message = "Email authentication failed. Check credentials.";
    } else if (error.name === "JsonWebTokenError") {
      message = "Invalid token configuration.";
    }
    return NextResponse.json({ message }, { status });
  }
}