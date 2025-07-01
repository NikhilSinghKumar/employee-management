import { supabase } from "@/utils/supabaseClient";
import { authenticateToken } from "@/lib/middleware/auth";
import { cookies } from "next/headers";
import ExcelJS from "exceljs";
import fs from "fs/promises";
import path from "path";

// --- Auth ---
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

// --- API Handler ---
export async function GET(req) {
  const authResult = await verifyAuth();
  if (!authResult.success) {
    return new Response(authResult.error, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientNumber = searchParams.get("clientNumber");
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  console.log("Query parameters:", { clientNumber, year, month });

  if (!clientNumber || !year || !month) {
    return new Response("Missing query parameters", { status: 400 });
  }

  const timesheetMonth = `${year}-${month.padStart(2, "0")}-01`;

  try {
    // Test Supabase connection
    const { data: testData, error: testError } = await supabase
      .from("employees")
      .select("count")
      .single();
    console.log("Supabase connection test:", { testData, testError });

    // Fetch employees
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("iqama_number, name, hra, tra, food_allowance, other_allowance")
      .eq("client_number", clientNumber);

    if (empError) {
      console.error("Employee query error:", empError);
      throw empError;
    }

    console.log("Fetched employees:", employees);
    if (!employees || employees.length === 0) {
      console.warn("No employees found for client_number:", clientNumber);
      return new Response("No employees found for the given client number", {
        status: 404,
      });
    }

    // Build employee lookup
    const employeeMap = {};
    employees.forEach((emp) => {
      const allowance =
        (parseFloat(emp.hra) || 0) +
        (parseFloat(emp.tra) || 0) +
        (parseFloat(emp.food_allowance) || 0) +
        (parseFloat(emp.other_allowance) || 0);

      console.log("Employee allowance calculation:", {
        iqama_number: emp.iqama_number,
        name: emp.name,
        hra: emp.hra,
        tra: emp.tra,
        food_allowance: emp.food_allowance,
        other_allowance: emp.other_allowance,
        total_allowance: allowance,
      });

      employeeMap[emp.iqama_number] = {
        name: emp.name,
        allowance,
      };
    });

    // Fetch timesheets
    const { data: timesheets, error: tsError } = await supabase
      .from("generated_timesheet")
      .select("*, iqama_number")
      .eq("client_number", clientNumber)
      .eq("timesheet_month", timesheetMonth);

    if (tsError) {
      console.error("Timesheet query error:", tsError);
      throw tsError;
    }

    console.log(
      "Fetched timesheets:",
      timesheets.map((ts) => ({
        iqama_number: ts.iqama_number,
        employee_id: ts.employee_id,
        client_number: ts.client_number,
        timesheet_month: ts.timesheet_month,
      }))
    );

    if (!timesheets || timesheets.length === 0) {
      console.warn(
        "No timesheets found for client_number and month:",
        clientNumber,
        timesheetMonth
      );
      return new Response("No timesheets found for the given period", {
        status: 404,
      });
    }

    // Fetch summary
    const { data: summary, error: sumError } = await supabase
      .from("generated_timesheet_summary")
      .select(
        "client_name, adjusted_salary_sum, etmam_cost_sum, vat_sum, grand_total, employee_count"
      )
      .eq("client_number", clientNumber)
      .eq("timesheet_month", timesheetMonth)
      .single();

    if (sumError) {
      console.error("Summary query error:", sumError);
      throw sumError;
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Timesheet");

    // Top section
    worksheet.addRow(["Client Name:", summary.client_name]);
    worksheet.addRow(["Client Number:", clientNumber]);
    worksheet.addRow(["Payroll:", `${month}-${year}`]);
    worksheet.addRow(["Employee Count:", summary.employee_count]);
    worksheet.addRow([]);

    // Add logo from public folder
    try {
      const logoPath = path.join(process.cwd(), "public", "etmam_logo.png");
      const logoBuffer = await fs.readFile(logoPath);
      const logoId = workbook.addImage({
        buffer: logoBuffer,
        extension: "png",
      });
      worksheet.addImage(logoId, {
        tl: { col: 12, row: 0 }, // Position in top-right corner
        ext: { width: 100, height: 50 }, // Adjust size as needed
      });
      console.log("Logo added successfully from public/etmam_logo.png");
    } catch (error) {
      console.warn(
        "Failed to load logo from public/etmam_logo.png:",
        error.message
      );
    }

    // Header row
    worksheet.addRow([
      "S. No.",
      "Iqama Number",
      "Employee Name",
      "Basic Salary",
      "Allowance",
      "Total Salary",
      "Working Days",
      "Overtime Hrs",
      "Overtime",
      "Absent Hrs",
      "Deductions",
      "Incentives",
      "Etmam Fees",
      "Net Salary",
      "Total Cost",
      "Remarks",
    ]).font = { bold: true };

    // Data rows
    timesheets.forEach((ts, index) => {
      console.log("Processing timesheet:", { iqama_number: ts.iqama_number });
      const emp = employeeMap[ts.iqama_number] || {
        name: "NOT FOUND",
        allowance: 0,
      };
      if (!employeeMap[ts.iqama_number]) {
        console.warn(`No employee found for iqama_number: ${ts.iqama_number}`);
      }

      worksheet.addRow([
        index + 1,
        ts.iqama_number,
        emp.name,
        ts.basic_salary,
        emp.allowance,
        ts.total_salary,
        ts.working_days,
        ts.overtime_hrs,
        ts.overtime,
        ts.absent_hrs,
        ts.deductions,
        ts.incentive,
        ts.etmam_cost,
        ts.adjusted_salary,
        ts.total_cost,
        "",
      ]);
    });

    // Summary section
    worksheet.addRow([]);
    worksheet.addRow(["Net Salary Summary:", summary.adjusted_salary_sum]);
    worksheet.addRow(["Etmam Fees:", summary.etmam_cost_sum]);
    worksheet.addRow(["Taxes:", summary.vat_sum]);
    worksheet.addRow(["Grand Total:", summary.grand_total]);

    // Formatting
    worksheet.columns = Array(16).fill({ width: 15 });

    // Export to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return as download
    return new Response(buffer, {
      headers: {
        "Content-Disposition": `attachment; filename=Timesheet_${clientNumber}_${year}_${month}.xlsx`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Error generating timesheet Excel:", error);
    return new Response(`Failed to generate Excel file: ${error.message}`, {
      status: 500,
    });
  }
}
