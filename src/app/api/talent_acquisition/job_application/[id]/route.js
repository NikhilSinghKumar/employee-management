import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";
import { cookies } from "next/headers";
import { authenticateToken } from "@/lib/auth/authenticateToken";

// Authentication helper
async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return { success: false, error: "Unauthorized: No token provided" };
  }
  return authenticateToken(token);
}

// PATCH: Update applicant_status
export async function PATCH(request, { params }) {
  const authResult = await verifyAuth();
  if (!authResult.success) {
    return NextResponse.json(authResult, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const { applicant_status } = body;

    // Validate status
    const validStatuses = ["pending", "shortlisted", "rejected", "hired"];
    if (!validStatuses.includes(applicant_status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status value" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("job_applicant")
      .update({ applicant_status })
      .eq("id", id)
      .eq("is_deleted", false)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Applicant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, updated: data[0] },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating applicant status:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// DELETE: Soft delete applicant
export async function DELETE(request, { params }) {
  const authResult = await verifyAuth();
  if (!authResult.success) {
    return NextResponse.json(authResult, { status: 401 });
  }

  const { id } = await params;
  try {
    const { data, error } = await supabase
      .from("job_applicant")
      .update({ is_deleted: true })
      .eq("id", id)
      .eq("is_deleted", false)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Applicant not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, deleted: data[0] },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting applicant:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
