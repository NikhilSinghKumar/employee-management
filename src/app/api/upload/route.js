import { pool } from "@/utils/db"; // MySQL connection
import * as XLSX from "xlsx";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticateToken } from "@/lib/middleware/auth";

export async function POST(req) {
  try {
    // Extract token from cookies
    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    // Authenticate the token
    const authResult = await authenticateToken(token);
    if (!authResult.success) {
      return NextResponse.json(authResult, { status: 401 });
    }

    // Parse the form data
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Read the file as a Buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Process the Excel file
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      raw: false,
    });

    console.log("Parsed Excel Data:", jsonData);

    // Function to handle date conversion
    const formatDate = (value) => {
      if (!value) return null;

      // If value is a number (Excel serial date)
      if (!isNaN(value) && Number(value) > 10000) {
        const excelDate = XLSX.SSF.parse_date_code(value);
        if (!excelDate) return null;

        const formattedDate = new Date(
          excelDate.y,
          excelDate.m - 1,
          excelDate.d
        );
        return formattedDate.toISOString().split("T")[0]; // Returns YYYY-MM-DD
      }

      // If value is a string in DD/MM/YYYY format
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/; // Matches DD/MM/YYYY
      const match = value.match(dateRegex);

      if (match) {
        const [, day, month, year] = match;
        const formattedDate = `${year}-${month}-${day}`; // Convert to YYYY-MM-DD
        return formattedDate;
      }

      return null; // Return null if format is unrecognized
    };

    // Normalize Excel data keys
    const normalizeKeys = (data) =>
      data.map((obj) =>
        Object.fromEntries(
          Object.entries(obj).map(([key, value]) => [key.toLowerCase(), value])
        )
      );

    const normalizedData = normalizeKeys(jsonData);

    // Map data to match database columns
    const filteredData = normalizedData
      .filter((row) => row.name) // Ensure required field "name" is present
      .map((row) => [
        row.name || "Unknown",
        row.mobile || null,
        row.email || null,
        formatDate(row.dob) || null,
        row["et no."] || null,
        row["iqama no."] || null,
        formatDate(row["iqama exp date"]) || null,
        row["bank acc."] || null,
        row.nationality || null,
        row["passport no."] || null,
        formatDate(row["passport exp date"]) || null,
        row.profession || null,
        row["client no."] || null,
        row["client name"] || null,
        formatDate(row["contract start"]) || null,
        formatDate(row["contract end"]) || null,
        parseFloat(row["basic salary"]) || 0,
        row["hra type"] || null,
        parseFloat(row.hra) || 0,
        row["tra type"] || null,
        parseFloat(row.tra) || 0,
        row["food allowance type"] || null,
        parseFloat(row["food allowance"]) || 0,
        parseFloat(row["other allowance"]) || 0,
        parseFloat(row["total salary"]) || 0,
        row.medical || null,
        row["employee status"] || null,
      ]);

    if (filteredData.length === 0) {
      return NextResponse.json(
        { error: "No valid data found" },
        { status: 400 }
      );
    }

    // Insert data into MySQL
    const connection = await pool.getConnection();
    const sql = `
      INSERT INTO employees (
        name, mobile, dob, email, et_number, iqama_number, iqama_expiry_date,
        bank_account, nationality, passport_number, passport_expiry_date,
        profession, client_number, client_name, contract_start_date,
        contract_end_date, basic_salary, hra_type, hra, tra_type, tra,
        food_allowance_type, food_allowance, other_allowance,
        total_salary, medical, employee_status
      ) VALUES ?
    `;

    await connection.query(sql, [filteredData]);
    connection.release();

    return NextResponse.json({
      success: true,
      message: "Data uploaded successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
