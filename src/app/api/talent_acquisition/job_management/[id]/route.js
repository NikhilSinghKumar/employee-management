import { supabase } from "@/utils/supabaseClient";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticateToken } from "@/lib/middleware/auth";

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return { success: false, error: "Unauthorized" };
  }
  return authenticateToken(token);
}

export async function GET(req, { params }) {
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
  const { id } = await params;
  try {
    const { data, error } = await supabase
      .from("job_list")
      .select("*")
      .eq("job_id", id)
      .eq("is_deleted", false)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, job: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update job
export async function PATCH(req, { params }) {
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
  const { id } = await params; // <-- comes from /job_management/[id]
  const payload = await req.json();

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
      .eq("job_id", id)
      .eq("is_deleted", false)
      .select("job_id")
      .single();

    if (error) throw error;

    return NextResponse.json(
      { result: "Update successful", id: data.job_id, success: true },
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

export async function DELETE(req, { params }) {
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
  const { id } = await params; // <-- comes from /job_management/[id]

  try {
    const { data, error } = await supabase
      .from("job_list")
      .update({
        is_deleted: true,
        edited_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("job_id", id)
      .eq("is_deleted", false)
      .select("job_id")
      .single();

    if (error) throw error;

    return NextResponse.json(
      { result: "Delete successful (soft)", id: data.job_id, success: true },
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
