import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticateToken } from "@/lib/middleware/auth";
import { supabase } from "@/utils/supabaseClient";
import { z } from "zod";

// Validation schema for POST payload
const staffSchema = z.object({
  name: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  dob: z.string().date().optional(),
  et_no: z.string().optional(),
  iqama_no: z.string().optional(),
  iqama_exp_date: z.string().date().optional(),
  bank_account: z.string().optional(),
  nationality: z.string().optional(),
  passport_no: z.string().optional(),
  passport_exp_date: z.string().date().optional(),
  profession: z.string().optional(),
  company_staff: z.string().optional(),
  department: z.string().optional(),
  contract_start_date: z.string().date().optional(),
  contract_end_date: z.string().date().optional(),
  staff_source: z.string().optional(),
  basic_salary: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().optional()
  ),
  hra_type: z.string().optional(),
  hra: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().optional()
  ),
  tra_type: z.string().optional(),
  tra: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().optional()
  ),
  food_allowance_type: z.string().optional(),
  food_allowance: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().optional()
  ),
  other_allowance: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().optional()
  ),
  total_salary: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().optional()
  ),
  medical: z.string().optional(),
  staff_status: z.string().optional(),
});

// Validation schema for DELETE payload
const deleteSchema = z.object({
  etmam_staff_id: z.string().uuid("Invalid UUID format"),
});

// Authentication middleware
async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return { success: false, error: "Unauthorized: No token provided" };
  }

  // Set Supabase session for RLS
  await supabase.auth.setSession({ access_token: token });
  const authResult = await authenticateToken(token);
  return authResult;
}

export async function GET() {
  const authResult = await verifyAuth();
  if (!authResult.success) {
    return NextResponse.json(authResult, { status: 401 });
  }

  try {
    const { data, error } = await supabase.from("etmam_staff").select("*");
    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: true, data: [], error: null },
          { status: 200 }
        );
      }
      throw new Error(`Database error: ${error.message} (code: ${error.code})`);
    }
    return NextResponse.json(
      { success: true, data: data || [], error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET error:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const authResult = await verifyAuth();
  if (!authResult.success) {
    return NextResponse.json(authResult, { status: 401 });
  }

  try {
    const payload = await req.json();
    const parsed = staffSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Calculate total_salary if not provided
    const {
      basic_salary = 0,
      hra = 0,
      tra = 0,
      food_allowance = 0,
      other_allowance = 0,
      total_salary,
      ...rest
    } = parsed.data;
    const computedTotalSalary =
      total_salary ||
      basic_salary + hra + tra + food_allowance + other_allowance;
    const insertData = {
      ...rest,
      basic_salary,
      hra,
      tra,
      food_allowance,
      other_allowance,
      total_salary: computedTotalSalary,
    };

    const { data, error } = await supabase
      .from("etmam_staff")
      .insert([insertData])
      .select("etmam_staff_id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "Staff ID already exists" },
          { status: 409 }
        );
      }
      throw new Error(`Database error: ${error.message} (code: ${error.code})`);
    }

    console.log("POST success:", {
      etmam_staff_id: data.etmam_staff_id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        data: { etmam_staff_id: data.etmam_staff_id },
        error: null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST error:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  const authResult = await verifyAuth();
  if (!authResult.success) {
    return NextResponse.json(authResult, { status: 401 });
  }

  try {
    const payload = await req.json();
    const parsed = deleteSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("etmam_staff")
      .delete()
      .eq("etmam_staff_id", parsed.data.etmam_staff_id);

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "Staff not found" },
          { status: 404 }
        );
      }
      throw new Error(`Database error: ${error.message} (code: ${error.code})`);
    }

    return NextResponse.json(
      { success: true, data: null, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE error:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
