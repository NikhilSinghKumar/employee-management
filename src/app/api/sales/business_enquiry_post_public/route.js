import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      company_name,
      contact_person_name,
      company_cr_number,
      mobile_no,
      email_id,
      request_type,
      description,
    } = body;

    // ✅ Validate required fields
    if (
      !company_name ||
      !contact_person_name ||
      !company_cr_number ||
      !mobile_no ||
      !email_id ||
      !request_type
    ) {
      return NextResponse.json(
        { message: "All required fields must be provided." },
        { status: 400 }
      );
    }

    // ✅ Normalize email to lowercase
    const normalizedEmail = email_id.trim().toLowerCase();

    // ✅ Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { message: "Invalid email format." },
        { status: 400 }
      );
    }

    // ✅ Validate mobile number (only digits and 7–15 characters)
    const mobileRegex = /^[0-9]{7,15}$/;
    if (!mobileRegex.test(mobile_no)) {
      return NextResponse.json(
        { message: "Invalid mobile number." },
        { status: 400 }
      );
    }

    // ✅ Insert data into Supabase
    const { data, error } = await supabase
      .from("business_enquiry")
      .insert([
        {
          company_name,
          contact_person_name,
          company_cr_number,
          mobile_no,
          email_id: normalizedEmail,
          request_type,
          description,
          is_deleted: false,
        },
      ])
      .select();

    if (error) {
      console.error("Supabase insert error:", error.message);
      return NextResponse.json(
        { message: "Error inserting data.", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Business enquiry added successfully.", data },
      { status: 201 }
    );
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { message: "Internal server error.", error: err.message },
      { status: 500 }
    );
  }
}
