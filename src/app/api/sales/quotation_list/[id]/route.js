import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";
import { cookies } from "next/headers";
import { authenticateToken } from "@/lib/auth/authenticateToken";

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token)
    return { success: false, error: "Unauthorized: No token provided" };
  return authenticateToken(token);
}

export async function GET(req, { params }) {
  const auth = await verifyAuth();
  if (!auth.success)
    return NextResponse.json({ error: auth.error }, { status: 401 });

  const { id } = params;

  const { data, error } = await supabase
    .from("quotation_list_view")
    .select("*")
    .eq("id", id)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function PATCH(req, { params }) {
  const auth = await verifyAuth();
  if (!auth.success)
    return NextResponse.json({ error: auth.error }, { status: 401 });

  const { id } = params;
  const userId = auth.decoded?.user?.userId;
  const body = await req.json();

  const { etmam_cost, client_number } = body;

  const updateData = {
    edited_by: userId,
    edited_at: new Date().toISOString(),
  };

  if (client_number !== undefined) updateData.client_number = client_number;
  if (etmam_cost !== undefined) updateData.etmam_cost = etmam_cost;

  const { data, error } = await supabase
    .from("quotation_list")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(req, { params }) {
  const auth = await verifyAuth();
  if (!auth.success)
    return NextResponse.json({ error: auth.error }, { status: 401 });

  const { id } = params;

  const { error } = await supabase
    .from("quotation_list")
    .update({ is_deleted: true })
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, message: "Quotation deleted" });
}
