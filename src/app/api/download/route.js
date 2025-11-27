import { supabase } from "@/utils/supabaseClient";
import ExcelJS from "exceljs";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("searchQuery") || "";
    let employees;

    if (searchQuery) {
      // Use the data sent in the request body (search results)
      employees = await request.json();
    } else {
      // Fetch all employees from Supabase
      const { data, error } = await supabase.from("employees").select("*");
      if (error) {
        console.error("Supabase fetch error:", error);
        return NextResponse.json(
          { success: false, error: "Failed to fetch employee data" },
          { status: 500 }
        );
      }
      if (!data || data.length === 0) {
        return NextResponse.json(
          { success: false, error: "No data found" },
          { status: 404 }
        );
      }
      employees = data;
    }

    employees = employees.filter(
      (emp) => String(emp.is_deleted).toUpperCase() !== "TRUE"
    );

    // Format data for Excel, including computed totalAllowance and formatted dates
    const formattedData = employees.map((employee, index) => ({
      "Sr. No.": index + 1,
      "ET No.": employee.et_number || "",
      "IQAMA No": employee.iqama_number || "",
      Name: employee.name || "",
      "Passport No.": employee.passport_number || "",
      Profession: employee.profession || "",
      Nationality: employee.nationality || "",
      "Client No.": employee.client_number || "",
      "Client Name": employee.client_name || "",
      Mobile: employee.mobile || "",
      Email: employee.email || "",
      "Bank Account": employee.bank_account || "",
      "Basic Salary": employee.basic_salary || "",
      Allowance:
        employee.totalAllowance ||
        (
          Number(employee.hra || 0) +
          Number(employee.tra || 0) +
          Number(employee.food_allowance || 0) +
          Number(employee.other_allowance || 0)
        ).toFixed(2),
      "Total Salary": employee.total_salary || "",
      "Medical Type": employee.medical || "",
      "Start Date": employee.contract_start_date
        ? new Date(employee.contract_start_date).toLocaleDateString("en-GB")
        : "",
      "End Date": employee.contract_end_date
        ? new Date(employee.contract_end_date).toLocaleDateString("en-GB")
        : "",
      Status: employee.employee_status || "",
      Source: employee.employee_source || "",
    }));

    // Create a new Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Employees");

    // Define columns
    worksheet.columns = [
      { header: "Sr. No.", key: "Sr. No.", width: 10 },
      { header: "ET No.", key: "ET No.", width: 15 },
      { header: "IQAMA No", key: "IQAMA No", width: 15 },
      { header: "Name", key: "Name", width: 20 },
      { header: "Passport No.", key: "Passport No.", width: 15 },
      { header: "Profession", key: "Profession", width: 15 },
      { header: "Nationality", key: "Nationality", width: 15 },
      { header: "Client No.", key: "Client No.", width: 15 },
      { header: "Client Name", key: "Client Name", width: 20 },
      { header: "Mobile", key: "Mobile", width: 15 },
      { header: "Email", key: "Email", width: 25 },
      { header: "Bank Account", key: "Bank Account", width: 20 },
      { header: "Basic Salary", key: "Basic Salary", width: 15 },
      { header: "Allowance", key: "Allowance", width: 15 },
      { header: "Total Salary", key: "Total Salary", width: 15 },
      { header: "Medical Type", key: "Medical Type", width: 15 },
      { header: "Start Date", key: "Start Date", width: 15 },
      { header: "End Date", key: "End Date", width: 15 },
      { header: "Status", key: "Status", width: 15 },
      { header: "Source", key: "Source", width: 15 },
    ];

    // Style the header row (Tailwind CSS-like styling)
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "D1D5DB" }, // Tailwind's gray-200
      };
      cell.font = {
        bold: true,
        color: { argb: "8B0000" }, // Tailwind's red-900 for text
        size: 12,
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Add data rows
    formattedData.forEach((row) => {
      const newRow = worksheet.addRow(row);
      newRow.eachCell((cell) => {
        cell.alignment = { vertical: "middle", horizontal: "left" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Apply alternating row colors (like Tailwind's odd:bg-white even:bg-gray-50)
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 1) {
        // Skip header row
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor:
              rowNumber % 2 === 0 ? { argb: "F9FAFB" } : { argb: "FFFFFF" }, // gray-50 for even, white for odd
          };
        });
      }
    });

    // Generate Excel buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": "attachment; filename=employees.xlsx",
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
