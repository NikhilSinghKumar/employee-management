// app/api/client_numbers/route.js
import { supabase } from "@/utils/supabaseClient";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticateToken } from "@/lib/auth/authenticateToken";

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
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("accommodation_transport")
      .select("client_number")
      .order("client_number", { ascending: true });

    if (error) throw error;

    // ✅ Filter out null, undefined, and empty strings
    const clientNumbers = [
      ...new Set(
        data
          .map((item) => item.client_number)
          .filter((num) => typeof num === "string" && num.trim() !== "")
      ),
    ];

    return NextResponse.json(clientNumbers, { status: 200 });
  } catch (err) {
    console.error("Error fetching client numbers:", err);
    return NextResponse.json(
      { error: "Failed to fetch client numbers" },
      { status: 500 }
    );
  }
}
