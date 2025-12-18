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
          error:
            "Forbidden: You are not allowed to send revision to operations",
        },
        { status: 403 }
      );
    }

    // 3️⃣ Read payload
    const { clientNumber, month, year, revisionReason } = await req.json();

    if (!clientNumber || !month || !year || !revisionReason?.trim()) {
      return NextResponse.json(
        { error: "Revision reason is required" },
        { status: 400 }
      );
    }

    // 4️⃣ Update safely (pending → revision_required)
    const { data, error } = await supabase
      .from("generated_timesheet_summary")
      .update({
        status: "revision_required",
        revision_reason: revisionReason.trim(),
        approved_at: null,
        approved_by: null,
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
    console.error("Revision request error:", err);
    return NextResponse.json(
      { error: "Failed to send for revision" },
      { status: 500 }
    );
  }
}
