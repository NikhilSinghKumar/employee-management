import { jwtVerify } from "jose";

export async function authenticateToken(token) {
  if (!token) {
    return { success: false };
  }

  const SECRET_KEY = process.env.JWT_SECRET
    ? new TextEncoder().encode(process.env.JWT_SECRET)
    : null;

  if (!SECRET_KEY) {
    console.error("JWT_SECRET is missing in environment variables.");
    return { success: false };
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return { success: true, user: payload };
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    return { success: false };
  }
}
