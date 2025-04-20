import pool from "@/utils/db";
import * as XLSX from "xlsx";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticateToken } from "@/lib/middleware/auth";
import format from "pg-format";

export async function POST(req) {
  try {
    const token = cookies().get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    const authResult = await authenticateToken(token);
    if (!authResult.success) {
      return NextResponse.json(authResult, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      raw: false,
    });

    const formatDate = (value) => {
      if (!value) return null;

      if (!isNaN(value) && Number(value) > 10000) {
        const excelDate = XLSX.SSF.parse_date_code(value);
        if (!excelDate) return null;
        return new Date(excelDate.y, excelDate.m - 1, excelDate.d)
          .toISOString()
          .split("T")[0];
      }

      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = value.match(dateRegex);
      if (match) {
        const [, day, month, year] = match;
        return `${year}-${month}-${day}`;
      }

      return null;
    };

    const normalizeKeys = (data) =>
      data.map((obj) =>
        Object.fromEntries(
          Object.entries(obj).map(([key, value]) => [key.toLowerCase(), value])
        )
      );

    const normalizedData = normalizeKeys(jsonData);

    const filteredData = normalizedData
      .filter((row) => row.name)
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

    const insertQuery = format(
      `INSERT INTO employees (
        name, mobile, email, dob, et_number, iqama_number, iqama_expiry_date,
        bank_account, nationality, passport_number, passport_expiry_date,
        profession, client_number, client_name, contract_start_date,
        contract_end_date, basic_salary, hra_type, hra, tra_type, tra,
        food_allowance_type, food_allowance, other_allowance,
        total_salary, medical, employee_status
      ) VALUES %L`,
      filteredData
    );

    await pool.query(insertQuery);

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
