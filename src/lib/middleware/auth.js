import { jwtVerify } from "jose";

export async function authenticateToken(token, requiredSection = null) {
  if (!token) {
    return { success: false, message: "No token provided" };
  }

  const SECRET_KEY = process.env.JWT_SECRET
    ? new TextEncoder().encode(process.env.JWT_SECRET)
    : null;

  if (!SECRET_KEY) {
    console.error("JWT_SECRET is missing in environment variables.");
    return { success: false, message: "Server configuration error" };
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const { isActive, allowedSections, role } = payload;

    // Check if the account is active
    if (!isActive) {
      return { success: false, message: "User account is disabled" };
    }

    // Check if the required section is allowed (if specified)
    if (requiredSection && (!allowedSections || !allowedSections.includes(requiredSection))) {
      return { success: false, message: `Access to ${requiredSection} denied` };
    }

    return { success: true, user: payload, role };
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    return { success: false, message: "Invalid token" };
  }
}