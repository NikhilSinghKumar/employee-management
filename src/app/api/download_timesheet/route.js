import { supabase } from "@/utils/supabaseClient";
import { authenticateToken } from "@/lib/auth/authenticateToken";
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
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("iqama_number, name, hra, tra, food_allowance, other_allowance")
      .eq("client_number", clientNumber);

    if (empError) throw empError;
    if (!employees || employees.length === 0) {
      return new Response("No employees found for the given client number", {
        status: 404,
      });
    }

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

    const { data: timesheets, error: tsError } = await supabase
      .from("generated_timesheet")
      .select("*, iqama_number")
      .eq("client_number", clientNumber)
      .eq("timesheet_month", timesheetMonth);

    if (tsError) throw tsError;
    if (!timesheets || timesheets.length === 0) {
      return new Response("No timesheets found for the given period", {
        status: 404,
      });
    }

    const { data: summary, error: sumError } = await supabase
      .from("generated_timesheet_summary")
      .select(
        "client_name, adjusted_salary_sum, etmam_cost_sum, vat_sum, grand_total, employee_count"
      )
      .eq("client_number", clientNumber)
      .eq("timesheet_month", timesheetMonth)
      .single();

    if (sumError) throw sumError;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Timesheet");

    // --- Top Section: Client Info ---
    const topRows = [
      ["Client Name", summary.client_name],
      ["Client Number", clientNumber],
      ["Payroll", `${month}-${year}`],
      ["Employee Count", summary.employee_count],
    ];
    topRows.forEach((rowData) => {
      const row = worksheet.addRow(rowData);
      row.font = { bold: true };
      row.getCell(1).alignment = { horizontal: "left" };
      row.getCell(2).alignment = { horizontal: "left" };
      row.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFDEEAF6" },
      };
    });
    worksheet.addRow([]);

    // --- Logo ---
    try {
      const logoPath = path.join(process.cwd(), "public", "etmam_logo.png");
      const logoBuffer = await fs.readFile(logoPath);
      const logoId = workbook.addImage({
        buffer: logoBuffer,
        extension: "png",
      });
      worksheet.addImage(logoId, {
        tl: { col: 14, row: 0 },
        ext: { width: 250, height: 80 },
      });
    } catch (error) {
      console.warn(
        "Failed to load logo from public/etmam_logo.png:",
        error.message
      );
    }

    // --- Header Row ---
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
      "Penalty",
      "Deductions",
      "Incentives",
      "ETMAM Fees",
      "Adj. ETMAM Fees",
      "Net Salary",
      "Total Cost",
      "Remarks",
    ]);
    headerRow.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4A90E2" },
    };
    headerRow.height = 20;
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // --- Data Rows ---
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
        ts.penalty,
        ts.deductions,
        ts.incentive,
        ts.etmam_cost,
        ts.adjusted_etmam_cost,
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

    worksheet.addRow([]); // Gap before summary

    // --- Summary Section ---
    const summaryTitle = worksheet.addRow(["Summary"]);
    worksheet.mergeCells(summaryTitle.number, 1, summaryTitle.number, 2);
    summaryTitle.font = { bold: true, size: 12 };
    summaryTitle.getCell(1).alignment = { horizontal: "center" };
    summaryTitle.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9EAD3" },
    };

    const summaryRows = [
      ["Net Salary Summary", summary.adjusted_salary_sum],
      ["Etmam Fees", summary.etmam_cost_sum],
      ["Taxes", summary.vat_sum],
      ["Grand Total", summary.grand_total],
    ];

    summaryRows.forEach(([label, value], idx) => {
      const row = worksheet.addRow([label, value]);
      row.font = { bold: true };
      row.getCell(1).alignment = { horizontal: "left" };
      row.getCell(2).alignment = { horizontal: "right" };
      row.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: idx % 2 === 0 ? "FFF3F3F3" : "FFE2EFDA" },
      };
      row.getCell(2).numFmt = "##0.00";
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // --- Column Widths & Alignment ---
    worksheet.getColumn(1).width = 20;
    worksheet.getColumn(2).width = 30;
    worksheet.columns = worksheet.columns.map(() => ({ width: 15 }));
    worksheet.eachRow((row) => {
      row.eachCell((cell, colNumber) => {
        if (colNumber !== 1) {
          cell.alignment = { horizontal: "center" };
        }
      });
    });

    // --- Export Excel ---
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
