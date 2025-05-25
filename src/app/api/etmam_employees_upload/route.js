export const runtime = "nodejs";
import { supabase } from "@/utils/supabaseClient";
import * as XLSX from "xlsx";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticateToken } from "@/lib/middleware/auth";

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
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

    const formattedData = normalizedData
      .filter((row) => row.name)
      .map((row) => ({
        name: row.name || "Unknown",
        mobile: row.mobile || null,
        email: row.email || null,
        dob: formatDate(row.dob) || null,
        et_number: row["et no."] || null,
        iqama_number: row["iqama no."] || null,
        iqama_expiry_date: formatDate(row["iqama exp date"]) || null,
        bank_account: row["bank acc."] || null,
        nationality: row.nationality || null,
        passport_number: row["passport no."] || null,
        passport_expiry_date: formatDate(row["passport exp date"]) || null,
        profession: row.profession || null,
        staff_id: row["staff id"] || null,
        department: row["department"] || null,
        contract_start_date: formatDate(row["contract start"]) || null,
        contract_end_date: formatDate(row["contract end"]) || null,
        basic_salary: parseFloat(row["basic salary"]) || 0,
        hra_type: row["hra type"] || null,
        hra: parseFloat(row.hra) || 0,
        tra_type: row["tra type"] || null,
        tra: parseFloat(row.tra) || 0,
        food_allowance_type: row["food allowance type"] || null,
        food_allowance: parseFloat(row["food allowance"]) || 0,
        other_allowance: parseFloat(row["other allowance"]) || 0,
        total_salary: parseFloat(row["total salary"]) || 0,
        medical: row.medical || null,
        staff_status: row["staff status"] || null,
        staff_source: row["staff source"] || null,
      }));

    if (formattedData.length === 0) {
      return NextResponse.json(
        { error: "No valid data found" },
        { status: 400 }
      );
    }

    const { error: insertError } = await supabase
      .from("etmam_staff")
      .insert(formattedData);

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to upload data" },
        { status: 500 }
      );
    }

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
