import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticateToken } from "@/lib/middleware/auth";
import { supabase } from "@/utils/supabaseClient";

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token)
    return { success: false, error: "Unauthorized: No token provided" };
  return authenticateToken(token);
}

export async function GET() {
  const authResult = await verifyAuth();
  if (!authResult.success)
    return NextResponse.json(authResult, { status: 401 });

  try {
    const { data, error } = await supabase.from("employees").select("*");

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Supabase query error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const authResult = await verifyAuth();
  if (!authResult.success)
    return NextResponse.json(authResult, { status: 401 });

  const payload = await req.json();

  // Normalize clientNumber and clientName to lowercase
  payload.clientNo = payload.clientNo.toLowerCase();
  payload.clientName = payload.clientName.toLowerCase();

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
    "employeeSource",
  ];

  const missingFields = requiredFields.filter((field) => !payload[field]);
  if (missingFields.length) {
    return NextResponse.json(
      { result: "Missing required fields", missingFields, success: false },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("employees")
      .insert([
        {
          name: payload.employeeName,
          mobile: payload.mobile,
          dob: payload.dob,
          email: payload.email,
          et_number: payload.etNo,
          iqama_number: payload.iqamaNo,
          iqama_expiry_date: payload.iqamaExpDate,
          bank_account: payload.bankAccount,
          nationality: payload.nationality,
          passport_number: payload.passportNo,
          passport_expiry_date: payload.passportExpDate,
          profession: payload.profession,
          client_number: payload.clientNo,
          client_name: payload.clientName,
          contract_start_date: payload.contractStartDate,
          contract_end_date: payload.contractEndDate,
          basic_salary: payload.basicSalary,
          hra_type: payload.hraType,
          hra: payload.hra,
          tra_type: payload.traType,
          tra: payload.tra,
          food_allowance_type: payload.foodAllowanceType,
          food_allowance: payload.foodAllowance,
          other_allowance: payload.otherAllowance,
          total_salary: payload.totalSalary,
          medical: payload.medical,
          employee_status: payload.employeeStatus,
          employee_source: payload.employeeSource,
        },
      ])
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json(
      {
        result: "New Employee Created",
        employeeId: data.id,
        success: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json(
      { result: "Database error", error: error.message, success: false },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  const authResult = await verifyAuth();
  if (!authResult.success)
    return NextResponse.json(authResult, { status: 401 });

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json(
      { error: "Employee ID is required" },
      { status: 400 }
    );
  }

  try {
    const { error, count } = await supabase
      .from("employees")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Employee not found" },
          { status: 404 }
        );
      }
      throw new Error(error.message);
    }

    return NextResponse.json(
      { success: true, message: "Employee deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Supabase delete error:", error);
    return NextResponse.json(
      { error: "Server error", success: false },
      { status: 500 }
    );
  }
}
