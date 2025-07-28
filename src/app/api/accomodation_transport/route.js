import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";
import { authenticateToken } from "@/lib/middleware/auth";
import { cookies } from "next/headers";

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return { success: false, error: "Unauthorized Access!" };
  }

  const authResult = await authenticateToken(token);
  console.log("Auth Result:", authResult); // Debug log
  return authResult;
}

export async function POST(req) {
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

  const payload = await req.json();
  const requiredFields = [
    "checkinId",
    "checkinName",
    "nationality",
    "passportNumber",
    "iqamaNumber",
    "clientName",
    "clientNumber",
    "location",
    "contractType",
    "checkinDate",
    "checkoutDate",
    "checkinStatus",
  ];

  const missingFields = requiredFields.filter((field) => !payload[field]);

  if (missingFields.length) {
    return NextResponse.json(
      { result: "Missing required fields", missingFields, success: false },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("accommodation_transport")
      .insert([
        {
          checkin_id: payload.checkinId,
          checkin_name: payload.checkinName,
          nationality: payload.nationality,
          passport_number: payload.passportNumber,
          iqama_number: payload.iqamaNumber,
          client_name: payload.clientName,
          client_number: payload.clientNumber,
          location: payload.location,
          contract_type: payload.contractType,
          checkin_date: payload.checkinDate,
          checkout_date: payload.checkoutDate,
          status: payload.checkinStatus,
          created_by: userId,
          edited_by: userId,
        },
      ])
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json(
      {
        result: "Insert successful",
        id: data.id,
        success: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json(
      { result: "Database error", error: error.message, success: false },
      { status: 500 }
    );
  }
}