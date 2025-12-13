import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/utils/supabaseClient";
import { authenticateToken } from "@/lib/auth/authenticateToken";

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token)
    return { success: false, error: "Unauthorized: No token provided" };
  return authenticateToken(token);
}

export async function GET(req) {
  // Auth
  const auth = await verifyAuth();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);

    const client_number = searchParams.get("client_number");
    const nationality = searchParams.get("nationality");
    const profession = searchParams.get("profession");

    let query = supabase
      .from("quotation_list")
      .select("client_number, client_name, nationality, profession")
      .eq("is_deleted", false);

    if (client_number) query = query.eq("client_number", client_number);
    if (nationality) query = query.eq("nationality", nationality);
    if (profession) query = query.eq("profession", profession);

    const { data, error } = await query;

    if (error) {
      console.error("Filter API - supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch filters" },
        { status: 500 }
      );
    }

    // Build lists
    const clientMap = new Map();
    const nationalitySet = new Set();
    const professionSet = new Set();

    for (const item of data) {
      if (item?.client_number && item?.client_name) {
        clientMap.set(item.client_number, {
          client_number: item.client_number,
          client_name: item.client_name,
        });
      }
      if (item?.nationality) nationalitySet.add(item.nationality);
      if (item?.profession) professionSet.add(item.profession);
    }

    // Convert to arrays
    const clients = Array.from(clientMap.values()).sort((a, b) =>
      a.client_name.localeCompare(b.client_name)
    );

    const nationalities = Array.from(nationalitySet)
      .map((n) => ({ nationality: n }))
      .sort((a, b) => a.nationality.localeCompare(b.nationality));

    const professions = Array.from(professionSet)
      .map((p) => ({ profession: p }))
      .sort((a, b) => a.profession.localeCompare(b.profession));

    return NextResponse.json({ clients, nationalities, professions });
  } catch (err) {
    console.error("Filter API - unhandled error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
