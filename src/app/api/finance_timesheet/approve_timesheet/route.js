import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";
import { cookies } from "next/headers";
import { authenticateToken } from "@/lib/auth/authenticateToken";

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return { success: false, error: "Unauthorized: No token provided" };
  }

  return authenticateToken(token);
}

export async function POST(req) {
  try {
    // 1️⃣ Authenticate
    const auth = await verifyAuth();

    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error || "Unauthorized" },
        { status: 401 }
      );
    }

    // 2️⃣ Authorize (Finance, Admin, SUper Admin only)
    const allowedRoles = ["finance", "admin", "super_admin"];

    if (!allowedRoles.includes(auth.user.role)) {
      return NextResponse.json(
        {
          error: "Forbidden: You are not allowed to approve timesheet",
        },
        { status: 403 }
      );
    }

    // 3️⃣ Read payload
    const { clientNumber, month, year } = await req.json();

    if (!clientNumber || !month || !year) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 4️⃣ Approve safely (pending → approved)
    const { data, error } = await supabase
      .from("generated_timesheet_summary")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: auth.user.id,
      })
      .eq("client_number", clientNumber)
      .eq("timesheet_month", `${year}-${month}-01`)
      .eq("status", "pending")
      .select("uid");

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Timesheet not in pending state or not found" },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Approve timesheet error:", err);
    return NextResponse.json(
      { error: "Failed to approve timesheet" },
      { status: 500 }
    );
  }
}
