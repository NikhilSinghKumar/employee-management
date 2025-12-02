export const runtime = "nodejs";
import { supabase } from "@/utils/supabaseClient";
import * as XLSX from "xlsx";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticateToken } from "@/lib/auth/authenticateToken";

export async function POST(req) {
  try {
    // ---------------- AUTH ----------------
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

    // ---------------- FILE ----------------
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

    // ---------------- HELPERS ----------------

    // Normalize headers to lowercase
    const normalizeKeys = (data) =>
      data.map((obj) =>
        Object.fromEntries(
          Object.entries(obj).map(([key, value]) => [
            key.trim().toLowerCase(),
            value,
          ])
        )
      );

    // Convert Excel date or dd/mm/yyyy → yyyy-mm-dd
    function formatDate(value) {
      if (!value) return null;

      // YYYY-MM-DD
      const iso = /^(\d{4})-(\d{2})-(\d{2})$/;
      let match = value.match(iso);
      if (match) return value;

      // DD/MM/YYYY or MM/DD/YYYY
      const slash = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      match = value.match(slash);
      if (match) {
        let [_, a, b, year] = match;
        a = parseInt(a, 10);
        b = parseInt(b, 10);

        if (a > 12 && b <= 12) {
          // must be DD/MM/YYYY
          return `${year}-${String(b).padStart(2, "0")}-${String(a).padStart(
            2,
            "0"
          )}`;
        }

        if (b > 12 && a <= 12) {
          // must be MM/DD/YYYY
          return `${year}-${String(a).padStart(2, "0")}-${String(b).padStart(
            2,
            "0"
          )}`;
        }

        // If ambiguous (both <= 12), assume DD/MM/YYYY
        return `${year}-${String(b).padStart(2, "0")}-${String(a).padStart(
          2,
          "0"
        )}`;
      }

      return null;
    }

    const lower = normalizeKeys(jsonData);

    // ---------------- MAPPING EXCEL → DATABASE ----------------
    const formattedData = lower
      .filter((row) => row.name) // Only rows with name
      .map((row) => ({
        name: row.name || "Unknown",

        mobile: row.mobile || null,
        email: row.email || null,
        dob: formatDate(row["dob"]) || null, // IF present

        et_number: row["et no."] || row["et no"] || null,
        iqama_number: row["iqama no"] || null,
        iqama_expiry_date: formatDate(row["iqama exp date"]) || null,

        bank_account: row["bank account"] || null,
        nationality: row["nationality"] || null,

        passport_number: row["passport no."] || null,
        passport_expiry_date: formatDate(row["passport exp date"]) || null,

        profession: row["profession"] || null,

        client_number: row["client no."] || null,
        client_name: row["client name"] || null,

        contract_start_date: formatDate(row["start date"]) || null,
        contract_end_date: formatDate(row["end date"]) || null,

        basic_salary: parseFloat(row["basic salary"]) || 0,
        hra_type: row["hra type"] || null,
        hra: parseFloat(row["hra"]) || 0,

        tra_type: row["tra type"] || null,
        tra: parseFloat(row["tra"]) || 0,

        food_allowance_type: row["food allowance type"] || null,
        food_allowance: parseFloat(row["food allowance"]) || 0,

        other_allowance: parseFloat(row["allowance"]) || 0, // Excel has only "Allowance"
        total_salary: parseFloat(row["total salary"]) || 0,

        medical: row["medical type"] || null,

        employee_status: row["status"] || null,
        employee_source: row["source"] || null,
      }));

    if (formattedData.length === 0) {
      return NextResponse.json(
        { error: "No valid data found" },
        { status: 400 }
      );
    }
    // ---------------- INSERT (SKIP DUPLICATES) ----------------
    const { data: insertedRows, error: insertError } = await supabase
      .from("employees")
      .upsert(formattedData, {
        onConflict: "iqama_number",
        ignoreDuplicates: true, // <-- skip rows where iqama_number already exists
      });

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    // Count inserted vs skipped
    const insertedCount = insertedRows?.length || 0;
    const skippedCount = formattedData.length - insertedCount;

    return NextResponse.json({
      success: true,
      message: "Employees uploaded successfully!",
      inserted: insertedCount,
      skipped: skippedCount,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
