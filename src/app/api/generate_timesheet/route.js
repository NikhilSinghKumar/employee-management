import { supabase } from "@/utils/supabaseClient";
import { authenticateToken } from "@/lib/auth/authenticateToken";
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
  // ---------- AUTH ----------
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

  // Read request body
  let { month, year, clientNumber } = await req.json();

  // ---------- SECURE 15-DAY WINDOW ----------
  const now = new Date();
  const todayDay = now.getDate();
  let allowedDate = new Date(now);

  if (todayDay <= 15) {
    allowedDate.setMonth(allowedDate.getMonth() - 1);
  }

  const allowedMonth = String(allowedDate.getMonth() + 1).padStart(2, "0");
  const allowedYear = allowedDate.getFullYear().toString();

  if (month !== allowedMonth || year.toString() !== allowedYear) {
    return NextResponse.json(
      {
        error: `Not allowed! You can only generate timesheet for ${allowedYear}-${allowedMonth}.`,
        allowed: { month: allowedMonth, year: allowedYear },
        received: { month, year },
      },
      { status: 403 }
    );
  }

  // ---------- VALIDATION ----------
  if (!month || !year || !clientNumber) {
    return NextResponse.json(
      { error: "Missing required fields: month, year, clientNumber" },
      { status: 400 }
    );
  }

  month = String(month).padStart(2, "0");
  if (!/^(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json(
      { error: "Invalid month (01–12)" },
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

  const monthStart = `${year}-${month}-01`;

  // Utility: Calculate working days
  function calculateWorkingDays(
    contractStart,
    contractEnd,
    empStatus,
    inactiveDate,
    monthStart
  ) {
    // Convert to pure date (UTC)
    function toUTC(dateStr) {
      const d = new Date(dateStr);
      return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    }

    const ms = toUTC(monthStart);
    const me = new Date(Date.UTC(ms.getUTCFullYear(), ms.getUTCMonth() + 1, 0));

    function dayBefore(dateStr) {
      const d = toUTC(dateStr);
      d.setUTCDate(d.getUTCDate() - 1);
      return d;
    }

    // -------------------------------------
    // CASE 1: Missing any contract dates
    // -------------------------------------
    if (!contractStart || !contractEnd) {
      if (empStatus === "inactive" && inactiveDate) {
        const lastWorking = dayBefore(inactiveDate);

        if (lastWorking < ms) return 0;

        const end = lastWorking < me ? lastWorking : me;

        return Math.floor((end - ms) / (1000 * 60 * 60 * 24)) + 1;
      }

      return Math.min(Math.floor((me - ms) / (1000 * 60 * 60 * 24)) + 1, 30);
    }

    // -------------------------------------
    // CASE 2: Normal case
    // -------------------------------------
    const cs = toUTC(contractStart);
    const ce = toUTC(contractEnd);

    if (ce < ms) return 0;

    let activeStart = cs > ms ? cs : ms;
    let activeEnd = ce < me ? ce : me;

    if (empStatus === "inactive" && inactiveDate) {
      const lastWorking = dayBefore(inactiveDate);
      if (lastWorking < activeEnd) activeEnd = lastWorking;
    }

    if (activeEnd < activeStart) return 0;

    const diff =
      Math.floor((activeEnd - activeStart) / (1000 * 60 * 60 * 24)) + 1;

    return Math.min(diff, 30);
  }

  try {
    // ---------- CHECK EXISTING ----------
    const { data: existingTimesheets, error: checkError } = await supabase
      .from("generated_timesheet")
      .select("uid")
      .eq("timesheet_month", monthStart)
      .eq("client_number", clientNumber);

    if (checkError) {
      return NextResponse.json(
        { error: `Timesheet check error: ${checkError.message}` },
        { status: 500 }
      );
    }

    if (existingTimesheets?.length > 0) {
      return NextResponse.json(
        { error: "Timesheet already exists.", exists: true },
        { status: 409 }
      );
    }

    // ---------- FETCH EMPLOYEES ----------
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select(
        `
        id, name, nationality, profession, basic_salary, total_salary, client_name, iqama_number,
        contract_start_date, contract_end_date,
        employee_status, inactive_date
      `
      )
      .eq("is_deleted", false)
      .eq("client_number", clientNumber);

    if (empError) {
      return NextResponse.json(
        { error: `Employee fetch error: ${empError.message}` },
        { status: 500 }
      );
    }

    if (!employees || employees.length === 0) {
      return NextResponse.json(
        { error: "No employees found for this client number" },
        { status: 404 }
      );
    }
    /* Fetch quotations for the client */

    const { data: quotations, error: quotationError } = await supabase
      .from("quotation_list")
      .select(`client_number,client_name,nationality,profession,etmam_cost`)
      .eq("client_number", clientNumber)
      .eq("is_deleted", false);

    if (quotationError) {
      return NextResponse.json(
        { error: `Quotation fetch failed: ${quotationError.message}` },
        { status: 500 }
      );
    }

    if (!quotations || quotations.length === 0) {
      return NextResponse.json(
        { error: "No quotation configured for this client" },
        { status: 400 }
      );
    }

    /* lookup map */
    const quotationMap = new Map();

    quotations.forEach((q) => {
      const key = `${q.client_number}|${q.nationality}|${q.profession}`;
      quotationMap.set(key, q);
    });

    // ---------- GENERATE TIMESHEET RECORDS ----------
    const timesheetRecords = employees
      .map((emp) => {
        const workingDays = calculateWorkingDays(
          emp.contract_start_date,
          emp.contract_end_date,
          emp.employee_status,
          emp.inactive_date,
          monthStart
        );

        if (workingDays === 0) return null;

        const quotationKey = `${clientNumber}|${emp.nationality}|${emp.profession}`;
        const quotation = quotationMap.get(quotationKey);

        if (!quotation) {
          throw new Error(
            `Missing quotation for employee ${emp.name} (${emp.nationality}, ${emp.profession})`
          );
        }

        return {
          employee_id: emp.id,
          timesheet_month: monthStart,
          working_days: workingDays,
          overtime_hrs: 0,
          absent_hrs: 0,

          basic_salary: emp.basic_salary,
          total_salary: emp.total_salary,

          incentive: 0,
          etmam_cost: quotation.etmam_cost, // ✅ FROM QUOTATION
          penalty: 0,

          generated_by: userId,
          edited_by: userId,

          client_number: emp.client_number,
          client_name: quotation.client_name,

          iqama_number: emp.iqama_number,
          employee_name: emp.name,
        };
      })
      .filter(Boolean);

    if (timesheetRecords.length === 0) {
      return NextResponse.json(
        {
          error: "No employees eligible for timesheet generation.",
          debug_employees: employees,
        },
        { status: 400 }
      );
    }

    // ---------- INSERT ----------
    const { error: insertError } = await supabase
      .from("generated_timesheet")
      .insert(timesheetRecords, {
        upsert: true,
        conflict: "iqama_number,client_number,timesheet_month",
      });

    if (insertError) {
      return NextResponse.json(
        {
          error: "Failed to generate timesheet",
          technical: insertError.message,
        },
        { status: 500 }
      );
    }

    // ---------- SUMMARY UPDATE ----------
    const { error: summaryError } = await supabase.rpc(
      "update_timesheet_summary_manual",
      {
        p_timesheet_month: monthStart,
        p_client_number: clientNumber,
      }
    );

    if (summaryError) {
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
    "penalty",
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
