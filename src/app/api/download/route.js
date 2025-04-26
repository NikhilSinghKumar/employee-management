import { supabase } from "@/utils/supabaseClient";
import * as XLSX from "xlsx";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch data from Supabase
    const { data: employees, error } = await supabase
      .from("employees")
      .select("*");

    if (error) {
      console.error("Supabase fetch error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch employee data" },
        { status: 500 }
      );
    }

    if (!employees || employees.length === 0) {
      return NextResponse.json(
        { success: false, error: "No data found" },
        { status: 404 }
      );
    }

    // Convert data to Excel format
    const worksheet = XLSX.utils.json_to_sheet(employees);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Disposition": "attachment; filename=employees.xlsx",
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
