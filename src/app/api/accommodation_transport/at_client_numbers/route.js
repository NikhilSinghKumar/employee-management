import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";
import { authenticateToken } from "@/lib/middleware/auth";
import { cookies } from "next/headers";

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return { success: false, error: "Unauthorized Access!" };
  }

  return await authenticateToken(token);
}

export async function GET() {
  const authResult = await verifyAuth();

  if (!authResult.success) {
    return NextResponse.json(authResult, { status: 401 });
  }

  if (!authResult.user?.userId) {
    return NextResponse.json(
      { result: "User ID not found", success: false },
      { status: 401 }
    );
  }

  try {
    // Fetch only unique client_number values
    const { data, error } = await supabase
      .from("accommodation_transport")
      .select("client_number", { distinct: true })
      .order("client_number", { ascending: true })
      .neq("client_number", null)
      .neq("client_number", "");

    if (error) throw new Error(error.message);

    return NextResponse.json(
      {
        result: "Records retrieved successfully",
        data,
        totalCount: data.length,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Supabase query error:", error);
    return NextResponse.json(
      { result: "Database error", error: error.message, success: false },
      { status: 500 }
    );
  }
}
