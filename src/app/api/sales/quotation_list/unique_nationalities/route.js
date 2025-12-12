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

  // Fetch nationalities (not unique)
  const { data, error } = await supabase
    .from("quotation_list_view")
    .select("nationality")
    .order("nationality", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Remove duplicates in JS (safe and fast)
  const unique = Array.from(new Set(data.map((item) => item.nationality))).map(
    (nationality) => ({ nationality })
  );

  return NextResponse.json(unique);
}
