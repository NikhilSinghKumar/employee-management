// src/app/api/generate_timesheet/route.js
import { supabase } from "@/utils/supabaseClient";
import { authenticateToken } from "@/lib/middleware/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Verify JWT token
async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return { success: false, error: "Unauthorized: No token provided" };
  }
  try {
    const decoded = await authenticateToken(token); // Returns { success: true, user: { userId: 1, ... } }
    return { success: true, decoded };
  } catch (error) {
    console.error("Error in authenticateToken:", error);
    return { success: false, error: `Invalid token: ${error.message}` };
  }
}

export async function POST(req) {
  // Verify authentication
  const authResult = await verifyAuth();
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  // Extract userId
  const userId = authResult.decoded?.user?.userId;
  if (!userId) {
    console.error("Invalid authResult structure:", authResult);
    return NextResponse.json(
      { error: "Authentication error: No user ID found in token" },
      { status: 401 }
    );
  }

  // Parse and validate request body
  let { month, year, clientNumber } = await req.json();

  // Validate inputs
  if (!month || !year || !clientNumber) {
    return NextResponse.json(
      { error: "Missing required fields: month, year, or clientNumber" },
      { status: 400 }
    );
  }

  // Validate month (01-12)
  month = month.padStart(2, "0");
  if (!/^(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json(
      { error: "Invalid month: Must be 01-12" },
      { status: 400 }
    );
  }

  // Validate year (e.g., 2000-2100)
  year = parseInt(year, 10);
  if (isNaN(year) || year < 2000 || year > 2100) {
    return NextResponse.json(
      { error: "Invalid year: Must be between 2000 and 2100" },
      { status: 400 }
    );
  }

  // Validate clientNumber
  if (typeof clientNumber !== "string" || clientNumber.trim() === "") {
    return NextResponse.json(
      { error: "Invalid clientNumber: Must be a non-empty string" },
      { status: 400 }
    );
  }

  try {
    // Fetch employees for the given clientNumber
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("id, basic_salary, total_salary, client_name")
      .eq("client_number", clientNumber);

    if (empError) {
      console.error("Employee fetch error:", empError);
      return NextResponse.json(
        { error: `Failed to fetch employees: ${empError.message}` },
        { status: 500 }
      );
    }

    if (!employees || employees.length === 0) {
      return NextResponse.json(
        { error: "No employees found for this client number" },
        { status: 404 }
      );
    }
    // Prepare timesheet records
    const timesheetRecords = employees.map((emp) => ({
      employee_id: emp.id,
      timesheet_month: `${year}-${month}-01`,
      working_days: 30,
      overtime_hrs: 0,
      absent_hrs: 0,
      basic_salary: emp.basic_salary,
      total_salary: emp.total_salary,
      incentive: 100,
      etmam_cost: 1000,
      generated_by: userId,
      edited_by: userId,
    }));
    // Insert timesheet records
    const { error: insertError } = await supabase
      .from("generated_timesheet")
      .insert(timesheetRecords);

    if (insertError) {
      console.error("Insert error:", insertError);

      let userFriendlyError = "Something went wrong. Please try again.";

      if (
        insertError.message.includes("duplicate key value") &&
        insertError.message.includes(
          "generated_timesheet_employee_id_timesheet_month_key"
        )
      ) {
        userFriendlyError =
          "Timesheet already exists for the selected month and client.";
      }

      return NextResponse.json(
        { error: userFriendlyError, technical: insertError.message },
        { status: 500 }
      );
    }

    // Update or insert summary record
    const { error: summaryError } = await supabase.rpc(
      "update_timesheet_summary_manual",
      {
        p_timesheet_month: `${year}-${month}-01`,
        p_client_number: clientNumber,
      }
    );

    if (summaryError) {
      console.error("Summary error:", summaryError);
      return NextResponse.json(
        { error: `Failed to update summary: ${summaryError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Timesheet generated successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in generate_timesheet:", error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}
