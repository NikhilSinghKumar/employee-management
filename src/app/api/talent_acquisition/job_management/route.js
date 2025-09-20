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

export async function GET() {
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
  try {
    const { data, error } = await supabase
      .from("job_list")
      .select(
        `id, job_id, job_title, job_location, job_salary, job_opening_date, job_closing_date, job_description, job_key_skills, job_benefits, job_status`
      )
      .eq("is_deleted", false)
      .order("job_opening_date", { ascending: false });

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

// PATCH - Update job
export async function PATCH(req) {
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

  if (!payload.id) {
    return NextResponse.json(
      { result: "Missing job ID", success: false },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("job_list")
      .update({
        ...(payload.jobTitle && { job_title: payload.jobTitle }),
        ...(payload.jobLocation && { job_location: payload.jobLocation }),
        ...(payload.jobKeySkills && { job_key_skills: payload.jobKeySkills }),
        ...(payload.jobSalary && { job_salary: payload.jobSalary }),
        ...(payload.jobOpeningDate && {
          job_opening_date: payload.jobOpeningDate,
        }),
        ...(payload.jobClosingDate && {
          job_closing_date: payload.jobClosingDate,
        }),
        ...(payload.jobBenefits && { job_benefits: payload.jobBenefits }),
        ...(payload.jobDescription && {
          job_description: payload.jobDescription,
        }),
        ...(payload.jobStatus && { job_status: payload.jobStatus }),
        edited_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.id)
      .eq("is_deleted", false)
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json(
      { result: "Update successful", id: data.id, success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Supabase update error:", error);
    return NextResponse.json(
      { result: "Database error", error: error.message, success: false },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
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
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { result: "Missing job ID", success: false },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("job_list")
      .update({
        is_deleted: true,
        edited_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("is_deleted", false)
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json(
      { result: "Delete successful (soft)", id: data.id, success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Supabase delete error:", error);
    return NextResponse.json(
      { result: "Database error", error: error.message, success: false },
      { status: 500 }
    );
  }
}
