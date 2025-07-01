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

export async function GET(req) {
  const authResult = await verifyAuth();
  if (!authResult.success) {
    return new Response(authResult.error, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientNumber = searchParams.get("clientNumber");
  const year = searchParams.get("year");
  const month = searchParams.get("month");

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

    // Fetch employees
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("iqama_number, name, hra, tra, food_allowance, other_allowance")
      .eq("client_number", clientNumber);

    if (empError) {
      console.error("Employee query error:", empError);
      throw empError;
    }
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

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Timesheet");

    // Top section
    const topRows = [
      ["Client Name:", summary.client_name],
      ["Client Number:", clientNumber],
      ["Payroll:", `${month}-${year}`],
      ["Employee Count:", summary.employee_count],
    ];
    topRows.forEach((rowData) => {
      const row = worksheet.addRow(rowData);
      row.getCell(1).alignment = { horizontal: "left" }; // Left align first column
    });
    worksheet.addRow([]);

    // Add logo
    try {
      const logoPath = path.join(process.cwd(), "public", "etmam_logo.png");
      const logoBuffer = await fs.readFile(logoPath);
      const logoId = workbook.addImage({
        buffer: logoBuffer,
        extension: "png",
      });
      worksheet.addImage(logoId, {
        tl: { col: 14, row: 0 },
        ext: { width: 200, height: 90 },
      });
    } catch (error) {
      console.warn(
        "Failed to load logo from public/etmam_logo.png:",
        error.message
      );
    }

    // Header row
    const headerRow = worksheet.addRow([
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
    ]);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4A90E2" },
    };
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Data rows
    timesheets.forEach((ts, index) => {
      const emp = employeeMap[ts.iqama_number] || {
        name: "NOT FOUND",
        allowance: 0,
      };
      const row = worksheet.addRow([
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
      if (index % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F5F5" },
        };
      }
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Add gap row
    worksheet.addRow([]);

    // Summary section
    const summaryRow = worksheet.addRow(["Summary"]); // Add "Summary" header
    worksheet.mergeCells(summaryRow.number, 1, summaryRow.number, 2); // Merge cells A and B
    summaryRow.font = { bold: true };
    summaryRow.getCell(1).alignment = { horizontal: "center" }; // Center the merged header

    const summaryRows = [
      ["Net Salary Summary:", summary.adjusted_salary_sum],
      ["Etmam Fees:", summary.etmam_cost_sum],
      ["Taxes:", summary.vat_sum],
      ["Grand Total:", summary.grand_total],
    ];
    summaryRows.forEach((rowData) => {
      const row = worksheet.addRow(rowData);
      row.font = { bold: true };
      row.getCell(1).alignment = { horizontal: "left" }; // Left align first column
      row.getCell(2).alignment = { horizontal: "right" }; // Right align values
      row.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF8891FE" },
      };
    });

    // Column widths and alignment
    worksheet.columns = Array(16).fill({ width: 15 });
    worksheet.eachRow((row) => {
      row.eachCell((cell, colNumber) => {
        if (colNumber !== 1) {
          // Skip first column to preserve left alignment
          cell.alignment = { horizontal: "center" };
        }
      });
    });

    // Export to buffer
    const buffer = await workbook.xlsx.writeBuffer();
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
