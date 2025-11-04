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
    const user = authResult?.user;

    if (!authResult.success || !user?.role) {
      return NextResponse.json(
        { message: "Invalid or missing role." },
        { status: 403 }
      );
    }

    // Only allow super_admin or admin
    if (!["super_admin", "Admin"].includes(user.role)) {
      return NextResponse.json(
        { message: "Access denied. Admins only." },
        { status: 403 }
      );
    }

    // Base query
    let query = supabase
      .from("allowed_emails")
      .select("email, role, allowed_sections, is_active")
      .eq("is_deleted", false)
      .order("id", { ascending: true });

    // If user is admin, exclude super_admin emails
    if (user.role === "Admin") {
      query = query.neq("role", "super_admin");
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Fetch allowed emails error:", error);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const cookieHeader = req.headers.get("cookie");
    const token = cookieHeader
      ?.split("; ")
      .find((c) => c.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      );
    }

    const auth = await authenticateToken(token);
    if (!auth.success || auth.user.role !== "super_admin") {
      return NextResponse.json(
        { message: "Super admin access required." },
        { status: 403 }
      );
    }

    const { email, role, allowed_sections } = await req.json();
    if (!email || !role) {
      return NextResponse.json(
        { message: "Email and role are required." },
        { status: 400 }
      );
    }

    // ✅ Duplicate email check
    const { data: existingEmail } = await supabase
      .from("allowed_emails")
      .select("email")
      .eq("email", email)
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { message: "Email already exists." },
        { status: 409 }
      );
    }

    // ✅ Insert new email
    const { error: insertError } = await supabase
      .from("allowed_emails")
      .insert([
        {
          email,
          role,
          allowed_sections: allowed_sections || [],
          is_active: true,
        },
      ]);

    if (insertError) {
      console.error("Insert failed:", insertError);
      throw insertError;
    }

    return NextResponse.json(
      { message: "Email added successfully!" },
      { status: 201 }
    );
  } catch (err) {
    console.error("Add email error:", err);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}

// ✅ PATCH (Update Role or Sections or is_active)
export async function PATCH(req) {
  try {
    // ✅ 1. Extract Token
    const cookieHeader = req.headers.get("cookie");
    const token =
      cookieHeader
        ?.split("; ")
        .find((c) => c.startsWith("token="))
        ?.split("=")[1] || null;

    if (!token) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      );
    }

    // ✅ 2. Authenticate Token & Check Role
    const auth = await authenticateToken(token);
    if (!auth.success || auth.user.role !== "super_admin") {
      return NextResponse.json(
        { message: "Super admin access required." },
        { status: 403 }
      );
    }

    // ✅ 3. Input Validation
    const { email, role, allowed_sections, is_active } = await req.json();
    if (!email) {
      return NextResponse.json(
        { message: "Email is required." },
        { status: 400 }
      );
    }

    // ✅ 4. Update allowed_emails Table
    const { error: allowEmailError } = await supabase
      .from("allowed_emails")
      .update({
        ...(role !== undefined && { role }),
        ...(allowed_sections !== undefined && { allowed_sections }),
        ...(is_active !== undefined && { is_active }),
      })
      .eq("email", email);

    if (allowEmailError) throw allowEmailError;

    // ✅ 5. Update users Table
    const { error: userError } = await supabase
      .from("users")
      .update({
        ...(role !== undefined && { role }),
        ...(allowed_sections !== undefined && { allowed_sections }),
        ...(is_active !== undefined && { is_active }),
      })
      .eq("email", email);

    if (userError) throw userError;

    // ✅ 6. Success Response
    return NextResponse.json(
      { message: "Updated successfully." },
      { status: 200 }
    );
  } catch (err) {
    console.error("Update error:", err);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}

// ✅ DELETE (Soft delete = is_deleted = true)
export async function DELETE(req) {
  try {
    const cookieHeader = req.headers.get("cookie");
    const token = cookieHeader
      ?.split("; ")
      .find((c) => c.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      );
    }

    const auth = await authenticateToken(token);
    if (!auth.success || auth.user.role !== "super_admin") {
      return NextResponse.json(
        { message: "Super admin access required." },
        { status: 403 }
      );
    }

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json(
        { message: "Email is required." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("allowed_emails")
      .update({ is_deleted: true, is_active: false })
      .eq("email", email);

    if (error) throw error;

    return NextResponse.json(
      { message: "Email deleted successfully." },
      { status: 200 }
    );
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
