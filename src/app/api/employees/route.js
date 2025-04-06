import { pool } from "../../../utils/db";
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

export async function GET(req) {
  const authResult = await verifyAuth();
  if (!authResult.success)
    return NextResponse.json(authResult, { status: 401 });

  let connection;
  try {
    connection = await getDBConnection();
    const [employees] = await connection.query("SELECT * FROM employees");
    return NextResponse.json(
      { success: true, data: employees },
      { status: 200 }
    );
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

export async function POST(req) {
  const authResult = await verifyAuth();
  if (!authResult.success)
    return NextResponse.json(authResult, { status: 401 });

  const payload = await req.json();
  const requiredFields = [
    "employeeName",
    "mobile",
    "dob",
    "email",
    "etNo",
    "iqamaNo",
    "iqamaExpDate",
    "bankAccount",
    "nationality",
    "passportNo",
    "passportExpDate",
    "profession",
    "clientNo",
    "clientName",
    "contractStartDate",
    "contractEndDate",
    "basicSalary",
    "hraType",
    "hra",
    "traType",
    "tra",
    "foodAllowanceType",
    "foodAllowance",
    "otherAllowance",
    "totalSalary",
    "medical",
    "employeeStatus",
  ];

  const missingFields = requiredFields.filter((field) => !payload[field]);
  if (missingFields.length)
    return NextResponse.json(
      { result: "Missing required fields", missingFields, success: false },
      { status: 400 }
    );

  let connection;
  try {
    connection = await getDBConnection();
    const sql = `INSERT INTO employees (
      name, mobile, dob, email, et_number, iqama_number, iqama_expiry_date,
      bank_account, nationality, passport_number, passport_expiry_date, profession,
      client_number, client_name, contract_start_date, contract_end_date, basic_salary,
      hra_type, hra, tra_type, tra, food_allowance_type, food_allowance, other_allowance,
      total_salary, medical, employee_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = requiredFields.map((field) => payload[field]);
    const [result] = await connection.execute(sql, values);
    return NextResponse.json(
      {
        result: "New Employee Created",
        employeeId: result.insertId,
        success: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Database insert error:", error);
    return NextResponse.json(
      { result: "Database error", error: error.message, success: false },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

export async function DELETE(req) {
  const authResult = await verifyAuth();
  if (!authResult.success)
    return NextResponse.json(authResult, { status: 401 });

  const { id } = await req.json();
  if (!id)
    return NextResponse.json(
      { error: "Employee ID is required" },
      { status: 400 }
    );

  let connection;
  try {
    connection = await getDBConnection();
    const [result] = await connection.execute(
      "DELETE FROM employees WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0)
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    return NextResponse.json(
      { success: true, message: "Employee deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database delete error:", error);
    return NextResponse.json(
      { error: "Server error", success: false },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
