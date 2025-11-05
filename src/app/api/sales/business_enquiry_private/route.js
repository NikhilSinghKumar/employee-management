import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";
import { cookies } from "next/headers";
import { authenticateToken } from "@/lib/auth/authenticateToken";

// 🔐 Authentication helper
async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return { success: false, error: "Unauthorized: No token provided" };
  }
  return authenticateToken(token);
}

export async function GET(req) {
  // ✅ Authenticate user
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

  // ✅ Extract optional search query
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";

  try {
    // 🧩 Base Supabase query
    let query = supabase
      .from("business_enquiry")
      .select(
        `
        id,
        company_name,
        contact_person_name,
        company_cr_number,
        mobile_no,
        email_id,
        request_type,
        description,
        is_deleted,
        created_at
        `
      )
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    // 🔍 Optional search filter (case-insensitive, partial match)
    if (search !== "") {
      query = query.or(
        `company_name.ilike.%${search}%,contact_person_name.ilike.%${search}%,company_cr_number.ilike.%${search}%,mobile_no.ilike.%${search}%,email_id.ilike.%${search}%,request_type.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(
      { success: true, enquiries: data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching business enquiries:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
