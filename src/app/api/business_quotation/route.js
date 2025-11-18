import { supabase } from "@/utils/supabaseClient";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticateToken } from "@/lib/auth/authenticateToken";

// Verify auth helper
async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return { success: false, error: "No token provided" };
  }

  const result = await authenticateToken(token);
  return result;
}

/* ============================================================
   GET API 
   Supports search / filter on company_name, quotation_no
============================================================ */
export async function GET(req) {
  const authResult = await verifyAuth();

  if (!authResult.success)
    return NextResponse.json(authResult, { status: 401 });
  if (!authResult.user?.userId)
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );

  const { searchParams } = new URL(req.url);
  const companyName = searchParams.get("company_name") || null;
  const quotationNo = searchParams.get("quotation_no") || null;
  const companyCRNo = searchParams.get("company_cr_number") || null;
  try {
    let query = supabase
      .from("quotations")
      .select("*")
      .order("created_at", { ascending: false });

    if (companyName) query = query.ilike("company_name", `%${companyName}%`);
    if (quotationNo) query = query.eq("quotation_no", quotationNo);
    if (companyCRNo) query = query.eq("company_cr_number", companyCRNo);

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      result: "Fetch successful",
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, result: "Database error", error: error.message },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST API — INSERT NEW QUOTATION
============================================================ */
export async function POST(req) {
  const authResult = await verifyAuth();

  if (!authResult.success)
    return NextResponse.json(authResult, { status: 401 });
  if (!authResult.user?.userId)
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );

  const userId = authResult.user.userId;
  const payload = await req.json();

  /* -------------------------
     REQUIRED FIELDS (Static)
  -------------------------- */
  const alwaysRequired = [
    "date",
    "quotation_no",
    "company_name",
    "company_cr_number",
    "company_activity",
    "signatory",
    "designation",
    "mobile_no",
    "email",
    "person_name",
    "quotation_type",
    "workers_mode",
    "contract_duration",
    "basic_salary",
    "food_allowance",
    "accommodation_cost",
    "transportation_cost",
    "other_costs",
    "monthly_cost_per_worker",
  ];

  let missing = [];

  // Validate static required fields
  alwaysRequired.forEach((field) => {
    if (
      payload[field] === undefined ||
      payload[field] === null ||
      payload[field].toString().trim() === ""
    ) {
      missing.push(field);
    }
  });

  // Extra validation based on nationality mode
  if (payload.nationality_mode === "specific") {
    if (!payload.nationality || payload.nationality.trim() === "") {
      missing.push("nationality");
    }
  }

  if (missing.length) {
    console.log("Missing fields:", missing, "Payload:", payload);
    return NextResponse.json(
      {
        success: false,
        result: "Missing required fields",
        missingFields: missing,
      },
      { status: 400 }
    );
  }

  /* -------------------------
     INSERT INTO SUPABASE
  -------------------------- */
  try {
    const { data, error } = await supabase
      .from("quotations")
      .insert([
        {
          // CLIENT DETAILS
          date: payload.date,
          quotation_no: payload.quotation_no,
          company_name: payload.company_name,
          company_cr_number: payload.company_cr_number,
          company_activity: payload.company_activity,
          signatory: payload.signatory,
          designation: payload.designation,
          mobile_no: payload.mobile_no,
          email: payload.email,
          remarks: payload.remarks ?? null,
          person_name: payload.person_name,
          etmam_commitments: payload.etmam_commitments ?? null,
          client_commitments: payload.client_commitments ?? null,
          general_terms: payload.general_terms ?? null,

          // QUOTATION OPTIONS
          quotation_type: payload.quotation_type,
          contract_duration: payload.contract_duration,
          workers_mode: payload.workers_mode,
          no_of_workers: payload.no_of_workers || null,

          nationality_mode: payload.nationality_mode,
          nationality:
            payload.nationality_mode === "specific"
              ? payload.nationality
              : null,

          professions: payload.professions ?? null,

          // COSTS
          basic_salary: Number(payload.basic_salary),
          food_allowance: Number(payload.food_allowance),
          accommodation_cost: Number(payload.accommodation_cost),
          transportation_cost: Number(payload.transportation_cost),
          other_costs: Number(payload.other_costs),
          monthly_cost_per_worker: Number(payload.monthly_cost_per_worker),

          created_by: userId,
          edited_by: userId,
        },
      ])
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json(
      { success: true, result: "Insert successful", id: data.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/business_quotation error:", error.message);
    return NextResponse.json(
      { success: false, result: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
