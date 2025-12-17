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

    // 2️⃣ Authorize (Finance only)
    if (auth.user.role !== "finance") {
      return NextResponse.json(
        { error: "Forbidden: Finance only" },
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
    const { error } = await supabase
      .from("generated_timesheet_summary")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: auth.user.id,
      })
      .eq("client_number", clientNumber)
      .eq("timesheet_month", `${year}-${month}-01`)
      .eq("status", "pending");

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Approve timesheet error:", err);
    return NextResponse.json(
      { error: "Failed to approve timesheet" },
      { status: 500 }
    );
  }
}
