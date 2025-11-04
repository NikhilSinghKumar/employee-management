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
    const userRole = authResult?.user?.role || "";
    const userEmail = authResult?.user?.email?.toLowerCase();

    const ROLE_SUPER = "super_admin";
    const ROLE_ADMIN = "Admin";

    // ✅ Allow both Super Admin & Admin
    if (
      !authResult.success ||
      (userRole !== ROLE_SUPER && userRole !== ROLE_ADMIN)
    ) {
      return NextResponse.json(
        { message: "Access denied. Admin only." },
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

    // ✅ Protected emails (cannot be restricted)
    const protectedEmails = [userEmail, "nikhilsk369@gmail.com"];

    // ✅ Admins cannot affect Super Admins
    let filterQuery = supabase
      .from("allowed_emails")
      .update({ is_active })
      .not("email", "in", `(${protectedEmails.join(",")})`)
      .eq("is_deleted", false);

    if (userRole === ROLE_ADMIN) {
      filterQuery = filterQuery.neq("role", ROLE_SUPER); // block affecting super_admins
    }

    const { error: allowedError } = await filterQuery;
    if (allowedError) throw allowedError;

    // ✅ Update users table similarly
    let userUpdateQuery = supabase
      .from("users")
      .update({ is_active })
      .not("email", "in", `(${protectedEmails.join(",")})`);

    if (userRole === ROLE_ADMIN) {
      // Prevent affecting super_admins in users table
      userUpdateQuery = userUpdateQuery.neq("role", ROLE_SUPER);
    }

    const { error: userError } = await userUpdateQuery;
    if (userError) throw userError;

    // ✅ Log the event
    await supabase.from("logs").insert({
      event: is_active ? "all_emails_enabled" : "all_emails_restricted",
      user_email: userEmail,
      created_by: authResult.user.userId,
    });

    return NextResponse.json(
      {
        message: `All emails ${
          is_active ? "enabled" : "restricted"
        } successfully.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Restrict all emails error:", error);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
