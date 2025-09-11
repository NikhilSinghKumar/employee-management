import { supabase } from "@/utils/supabaseClient";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { id} = await params;
  try {
    const { data, error } = await supabase
      .from("job_list")
      .select("*")
      .eq("job_id", id)
      .eq("is_deleted", false)
      .eq("job_status", "open")
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
