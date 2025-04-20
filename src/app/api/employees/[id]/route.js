import pool from "@/utils/db";
import { NextResponse } from "next/server";
import { authenticateToken } from "@/lib/middleware/auth";
import { cookies } from "next/headers";

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token)
    return { success: false, error: "Unauthorized: No token provided" };
  return authenticateToken(token);
}

export async function GET(req, { params }) {
  const authResult = await verifyAuth();
  if (!authResult.success)
    return NextResponse.json(authResult, { status: 401 });

  const { id } = params;

  try {
    const result = await pool.query("SELECT * FROM employees WHERE id = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Database query error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  const authResult = await verifyAuth();
  if (!authResult.success)
    return NextResponse.json(authResult, { status: 401 });

  const payload = await req.json();
  const { id } = params;

  try {
    const sql = `UPDATE employees SET 
      name = $1, mobile = $2, email = $3, dob = $4, et_number = $5, iqama_number = $6, iqama_expiry_date = $7,
      bank_account = $8, nationality = $9, passport_number = $10, passport_expiry_date = $11, profession = $12,
      client_number = $13, client_name = $14, contract_start_date = $15, contract_end_date = $16, basic_salary = $17,
      hra_type = $18, hra = $19, tra_type = $20, tra = $21, food_allowance_type = $22, food_allowance = $23, other_allowance = $24,
      total_salary = $25, medical = $26, employee_status = $27, updated_at = NOW()
      WHERE id = $28`;

    const values = [
      payload.name,
      payload.mobile,
      payload.email,
      payload.dob,
      payload.et_number,
      payload.iqama_number,
      payload.iqama_expiry_date,
      payload.bank_account,
      payload.nationality,
      payload.passport_number,
      payload.passport_expiry_date,
      payload.profession,
      payload.client_number,
      payload.client_name,
      payload.contract_start_date,
      payload.contract_end_date,
      payload.basic_salary,
      payload.hra_type,
      payload.hra,
      payload.tra_type,
      payload.tra,
      payload.food_allowance_type,
      payload.food_allowance,
      payload.other_allowance,
      payload.total_salary,
      payload.medical,
      payload.employee_status,
      id,
    ];

    const result = await pool.query(sql, values);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Employee not found", success: false },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Employee updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database update error:", error);
    return NextResponse.json(
      { error: "Server error", success: false },
      { status: 500 }
    );
  }
}
