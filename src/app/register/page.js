"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabaseClient";

export default function RegisterForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      setMessage({ text: "Please enter a valid email.", type: "error" });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }

    try {
      // Check if email already exists in Supabase
      const { data: existingUser, error } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (existingUser) {
        setMessage({ text: "Email is already registered.", type: "error" });
        return;
      }

      // Proceed with custom auth API
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          text: "Registration successful! Please log in.",
          type: "success",
        });
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      } else {
        setMessage({
          text: data.message || "Registration failed.",
          type: "error",
        });
      }
    } catch (error) {
      setMessage({
        text: "Server error. Please try again later.",
        type: "error",
      });
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md w-96"
      >
        <h2 className="text-xl font-semibold mb-4">New User!</h2>

        {message.text && (
          <div
            className={`p-1 mb-2 text-[14px] rounded-lg text-white ${
              message.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 text-[14px]">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              setMessage({ text: "", type: "" });
            }}
            className="w-full px-3 py-1 border rounded-lg text-[14px] focus:outline-none focus:ring focus:ring-blue-300"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-[14px]">Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              setMessage({ text: "", type: "" });
            }}
            className="w-full px-3 py-1 border rounded-lg text-[14px] focus:outline-none focus:ring focus:ring-blue-300"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-[14px]">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setMessage({ text: "", type: "" });
            }}
            className="w-full px-3 py-1 border rounded-lg text-[14px] focus:outline-none focus:ring focus:ring-blue-300"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-[14px]">
            Set Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setMessage({ text: "", type: "" });
            }}
            className="w-full px-3 py-1 border rounded-lg text-[14px] focus:outline-none focus:ring focus:ring-blue-300"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-[14px]">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setMessage({ text: "", type: "" });
            }}
            className="w-full px-3 py-1 border rounded-lg text-[14px] focus:outline-none focus:ring focus:ring-blue-300"
            required
          />
        </div>

        <button
          type="submit"
          className="w-35 bg-blue-500 text-white py-1 mb-3 rounded-lg hover:bg-blue-600 cursor-pointer"
        >
          Register
        </button>

        <p className="py-1 text-[14px]">
          Already have an account? Please{" "}
          <Link
            href="/"
            className="text-blue-500 text-[14px] hover:text-blue-600"
          >
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
