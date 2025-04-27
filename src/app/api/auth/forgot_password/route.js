import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in .env.local");
}
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  throw new Error("EMAIL_USER and EMAIL_PASS must be set in .env.local");
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json(
        { message: "Email is required." },
        { status: 400 }
      );
    }

    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
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

    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const { error: updateError } = await supabase
      .from("users")
      .update({ reset_token: resetToken })
      .eq("email", email);

    if (updateError) {
      throw updateError;
    }

    const resetLink = `${process.env.NEXT_PUBLIC_API_BASE_URL}/reset_password?token=${resetToken}`;

    await transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      text: `Click this link to reset your password: ${resetLink}\nThis link expires in 1 hour.`,
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    });

    return NextResponse.json(
      { message: "Reset link sent to your email." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password API error:", error.message, error.stack);
    if (error.code === "EAUTH") {
      return NextResponse.json(
        { message: "Email authentication failed. Check credentials." },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}
