import { NextResponse } from "next/server";
import { pool } from "@/utils/db";
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
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json(
        { message: "Email is required." },
        { status: 400 }
      );
    }

    connection = await getDBConnection();

    const [users] = await connection.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (users.length === 0) {
      return NextResponse.json(
        { message: "Email not found." },
        { status: 404 }
      );
    }

    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    await connection.query("UPDATE users SET reset_token = ? WHERE email = ?", [
      resetToken,
      email,
    ]);

    const resetLink = `/reset_password?token=${resetToken}`;
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
  } finally {
    if (connection) connection.release();
  }
}
