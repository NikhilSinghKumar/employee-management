import { supabase } from "@/utils/supabaseClient";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticateToken } from "@/lib/auth/authenticateToken";

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return { success: false, error: "Unauthorized: No token provided" };
  }
  return authenticateToken(token);
}

export async function GET(req) {
  const authResult = await verifyAuth();
  if (!authResult.success) {
    return NextResponse.json(authResult, { status: 401 });
  }

  if (!authResult.user?.userId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // ✅ Extract search query from URL
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  try {
    let query = supabase
      .from("job_list")
      .select(
        `id, job_id, job_title, job_location, job_salary, job_opening_date, job_closing_date, job_description, job_key_skills, job_benefits, job_status`
      )
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    // ✅ Apply search filter if user provided one
    if (search.trim() !== "") {
      query = query.or(
        `job_title.ilike.%${search}%,job_location.ilike.%${search}%,job_id.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, jobs: data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const authResult = await verifyAuth();

  if (!authResult.success) {
    return NextResponse.json(authResult, { status: 401 });
  }

  if (!authResult.user?.userId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
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
          created_by: userId,
          edited_by: userId,
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
