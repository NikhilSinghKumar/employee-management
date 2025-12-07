import { NextResponse } from "next/server";
import { verifyAuth } from "@/utils/verifyAuth";
import { supabase } from "@/utils/supabaseClient";

export async function PATCH(req, { params }) {
  // Auth check
  const authResult = await verifyAuth();
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const { employee_status, inactive_date, remarks } = body;

  if (!employee_status) {
    return NextResponse.json(
      { error: "Employee status is required" },
      { status: 400 }
    );
  }

  // Update only the fields provided
  const { data, error } = await supabase
    .from("employees")
    .update({
      employee_status,
      inactive_date: inactive_date || null,
      remarks: remarks || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { message: "Employee status updated", data },
    { status: 200 }
  );
}
