import { hashPassword } from "@/utils/auth";
import pool from "@/utils/db";

export async function POST(req) {
  const { firstName, lastName, email, password } = await req.json();

  if (!firstName || !lastName || !email || !password) {
    return Response.json({
      success: false,
      message: "All fields are required.",
    });
  }

  try {
    const hashedPassword = await hashPassword(password);

    await pool.query(
      `INSERT INTO users (first_name, last_name, email, password)
       VALUES ($1, $2, $3, $4)`,
      [firstName, lastName, email, hashedPassword]
    );

    return Response.json({
      success: true,
      message: "User registered successfully.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return Response.json({
      success: false,
      message: "Registration failed.",
      error: error.message,
    });
  }
}
