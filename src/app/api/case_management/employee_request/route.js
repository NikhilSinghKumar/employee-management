import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      cm_name,
      cm_mobile_no,
      cm_email,
      cm_nationality,
      cm_passport_iqama,
      cm_city,
      cm_client_name,
      cm_complaint_description,
    } = body;

    // ✅ Collect missing fields
    const missingFields = [];
    if (!cm_name) missingFields.push("cm_name");
    if (!cm_mobile_no) missingFields.push("cm_mobile_no");
    if (!cm_email) missingFields.push("cm_email");
    if (!cm_nationality) missingFields.push("cm_nationality");
    if (!cm_passport_iqama) missingFields.push("cm_passport_iqama");
    if (!cm_city) missingFields.push("cm_city");
    if (!cm_client_name) missingFields.push("cm_client_name");

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          fieldErrors: missingFields,
        },
        { status: 400 }
      );
    }

    // ✅ Additional server-side validation
    if (!/^[0-9][0-9]{9}$/.test(cm_mobile_no)) {
      return NextResponse.json(
        { success: false, error: "Invalid mobile number" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cm_email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    // ✅ Insert into Supabase
    const { data, error } = await supabase
      .from("employee_request")
      .insert([
        {
          cm_name,
          cm_mobile_no,
          cm_email,
          cm_nationality,
          cm_passport_iqama,
          cm_city,
          cm_client_name,
          cm_complaint_description,
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);

      // Handle unique constraint / known errors
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "Duplicate entry", code: "DUPLICATE" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Database error", code: "DB_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
