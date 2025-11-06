import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";
import { cookies } from "next/headers";
import { authenticateToken } from "@/lib/auth/authenticateToken";

// 🔐 Optional authentication helper
async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return { success: false, error: "Unauthorized: No token provided" };
  }
  return authenticateToken(token);
}

// ✅ PATCH — Update status
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    // optional auth
    const cookieHeader = req.headers.get("cookie");
    const token = cookieHeader
      ?.split("; ")
      ?.find((c) => c.startsWith("token="))
      ?.split("=")[1];
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ Update in Supabase
    const { data, error } = await supabase
      .from("business_enquiry")
      .update({ status })
      .eq("id", id)
      .select();

    if (error) throw error;

    // ✅ Return consistent shape
    return NextResponse.json({
      success: true,
      message: "Status updated successfully",
      data,
    });
  } catch (error) {
    console.error("PATCH /business_enquiry_private/:id error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// 🗑️ Soft delete API
export async function DELETE(req, { params }) {
  try {
    // ✅ Authenticate (if you want public access, remove these lines)
    const authResult = await verifyAuth();
    if (!authResult.success) {
      return NextResponse.json(authResult, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing enquiry ID" },
        { status: 400 }
      );
    }

    // ✅ Perform soft delete
    const { data, error } = await supabase
      .from("business_enquiry")
      .update({ is_deleted: true })
      .eq("id", id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "No record found for this ID" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Business enquiry soft deleted successfully",
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error in soft delete:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
