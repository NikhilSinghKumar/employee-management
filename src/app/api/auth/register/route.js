import { hashPassword } from "@/utils/auth";
import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
};

export async function POST(req) {
  const { firstName, lastName, email, password } = await req.json();

  if (!firstName || !lastName || !email || !password) {
    return Response.json({
      success: false,
      message: "All fields are required.",
    });
  }

  const hashedPassword = await hashPassword(password);

  const connection = await mysql.createConnection(dbConfig);
  try {
    await connection.execute(
      "INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)",
      [firstName, lastName, email, hashedPassword]
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
