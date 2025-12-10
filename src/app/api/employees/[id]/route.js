import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticateToken } from "@/lib/auth/authenticateToken";
import { supabase } from "@/utils/supabaseClient";

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
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "Employee not found" },
          { status: 404 }
        );
      }
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Supabase fetch error:", error);
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

  // Normalize clientNumber and clientName to lowercase
  payload.clientNo = payload.clientNo.toLowerCase();
  payload.clientName = payload.clientName.toLowerCase();

  const { id } = params;

  try {
    const { error, data } = await supabase
      .from("employees")
      .update({
        name: payload.name,
        mobile: payload.mobile,
        email: payload.email,
        dob: payload.dob,
        et_number: payload.et_number,
        iqama_number: payload.iqama_number,
        iqama_expiry_date: payload.iqama_expiry_date,
        bank_account: payload.bank_account,
        nationality: payload.nationality,
        passport_number: payload.passport_number,
        passport_expiry_date: payload.passport_expiry_date,
        profession: payload.profession,
        client_number: payload.client_number,
        client_name: payload.client_name,
        contract_start_date: payload.contract_start_date,
        contract_end_date: payload.contract_end_date,
        basic_salary: payload.basic_salary,
        hra_type: payload.hra_type,
        hra: payload.hra,
        tra_type: payload.tra_type,
        tra: payload.tra,
        food_allowance_type: payload.food_allowance_type,
        food_allowance: payload.food_allowance,
        other_allowance: payload.other_allowance,
        total_salary: payload.total_salary,
        medical: payload.medical,
        employee_status: payload.employee_status,
        employee_source: payload.employee_source,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Employee not found", success: false },
          { status: 404 }
        );
      }
      throw new Error(error.message);
    }

    return NextResponse.json(
      { success: true, message: "Employee updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Supabase update error:", error);
    return NextResponse.json(
      { error: "Server error", success: false },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  const authResult = await verifyAuth();
  if (!authResult.success)
    return NextResponse.json(authResult, { status: 401 });

  const { id } = params;
  const payload = await req.json();

  // Convert null/empty string handling automatically
  const cleanPayload = Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      value === "" ? null : value,
    ])
  );

  try {
    const { error } = await supabase
      .from("employees")
      .update({
        ...cleanPayload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json(
      { success: true, message: "Employee updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH update error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
