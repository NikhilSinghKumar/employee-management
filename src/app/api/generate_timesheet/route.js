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
    const decoded = await authenticateToken(token);
    return { success: true, decoded };
  } catch (error) {
    console.error("Error in authenticateToken:", error);
    return { success: false, error: `Invalid token: ${error.message}` };
  }
}

// GET: Retrieve timesheet data
export async function GET(req) {
  // Verify authentication
  const authResult = await verifyAuth();
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const userId = authResult.decoded?.user?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication error: No user ID found in token" },
      { status: 401 }
    );
  }

  // Extract query parameters
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const clientNumber = searchParams.get("clientNumber");

  // Validate inputs
  if (!month || !year || !clientNumber) {
    return NextResponse.json(
      {
        error:
          "Missing required query parameters: month, year, or clientNumber",
      },
      { status: 400 }
    );
  }

  // Validate month (01-12)
  if (!/^(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json(
      { error: "Invalid month: Must be 01-12" },
      { status: 400 }
    );
  }

  // Validate year (2000-2100)
  const yearNum = parseInt(year, 10);
  if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
    return NextResponse.json(
      { error: "Invalid year: Must be between 2000 and 2100" },
      { status: 400 }
    );
  }

  try {
    // Fetch timesheet data
    const { data: timesheets, error: timesheetError } = await supabase
      .from("generated_timesheet")
      .select(
        `
        *,
        employees (id, client_name, basic_salary, total_salary)
      `
      )
      .eq("timesheet_month", `${year}-${month}-01`)
      .eq("employees.client_number", clientNumber);

    if (timesheetError) {
      console.error("Timesheet fetch error:", timesheetError);
      return NextResponse.json(
        { error: `Failed to fetch timesheets: ${timesheetError.message}` },
        { status: 500 }
      );
    }

    if (!timesheets || timesheets.length === 0) {
      return NextResponse.json(
        { error: "No timesheets found for the specified criteria" },
        { status: 404 }
      );
    }

    return NextResponse.json({ timesheets }, { status: 200 });
  } catch (error) {
    console.error("Error in GET timesheet:", error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// POST: Generate timesheets
export async function POST(req) {
  // Verify authentication
  const authResult = await verifyAuth();
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const userId = authResult.decoded?.user?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication error: No user ID found in token" },
      { status: 401 }
    );
  }

  let { month, year, clientNumber } = await req.json();

  if (!month || !year || !clientNumber) {
    return NextResponse.json(
      { error: "Missing required fields: month, year, or clientNumber" },
      { status: 400 }
    );
  }

  // Ensure month is a string and pad it
  month = String(month).padStart(2, "0");
  if (!/^(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json(
      { error: "Invalid month: Must be 01-12" },
      { status: 400 }
    );
  }

  year = parseInt(year, 10);
  if (isNaN(year) || year < 2000 || year > 2100) {
    return NextResponse.json(
      { error: "Invalid year: Must be between 2000 and 2100" },
      { status: 400 }
    );
  }

  if (typeof clientNumber !== "string" || clientNumber.trim() === "") {
    return NextResponse.json(
      { error: "Invalid clientNumber: Must be a non-empty string" },
      { status: 400 }
    );
  }

  try {
    // Check for existing timesheets
    const { data: existingTimesheets, error: checkError } = await supabase
      .from("generated_timesheet")
      .select("uid")
      .eq("timesheet_month", `${year}-${month}-01`)
      .eq("client_number", clientNumber);

    if (checkError) {
      console.error("Timesheet check error:", checkError);
      return NextResponse.json(
        { error: `Failed to check existing timesheets: ${checkError.message}` },
        { status: 500 }
      );
    }

    if (existingTimesheets && existingTimesheets.length > 0) {
      return NextResponse.json(
        {
          error: "Timesheet already exists. Please check!",
          exists: true,
        },
        { status: 409 }
      );
    }

    // Fetch employee data
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("id, basic_salary, total_salary, client_name, iqama_number")
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
      client_number: clientNumber,
      client_name: emp.client_name,
      penalty: 0,
      iqama_number: emp.iqama_number,
    }));

    // Insert timesheet records
    const { error: insertError } = await supabase
      .from("generated_timesheet")
      .insert(timesheetRecords);

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        {
          error: "Failed to generate timesheet",
          technical: insertError.message,
        },
        { status: 500 }
      );
    }

    // Update timesheet summary
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

// PATCH: Update timesheet data
export async function PATCH(req) {
  // Verify authentication
  const authResult = await verifyAuth();
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const userId = authResult.decoded?.user?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication error: No user ID found in token" },
      { status: 401 }
    );
  }

  // Parse request body
  let { timesheetId, updates } = await req.json();

  // Validate inputs
  if (!timesheetId || !updates || typeof updates !== "object") {
    return NextResponse.json(
      { error: "Missing or invalid timesheetId or updates" },
      { status: 400 }
    );
  }

  // Define allowed fields to update
  const allowedFields = [
    "working_days",
    "overtime_hrs",
    "absent_hrs",
    "incentive",
    "etmam_cost",
    "edited_by",
  ];
  const updateKeys = Object.keys(updates);

  // Validate that only allowed fields are being updated
  const invalidFields = updateKeys.filter(
    (key) => !allowedFields.includes(key)
  );
  if (invalidFields.length > 0) {
    return NextResponse.json(
      { error: `Invalid fields in updates: ${invalidFields.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    // Verify timesheet exists
    const { data: timesheet, error: fetchError } = await supabase
      .from("generated_timesheet")
      .select("uid, timesheet_month, employee_id")
      .eq("uid", timesheetId)
      .single();

    if (fetchError || !timesheet) {
      console.error("Timesheet fetch error:", fetchError);
      return NextResponse.json(
        { error: "Timesheet not found" },
        { status: 404 }
      );
    }

    // Update timesheet
    const { error: updateError } = await supabase
      .from("generated_timesheet")
      .update({ ...updates, edited_by: userId })
      .eq("uid", timesheetId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: `Failed to update timesheet: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Optionally update summary if needed
    const { timesheet_month, employee_id } = timesheet;
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("client_number")
      .eq("id", employee_id)
      .single();

    if (empError || !employee) {
      console.error("Employee fetch error:", empError);
      return NextResponse.json(
        { error: "Failed to fetch employee data" },
        { status: 500 }
      );
    }

    const { error: summaryError } = await supabase.rpc(
      "update_timesheet_summary_manual",
      {
        p_timesheet_month: timesheet_month,
        p_client_number: employee.client_number,
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
      { message: "Timesheet updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in PATCH timesheet:", error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}
