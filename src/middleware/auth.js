import jwt from "jsonwebtoken";

export function authenticateToken(req) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return { success: false, message: "Access denied. No token provided." };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { success: true, user: decoded };
  } catch (error) {
    return { success: false, message: "Invalid token." };
  }
}
