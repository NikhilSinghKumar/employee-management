import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticateToken } from "@/lib/auth/authenticateToken";
import { supabase } from "@/utils/supabaseClient";

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token)
    return { success: false, error: "Unauthorized: No token provided" };
  const authResult = await authenticateToken(token);
  return authResult;
}

export async function GET(req) {
  const authResult = await verifyAuth();
  if (!authResult.success)
    return NextResponse.json(authResult, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page")) || 1;
  const pageSize = parseInt(searchParams.get("pageSize")) || 20;
  const search = searchParams.get("search")?.toLowerCase() || "";

  try {
    let query = supabase
      .from("employees")
      .select("*", { count: "exact" })
      .eq("is_deleted", false);

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,et_number.ilike.%${search}%,iqama_number.ilike.%${search}%,passport_number.ilike.%${search}%,profession.ilike.%${search}%,nationality.ilike.%${search}%,client_number.ilike.%${search}%,client_name.ilike.%${search}%,mobile.ilike.%${search}%,email.ilike.%${search}%,bank_account.ilike.%${search}%,employee_status.ilike.%${search}%,employee_source.ilike.%${search}%`
      );
    } else {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    query = query.order("iqama_number", { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      console.error("Supabase GET error:", error);
      throw new Error(error.message);
    }

    // Calculate unique client count
    const { data: allClientsData, error: clientError } = await supabase
      .from("employees")
      .select("client_number")
      .eq("is_deleted", false);
    if (clientError) {
      console.error("Supabase client count error:", clientError);
      throw new Error(clientError.message);
    }
    const clientSet = new Set(
      allClientsData?.map((emp) => emp.client_number).filter(Boolean)
    );
    const uniqueClientCount = clientSet.size;

    return NextResponse.json(
      {
        success: true,
        data,
        totalCount: count,
        uniqueClientCount,
      },
      { status: 200 }
    );
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

  // Normalize clientNumber and clientName to uppercase
  payload.clientNo = payload.clientNo.toUpperCase();
  payload.clientName = payload.clientName.toUpperCase();

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

    if (error) {
      console.error("Supabase POST error:", error);
      throw new Error(error.message);
    }

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

  if (!authResult.user?.userId) {
    return NextResponse.json(
      { result: "User ID not found", success: false },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { result: "Employee ID is required", success: false },
      { status: 400 }
    );
  }

  try {
    // Pre-check if employee exists
    const { data: employee, error: checkError } = await supabase
      .from("employees")
      .select("id, name, employee_status")
      .eq("id", id)
      .single();

    if (checkError || !employee) {
      console.error("Employee check error:", checkError || "No employee found");
      return NextResponse.json(
        { result: `Employee with ID ${id} not found`, success: false },
        { status: 404 }
      );
    }

    // Attempt deletion
    const { data, error } = await supabase
      .from("employees")
      .delete()
      .eq("id", id)
      .select("id")
      .single();

    if (error) {
      console.error("Supabase DELETE error:", error);
      if (error.code === "PGRST116" || error.code === "P0001") {
        return NextResponse.json(
          { result: `Employee with ID ${id} not found`, success: false },
          { status: 404 }
        );
      }
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { result: `Employee with ID ${id} not found`, success: false },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        result: `Employee with ID ${id} deleted successfully`,
        id: data.id,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Supabase DELETE error details:", error);
    return NextResponse.json(
      { result: "Database error", error: error.message, success: false },
      { status: 500 }
    );
  }
}
