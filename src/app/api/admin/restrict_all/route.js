import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";
import { authenticateToken } from "@/lib/middleware/auth";

export async function POST(req) {
  try {
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

    const { is_active } = await req.json();
    if (typeof is_active !== "boolean") {
      return NextResponse.json(
        { message: "is_active is required." },
        { status: 400 }
      );
    }

    // Define protected emails (cannot be restricted)
    const protectedEmails = [
      authResult.user.email.toLowerCase(),
      "nikhilsk369@gmail.com",
    ];

    const protectedEmailsStr = `(${protectedEmails.join(",")})`;

    // Update allowed_emails table (exclude protected emails)
    const { error: allowedError } = await supabase
      .from("allowed_emails")
      .update({ is_active })
      .not("email", "in", protectedEmailsStr);

    if (allowedError) {
      throw allowedError;
    }

    // Update users table (exclude protected emails)
    const { error: userError } = await supabase
      .from("users")
      .update({ is_active })
      .not("email", "in", protectedEmailsStr);

    if (userError) {
      throw userError;
    }

    // Log the event
    await supabase.from("logs").insert({
      event: is_active ? "all_emails_enabled" : "all_emails_restricted",
      user_email: null,
      created_by: authResult.user.userId,
    });

    return NextResponse.json(
      {
        message: `All emails ${is_active ? "enabled" : "restricted"} successfully.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Restrict all emails error:", error);
    return NextResponse.json(
      { message: "Server error." },
      { status: 500 }
    );
  }
}
