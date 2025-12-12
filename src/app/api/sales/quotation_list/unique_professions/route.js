import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";
import { cookies } from "next/headers";
import { authenticateToken } from "@/lib/auth/authenticateToken";

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return { success: false, error: "Unauthorized" };
  return authenticateToken(token);
}

export async function GET() {
  const auth = await verifyAuth();
  if (!auth.success)
    return NextResponse.json({ error: auth.error }, { status: 401 });

  const { data, error } = await supabase
    .from("unique_professions")
    .select("*")
    .order("profession", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
