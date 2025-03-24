import { pool } from "../../../utils/db";
import { NextResponse } from "next/server";
import { authenticateToken } from "@/lib/middleware/auth";
import { cookies } from "next/headers";

let connection;

export async function GET(req) {
  const token = (await cookies()).get("token")?.value; // Read token from cookies

  // Pass token to authentication middleware
  const authResult = await authenticateToken(token);
  if (!authResult.success) {
    return NextResponse.json(authResult, { status: 401 });
  }

  try {
    connection = await pool.getConnection();
    const sql = "SELECT * FROM employees";
    const [employees] = await connection.query(sql);

    return NextResponse.json(
      {
        success: true,
        data: employees,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database query error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const token = (await cookies()).get("token")?.value; // Read token from cookies

  if (!token) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: No token provided" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Pass token to authentication middleware
  const authResult = await authenticateToken(token);
  if (!authResult.success) {
    return NextResponse.json(authResult, { status: 401 });
  }

  let payload = await req.json();

  // Required Fields
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

  // Check for missing fields
  const missingFields = requiredFields.filter((field) => !payload[field]);

  if (missingFields.length) {
    return NextResponse.json(
      {
        result: "Missing required fields",
        missingFields,
        success: false,
      },
      { status: 400 }
    );
  }

  try {
    connection = await pool.getConnection();

    const sql = `
      INSERT INTO employees (
        name, mobile, dob, email, et_number, iqama_number, iqama_expiry_date,
        bank_account, nationality, passport_number, passport_expiry_date,
        profession, client_number, client_name, contract_start_date,
        contract_end_date, basic_salary, hra_type, hra, tra_type, tra,
        food_allowance_type, food_allowance, other_allowance,
        total_salary, medical, employee_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      payload.employeeName,
      payload.mobile,
      payload.dob,
      payload.email,
      payload.etNo,
      payload.iqamaNo,
      payload.iqamaExpDate,
      payload.bankAccount,
      payload.nationality,
      payload.passportNo,
      payload.passportExpDate,
      payload.profession,
      payload.clientNo,
      payload.clientName,
      payload.contractStartDate,
      payload.contractEndDate,
      payload.basicSalary,
      payload.hraType,
      payload.hra,
      payload.traType,
      payload.tra,
      payload.foodAllowanceType,
      payload.foodAllowance,
      payload.otherAllowance,
      payload.totalSalary,
      payload.medical,
      payload.employeeStatus,
    ];

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
      {
        result: "Database error",
        error: error.message,
        success: false,
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release(); // Release the connection back to the pool
  }
}
