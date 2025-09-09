import { supabase } from "@/utils/supabaseClient";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticateToken } from "@/lib/middleware/auth";

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return { success: false, error: "Unauthorized: No token provided" };
  }
  return authenticateToken(token);
}

export async function POST(req) {
  const authResult = await verifyAuth();

  if (!authResult.success) {
    return NextResponse.json(authResult, { status: 401 });
  }

  if (!authResult.user?.userId) {
    return NextResponse.json(
      { result: "User ID not found", success: false },
      { status: 401 }
    );
  }

  const userId = authResult.user.userId;

  const payload = await req.json();
  const requiredFields = [
    "jobId",
    "jobTitle",
    "jobLocation",
    "jobSalary",
    "jobOpeningDate",
    "jobDescription",
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
      .from("job_list")
      .insert([
        {
          job_id: payload.jobId,
          job_title: payload.jobTitle,
          job_location: payload.jobLocation,
          job_key_skills: payload.jobKeySkills || null,
          job_salary: payload.jobSalary || null,
          job_opening_date: payload.jobOpeningDate,
          job_closing_date: payload.jobClosingDate || null,
          job_benefits: payload.jobBenefits,
          job_description: payload.jobDescription,
          job_status: payload.jobStatus || "open",
          is_deleted: false,
        },
      ])
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json(
      {
        result: "Insert successful",
        id: data.id,
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