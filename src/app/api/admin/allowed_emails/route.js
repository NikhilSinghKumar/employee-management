import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";
import { authenticateToken } from "@/lib/auth/authenticateToken";

export async function GET(req) {
  try {
    // Extract cookie header and parse token
    const cookieHeader = req.headers.get("cookie");
    let token = null;
    if (cookieHeader) {
      const cookies = cookieHeader
        .split("; ")
        .find((row) => row.startsWith("token="));
      token = cookies?.split("=")[1];
    }

    if (!token) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      );
    }

    const authResult = await authenticateToken(token);

    if (!authResult.success || authResult.user.role !== "super_admin") {
      return NextResponse.json(
        { message: "Super admin access required." },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("allowed_emails")
      .select("email, allowed_sections, is_active")
      .order("id", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Fetch allowed emails error:", error);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
