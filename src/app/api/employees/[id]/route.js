import { pool } from "../../../../utils/db";
import { NextResponse } from "next/server";
import { authenticateToken } from "@/lib/middleware/auth";
import { cookies } from "next/headers";

async function getDBConnection() {
  return pool.getConnection();
}

async function verifyAuth() {
  const token = (await cookies()).get("token")?.value;
  if (!token)
    return { success: false, error: "Unauthorized: No token provided" };
  return authenticateToken(token);
}

export async function GET(req, { params }) {
  const authResult = await verifyAuth();
  if (!authResult.success)
    return NextResponse.json(authResult, { status: 401 });

  const { id } = await params;
  let connection;

  try {
    connection = await getDBConnection();
    const [employee] = await connection.query(
      "SELECT * FROM employees WHERE id = ?",
      [id]
    );

    if (employee.length === 0) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: employee[0] });
  } catch (error) {
    console.error("Database query error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

// src/app/api/employees/[id]/route.js
export async function PUT(req, { params }) {
  const authResult = await verifyAuth();
  if (!authResult.success)
    return NextResponse.json(authResult, { status: 401 });

  const payload = await req.json();
  const { id } = params;

  let connection;
  try {
    connection = await getDBConnection();
    const sql = `UPDATE employees SET 
      name=?, mobile=?, email=?, dob=?, et_number=?, iqama_number=?, iqama_expiry_date=?,
      bank_account=?, nationality=?, passport_number=?, passport_expiry_date=?, profession=?,
      client_number=?, client_name=?, contract_start_date=?, contract_end_date=?, basic_salary=?,
      hra_type=?, hra=?, tra_type=?, tra=?, food_allowance_type=?, food_allowance=?, other_allowance=?,
      total_salary=?, medical=?, employee_status=? WHERE id=?`;

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
    const [result] = await connection.execute(sql, values);

    if (result.affectedRows === 0)
      return NextResponse.json(
        { error: "Employee not found", success: false },
        { status: 404 }
      );
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
  } finally {
    if (connection) connection.release();
  }
}
