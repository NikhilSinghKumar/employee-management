import jwt from "jsonwebtoken";

export function authenticateToken(req) {
  const authHeader = req.headers.get("authorization"); // Correct way to access headers in Next.js
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return {
      success: false,
      statusCode: 403,
      message: "Access denied. No token provided.",
    };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { success: true, user: decoded };
  } catch (error) {
    return {
      success: false,
      statusCode: 401,
      message: "Invalid token.",
    };
  }
}
