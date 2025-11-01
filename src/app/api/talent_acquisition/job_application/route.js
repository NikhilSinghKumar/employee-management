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

export async function GET(req) {
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

  // ✅ Extract search query from URL
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  try {
    let query = supabase
      .from("job_applicant")
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    // ✅ Apply search filter if user provided one
    if (search.trim() !== "") {
      query = query.or(
        `job_id.ilike.%${search}%,applicant_name.ilike.%${search}%,applicant_status.ilike.%${search}%, applicant_city.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(
      { success: true, applications: data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
