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

export async function GET(req) {
  const auth = await verifyAuth();
  if (!auth.success)
    return NextResponse.json({ error: auth.error }, { status: 401 });

  // Extract query params
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const offset = (page - 1) * limit;

  const client_number = searchParams.get("client_number");
  const nationality = searchParams.get("nationality");
  const profession = searchParams.get("profession");
  const search = searchParams.get("search");

  let query = supabase
    .from("quotation_list_view")
    .select("*", { count: "exact" });

  // Apply filters
  if (client_number) query = query.eq("client_number", client_number);
  if (nationality) query = query.eq("nationality", nationality);
  if (profession) query = query.eq("profession", profession);

  query = query
    .order("client_number", { ascending: true })
    .order("nationality", { ascending: true })
    .order("profession", { ascending: true });

  // Apply search logic
  if (search) {
    query = query.or(
      `client_number.ilike.%${search}%,client_name.ilike.%${search}%,nationality.ilike.%${search}%,profession.ilike.%${search}%`
    );
  }

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    page,
    limit,
    total_rows: count,
    total_pages: Math.ceil(count / limit),
    data,
  });
}

export async function POST(req) {
  const auth = await verifyAuth();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const userId = auth.decoded?.user?.userId;

  const body = await req.json();
  const { client_number, etmam_cost } = body;

  if (!client_number) {
    return NextResponse.json(
      { error: "client_number is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("quotation_list")
    .insert({
      client_number,
      etmam_cost: etmam_cost || 1000,
      created_by: userId,
      edited_by: userId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
