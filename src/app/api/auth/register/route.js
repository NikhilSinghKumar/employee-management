import { NextResponse } from "next/server";
import { hashPassword } from "@/utils/auth";
import { supabase } from "@/utils/supabaseClient";
import jwt from "jsonwebtoken";

export async function POST(req) {
  const { firstName, lastName, email, password } = await req.json();

  // Validate required fields
  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json({
      success: false,
      message: "All fields are required.",
    }, { status: 400 });
  }

  try {
    // Check if email is authorized and active in allowed_emails
    const { data: allowedEmail, error: allowedError } = await supabase
      .from("allowed_emails")
      .select("email, allowed_sections, is_active")
      .eq("email", email.toLowerCase())
      .single();

    if (allowedError || !allowedEmail) {
      return NextResponse.json({
        success: false,
        message: "Email not authorized to register.",
      }, { status: 403 });
    }
    if (!allowedEmail.is_active) {
      return NextResponse.json({
        success: false,
        message: "Email access is restricted.",
      }, { status: 403 });
    }

    // Check if user already exists
    const { data: existingUser, error: userFetchError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (userFetchError && userFetchError.code !== "PGRST116") {
      throw userFetchError;
    }
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: "User already exists with this email.",
      }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert new user with default values for added columns
    const { error: insertError } = await supabase.from("users").insert([
      {
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
        password: hashedPassword,
        allowed_sections: allowedEmail.allowed_sections, // Inherit sections from allowed_emails
        role: "user", // Default role
        is_active: true,
      },
    ]);

    if (insertError) {
      throw insertError;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: (await supabase.from("users").select("id").eq("email", email.toLowerCase()).single()).data.id,
        email: email.toLowerCase(),
        allowedSections: allowedEmail.allowed_sections,
        role: "user",
        isActive: true,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Set JWT as HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: "User registered successfully.",
    }, { status: 201 });

    response.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 3600, // 1 hour
      secure: process.env.NODE_ENV === "production", // Use secure in production
      sameSite: "strict",
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({
      success: false,
      message: "Registration failed.",
      error: error.message,
    }, { status: 500 });
  }
}