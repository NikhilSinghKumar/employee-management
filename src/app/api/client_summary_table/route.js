import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticateToken } from "@/lib/auth/authenticateToken";
import { supabase } from "@/utils/supabaseClient";

async function verifyAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return { success: false, error: "Unauthorized: No token provided" };
    }
    const authResult = await authenticateToken(token);
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error || "Unauthorized: Invalid token",
      };
    }
    return { success: true, user: authResult.user };
  } catch (error) {
    console.error("Error in verifyAuth:", error.message);
    return { success: false, error: "Authentication failed" };
  }
}

export async function GET(request) {
  try {
    const authResult = await verifyAuth();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const client_number = searchParams.get("client_number");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!client_number || !month || !year) {
      return NextResponse.json(
        {
          error:
            "Missing required parameters: client_number, month, and year are required",
        },
        { status: 400 }
      );
    }

    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    if (
      isNaN(monthNum) ||
      monthNum < 1 ||
      monthNum > 12 ||
      isNaN(yearNum) ||
      yearNum < 2000 ||
      yearNum > 9999
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid parameters: month must be 1-12, year must be a valid 4-digit number",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("client_summary_table")
      .select("*")
      .eq("client_number", client_number)
      .eq("month", monthNum.toString().padStart(2, "0"))
      .eq("year", yearNum.toString());

    if (error) {
      console.error("Supabase query failed:", error.message);

      let userFriendlyError = "Something went wrong. Please try again.";

      if (
        error.message.includes("duplicate key value") &&
        error.message.includes(
          "generated_timesheet_employee_id_timesheet_month_key"
        )
      ) {
        userFriendlyError =
          "Timesheet already exists for the selected month and client.";
      }

      return NextResponse.json(
        { error: userFriendlyError, technical: error.message },
        { status: 500 }
      );
    }

    const exists = data && data.length > 0;
    return NextResponse.json({ exists, data }, { status: 200 });
  } catch (error) {
    console.error("Error in GET handler:", error.message);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
