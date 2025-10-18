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
    const page = parseInt(url.searchParams.get("page")) || 1;
    const pageSize = parseInt(url.searchParams.get("pageSize")) || 10;

    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    let query = supabase
      .from("employee_request")
      .select("*", { count: "exact" })
      .eq("is_deleted", false);

    // Apply status filter
    if (statusFilter) {
      query = query.eq("cm_status", statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const search = `%${searchTerm}%`;
      query = query.or(
        `cm_name.ilike.${search},cm_email.ilike.${search},cm_passport_iqama.ilike.${search},cm_city.ilike.${search},id_as_text.ilike.${search},cm_mobile_no.ilike.${search}`
      );
    }

    // Apply ordering and pagination
    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(start, end);

    if (error) throw error;

    return NextResponse.json(
      { success: true, data, totalCount: count || 0 },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching cases:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
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
    const body = await request.json();
    const { id, cm_status } = body;

    if (!id || !cm_status) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (id, cm_status)" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("employee_request")
      .update({ cm_status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: "Status updated successfully", data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating case status:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
