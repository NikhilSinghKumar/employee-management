import { NextResponse } from "next/server";
import { hashPassword } from "@/utils/auth";
import { supabase } from "@/utils/supabaseClient";

export async function POST(req) {
  const { firstName, lastName, email, password } = await req.json();

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json({
      success: false,
      message: "All fields are required.",
    });
  }

  try {
    const { data: existingUser, error: userFetchError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: "User already exists with this email.",
      });
    }
    const hashedPassword = await hashPassword(password);

    const { error: insertError } = await supabase.from("users").insert([
      {
        first_name: firstName,
        last_name: lastName,
        email: email,
        password: hashedPassword,
      },
    ]);

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      message: "User registered successfully.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({
      success: false,
      message: "Registration failed.",
      error: error.message,
    });
  }
}
