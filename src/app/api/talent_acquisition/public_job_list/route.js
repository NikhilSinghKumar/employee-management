import { supabase } from "@/utils/supabaseClient";
import { NextResponse } from "next/server";

// GET /api/public_jobs
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("job_list")
      .select(
        `id, job_id, job_title, job_location, job_salary, job_opening_date, job_closing_date, job_description, job_key_skills, job_benefits, job_status`
      )
      .eq("is_deleted", false)
      .eq("job_status", "open")
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
