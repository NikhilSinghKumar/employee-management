import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";
import { cookies } from "next/headers";
import { authenticateToken } from "@/lib/middleware/auth";

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return { success: false, error: "Unauthorized: No token provided" };
  }

  return authenticateToken(token);
}

export async function GET(request) {
  const authResult = await verifyAuth();
  if (!authResult.success) {
    return NextResponse.json(authResult, { status: 401 });
  }

  if (!authResult.user?.userId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("status");
    const searchTerm = url.searchParams.get("search");

    let query = supabase
      .from("employee_request")
      .select("*")
      .eq("is_deleted", false);

    // Apply status filter
    if (statusFilter) {
      query = query.eq("cm_status", statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const search = `%${searchTerm}%`;
      query = query.or(
        `cm_name.ilike.${search},cm_email.ilike.${search},cm_city.ilike.${search},id_as_text.ilike.${search},cm_mobile_no.ilike.${search}`
      );
    }
    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    // Always return { data: [...] } for frontend consistency
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching cases:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
