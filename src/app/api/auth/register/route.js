import { hashPassword } from "@/utils/auth";
import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
};

export async function POST(req) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return Response.json({
      success: false,
      message: "Email and password are required.",
    });
  }

  const hashedPassword = await hashPassword(password);

  const connection = await mysql.createConnection(dbConfig);
  try {
    await connection.execute(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, hashedPassword]
    );
    return Response.json({
      success: true,
      message: "User registered successfully.",
    });
  } catch (error) {
    return Response.json({
      success: false,
      message: "Registration failed.",
      error: error.message,
    });
  } finally {
    await connection.end();
  }
}
