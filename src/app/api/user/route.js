import { NextResponse } from "next/server";
import { pool } from "@/utils/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET; // Use ENV variable

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Decode JWT to get userId
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch (error) {
      console.error("JWT Verification Failed:", error);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Get a database connection
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        "SELECT first_name FROM users WHERE id = ?",
        [userId]
      );

      connection.release();

      if (rows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({ first_name: rows[0].first_name });
    } catch (queryError) {
      connection.release();
      console.error("Database query error:", queryError);
      return NextResponse.json(
        { error: "Database query failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
