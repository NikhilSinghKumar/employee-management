import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";
import { authenticateToken } from "@/lib/auth/authenticateToken";

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

    const { email, is_active } = await req.json();
    if (!email || typeof is_active !== "boolean") {
      return NextResponse.json(
        { message: "Email and is_active are required." },
        { status: 400 }
      );
    }

    // Protect nikhilsk369@gmail.com from being restricted by another super admin
    if (
      email === "nikhilsk369@gmail.com" &&
      authResult.user.email !== "nikhilsk369@gmail.com"
    ) {
      return NextResponse.json(
        { message: "Cannot restrict this super admin." },
        { status: 403 }
      );
    }

    // Prevent self-restriction
    if (email.toLowerCase() === authResult.user.email.toLowerCase()) {
      return NextResponse.json(
        { message: "Cannot restrict your own email." },
        { status: 403 }
      );
    }

    const { error: allowedError } = await supabase
      .from("allowed_emails")
      .update({ is_active })
      .eq("email", email.toLowerCase());

    if (allowedError) {
      throw allowedError;
    }

    const { error: userError } = await supabase
      .from("users")
      .update({ is_active })
      .eq("email", email.toLowerCase());

    if (userError) {
      throw userError;
    }

    await supabase.from("logs").insert({
      event: is_active ? "email_enabled" : "email_restricted",
      user_email: email,
      created_by: authResult.user.userId,
    });

    return NextResponse.json(
      {
        message: `Email ${email} ${
          is_active ? "enabled" : "restricted"
        } successfully.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Restrict email error:", error);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
