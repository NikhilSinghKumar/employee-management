import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";
import { authenticateToken } from "@/lib/auth/authenticateToken";
import { cookies } from "next/headers";

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return { success: false, error: "Unauthorized Access!" };
  }

  const authResult = await authenticateToken(token);
  return authResult;
}

export async function GET(req) {
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
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page")) || 1;
  const pageSize = parseInt(searchParams.get("pageSize")) || 10;

  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("accommodation_transport")
      .select("*", { count: "exact" })
      .eq("is_deleted", false)
      .order("iqama_number", { ascending: true })
      .range(from, to);

    if (search.trim() !== "") {
      query = query
        .or(
          `iqama_number.ilike.%${search}%,client_number.ilike.%${search}%,client_name.ilike.%${search}%,passport_number.ilike.%${search}%,status.ilike.%${search}%,contract_type.ilike.%${search}%`
        )
        .eq("is_deleted", false);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(error.message);

    return NextResponse.json(
      {
        result: "Records retrieved successfully",
        data,
        totalCount: count || 0,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Supabase query error:", error);
    return NextResponse.json(
      { result: "Database error", error: error.message, success: false },
      { status: 500 }
    );
  }
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
    "clientName",
    "clientNumber",
    "location",
    "contractType",
    "checkinDate",
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
          iqama_number: payload.iqamaNumber || null,
          client_name: payload.clientName,
          client_number: payload.clientNumber,
          location: payload.location,
          contract_type: payload.contractType,
          checkin_date: payload.checkinDate,
          checkout_date: payload.checkoutDate || null,
          status: payload.checkinStatus,
          created_by: userId,
          edited_by: userId,
          is_deleted: false,
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

export async function PATCH(req) {
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
  const { id, ...updates } = payload;

  if (!id) {
    return NextResponse.json(
      { result: "Record ID is required", success: false },
      { status: 400 }
    );
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { result: "No fields provided for update", success: false },
      { status: 400 }
    );
  }

  if ("checkoutDate" in updates) {
    updates.checkoutDate = updates.checkoutDate || null;
  }

  try {
    const { data, error } = await supabase
      .from("accommodation_transport")
      .update({
        ...updates,
        edited_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id) // No created_by restriction
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    if (!data) {
      return NextResponse.json(
        { result: "Record not found", success: false },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        result: "Update successful",
        data,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Supabase update error:", error);
    return NextResponse.json(
      { result: "Database error", error: error.message, success: false },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
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

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { result: "Record ID is required", success: false },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("accommodation_transport")
      .update({
        is_deleted: true,
        edited_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id) // No created_by restriction
      .eq("is_deleted", false)
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    if (!data) {
      return NextResponse.json(
        { result: "Record not found", success: false },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        result: "Delete successful",
        id: data.id,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Supabase delete error:", error);
    return NextResponse.json(
      { result: "Database error", error: error.message, success: false },
      { status: 500 }
    );
  }
}
