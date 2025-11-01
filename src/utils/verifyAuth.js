import { cookies } from "next/headers";
import { authenticateToken } from "@/lib/auth/authenticateToken";

export async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return { success: false, error: "Unauthorized: No token provided" };
  }

  try {
    const decoded = await authenticateToken(token);
    return { success: true, decoded };
  } catch (error) {
    return { success: false, error: `Invalid token: ${error.message}` };
  }
}
