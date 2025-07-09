// src/app/api/upload_timesheet/route.js
import { supabase } from "@/utils/supabaseClient";
import { withAuth } from "@/utils/withAuth";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import fs from "fs/promises";
import { join } from "path";
import os from "os";

export const config = {
  api: { bodyParser: false },
};

async function parseFormData(req) {
  const formData = await req.formData();
  const fields = {};
  const files = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      files[key] = value;
    } else {
      fields[key] = value;
    }
  }

  return { fields, files };
}

// Clean logic separated from auth
async function handlePost(req, decoded) {
  const userId = decoded?.user?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication error: User ID missing" },
      { status: 401 }
    );
  }

  let tempFilePath;

  try {
    const { fields, files } = await parseFormData(req);
    const { client_number, year, month } = fields;
    const file = files.file;

    if (!file || !client_number || !year || !month) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Save the uploaded file temporarily
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    tempFilePath = join(os.tmpdir(), `timesheet-${Date.now()}.xlsx`);
    await fs.writeFile(tempFilePath, buffer);

    const timesheet_month = `${year}-${month.padStart(2, "0")}-01`;
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    const processedData = [];
    const errors = [];

    for (const row of jsonData) {
      const {
        iqama_number,
        working_days,
        absent_hrs,
        overtime_hrs,
        incentive,
        etmam_cost,
        penalty,
      } = row;

      if (!iqama_number) {
        errors.push({ row, error: "Missing iqama_number" });
        continue;
      }

      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select("id, client_number, client_name, basic_salary, total_salary")
        .eq("iqama_number", iqama_number)
        .single();

      if (employeeError || !employee) {
        errors.push({ iqama_number, error: "Employee not found" });
        continue;
      }

      if (employee.client_number !== client_number) {
        errors.push({ iqama_number, error: "Client number mismatch" });
        continue;
      }

      const parsed = {
        working_days: Number(working_days) || 30,
        absent_hrs: Number(absent_hrs) || 0,
        overtime_hrs: Number(overtime_hrs) || 0,
        incentive: Number(incentive) || 0,
        etmam_cost: Number(etmam_cost) || 1000,
        penalty: Number(penalty) || 0,
      };

      const overtime =
        ((employee.basic_salary * 1.5) / 240) * parsed.overtime_hrs;
      const deductions = (employee.total_salary * parsed.absent_hrs) / (30 * 8);
      const adjusted_salary =
        (employee.total_salary * parsed.working_days) / 30 -
        deductions +
        parsed.incentive -
        parsed.penalty +
        overtime;
      const total_cost = parsed.etmam_cost + adjusted_salary;
      const vat = total_cost * 0.15;
      const net_cost = total_cost * 1.15;

      processedData.push({
        employee_id: employee.id,
        timesheet_month,
        working_days: parsed.working_days,
        overtime_hrs: parsed.overtime_hrs,
        absent_hrs: parsed.absent_hrs,
        basic_salary: employee.basic_salary,
        total_salary: employee.total_salary,
        incentive: parsed.incentive,
        etmam_cost: parsed.etmam_cost,
        penalty: parsed.penalty,
        client_number: employee.client_number,
        client_name: employee.client_name,
        iqama_number,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        generated_by: userId,
        edited_by: userId,
      });
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const batchSize = 100;
    for (let i = 0; i < processedData.length; i += batchSize) {
      const batch = processedData.slice(i, i + batchSize);
      const { error: upsertError } = await supabase
        .from("generated_timesheet")
        .upsert(batch, {
          onConflict: ["iqama_number", "client_number", "timesheet_month"],
        });

      if (upsertError) {
        console.error("Upsert failed:", upsertError);
        console.error("First row being inserted:", batch[0]); // optional
        return NextResponse.json(
          { error: "Failed to upsert data", technical: upsertError.message },
          { status: 500 }
        );
      }
    }

    const { error: summaryError } = await supabase.rpc(
      "update_timesheet_summary_manual",
      {
        p_timesheet_month: timesheet_month,
        p_client_number: client_number,
      }
    );

    if (summaryError) {
      return NextResponse.json(
        { error: `Failed to update summary: ${summaryError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Timesheet uploaded successfully" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err.message}` },
      { status: 500 }
    );
  } finally {
    try {
      if (tempFilePath) await fs.unlink(tempFilePath);
    } catch (cleanupErr) {
      console.error("File cleanup failed:", cleanupErr);
    }
  }
}

// Wrap with auth
export const POST = withAuth(handlePost);
