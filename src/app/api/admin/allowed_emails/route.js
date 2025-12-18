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
    if (!["super_admin", "admin"].includes(user.role)) {
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
    if (user.role === "admin") {
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
      ?.find((c) => c.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      );
    }

    const auth = await authenticateToken(token);
    const userRole = auth.user.role || "";
    const ROLE_SUPER = "super_admin";
    const ROLE_ADMIN = "admin";

    // ✅ Allow only super_admin or admin
    if (!auth.success || (userRole !== ROLE_SUPER && userRole !== ROLE_ADMIN)) {
      return NextResponse.json(
        { message: "Access denied. Admin only." },
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

    // ✅ Admins cannot create Super Admins
    if (userRole === ROLE_ADMIN && role === ROLE_SUPER) {
      return NextResponse.json(
        { message: "Access denied. Admins cannot add Super Admins." },
        { status: 403 }
      );
    }

    // ✅ Check if email already exists
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

    // ✅ Insert new record
    const { error: insertError } = await supabase
      .from("allowed_emails")
      .insert([
        {
          email,
          role,
          allowed_sections: allowed_sections || [],
          is_active: true,
          is_deleted: false,
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
    // 1) extract token
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

    // 2) authenticate
    const auth = await authenticateToken(token);
    if (!auth || !auth.success || !auth.user) {
      return NextResponse.json(
        { message: "Invalid token or authentication failed." },
        { status: 401 }
      );
    }

    const userRole = auth.user.role;
    const ROLE_SUPER = "super_admin";
    const ROLE_ADMIN = "admin";

    // 3) parse body
    const { email, role, allowed_sections, is_active } = await req.json();
    if (!email) {
      return NextResponse.json(
        { message: "Email is required." },
        { status: 400 }
      );
    }

    // 4) ensure caller is admin or super_admin
    if (![ROLE_SUPER, ROLE_ADMIN].includes(userRole)) {
      return NextResponse.json(
        { message: "Access denied. Admins only." },
        { status: 403 }
      );
    }

    // 5) fetch target user's current role (to enforce restrictions)
    const { data: target, error: targetErr } = await supabase
      .from("allowed_emails")
      .select("role")
      .eq("email", email)
      .maybeSingle();

    if (targetErr) {
      console.error("Error fetching target:", targetErr);
      return NextResponse.json({ message: "Server error." }, { status: 500 });
    }

    // if no target found, return 404
    if (!target) {
      return NextResponse.json(
        { message: "Target email not found." },
        { status: 404 }
      );
    }

    const targetRole = (target.role || "").toString().toLowerCase();

    // 6) Admin-specific restrictions:
    // - Admin cannot modify super_admin accounts
    // - Admin cannot elevate anyone to super_admin
    if (userRole === ROLE_ADMIN) {
      if (targetRole === ROLE_SUPER) {
        return NextResponse.json(
          { message: "Admins cannot modify super admin accounts." },
          { status: 403 }
        );
      }

      // if admin is trying to set role to super_admin, block it
      if (role && role.toString().toLowerCase() === ROLE_SUPER) {
        return NextResponse.json(
          { message: "Admins cannot assign super_admin role." },
          { status: 403 }
        );
      }
    }

    // 7) build update payload (only include provided fields)
    const updatePayload = {
      ...(role !== undefined && { role }),
      ...(allowed_sections !== undefined && { allowed_sections }),
      ...(is_active !== undefined && { is_active }),
    };

    // 8) perform updates in a safe order
    const { error: allowEmailError } = await supabase
      .from("allowed_emails")
      .update(updatePayload)
      .eq("email", email);

    if (allowEmailError) {
      console.error("allowed_emails update error:", allowEmailError);
      throw allowEmailError;
    }

    const { error: userError } = await supabase
      .from("users")
      .update(updatePayload)
      .eq("email", email);

    if (userError) {
      console.error("users table update error:", userError);
      throw userError;
    }

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
    // 1️⃣ Extract token
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

    // 2️⃣ Authenticate
    const auth = await authenticateToken(token);
    const userRole = auth?.user?.role || "";
    const ROLE_SUPER = "super_admin";
    const ROLE_ADMIN = "admin";

    if (!auth.success || !userRole) {
      return NextResponse.json(
        { message: "Invalid or missing role." },
        { status: 403 }
      );
    }

    // 3️⃣ Validate input
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json(
        { message: "Email is required." },
        { status: 400 }
      );
    }

    // 4️⃣ Allow only Super Admins and Admins
    if (![ROLE_SUPER, ROLE_ADMIN].includes(userRole)) {
      return NextResponse.json(
        { message: "Access denied. Admins only." },
        { status: 403 }
      );
    }

    // 5️⃣ Fetch target user's role
    const { data: target, error: targetErr } = await supabase
      .from("allowed_emails")
      .select("role")
      .eq("email", email)
      .maybeSingle();

    if (targetErr) throw targetErr;

    if (!target) {
      return NextResponse.json(
        { message: "Target email not found." },
        { status: 404 }
      );
    }

    const targetRole = target.role?.trim() || "";

    // 6️⃣ Prevent Admins from deleting Super Admins
    if (userRole === ROLE_ADMIN && targetRole === ROLE_SUPER) {
      return NextResponse.json(
        { message: "Admins cannot delete Super Admin accounts." },
        { status: 403 }
      );
    }

    // 7️⃣ Perform soft delete
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
